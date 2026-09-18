// Bilet Avcısı - Cloudflare Worker
// Adres: /api/calendar, /api/anywhere, /api/deals
// Token tarayıcıya hiç gitmez; Cloudflare'deki TP_TOKEN gizli değişkeninden okunur.

const TP = 'https://api.travelpayouts.com';
const CODE = /^[A-Z]{3}$/;
const MONTH = /^\d{4}-\d{2}$/;

// Fiyat hafızası taranacak kalkış şehirleri ve kaç ay ileriye bakılacağı.
const DEAL_ORIGINS = ['IST', 'ESB', 'IZM', 'AYT'];
const DEAL_MONTHS_AHEAD = 2; // bu ay + gelecek 2 ay
const HISTORY_LEN = 45;      // her rota için saklanan gün sayısı
const MIN_HISTORY_FOR_DEAL = 5; // karşılaştırma yapılabilmesi için gereken en az gün sayısı

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      if (request.method !== 'GET') return json({ error: 'Sadece GET desteklenir.' }, 405);
      return handleApi(request, env, ctx, url.pathname.split('/')[2] || '');
    }
    // /api dışındaki her şey: site dosyaları (index.html, app.js, style.css)
    return env.ASSETS.fetch(request);
  },

  // Her gün otomatik çalışır (bkz. wrangler.jsonc > triggers.crons).
  // Popüler rotaların fiyatını Travelpayouts'tan çekip KV'deki fiyat hafızasına ekler.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runDealScan(env));
  }
};

async function handleApi(request, env, ctx, ep) {
  const url = new URL(request.url);

  if (!env.TP_TOKEN) return json({ error: 'Sunucu ayarı eksik: TP_TOKEN tanımlı değil.' }, 500);

  // Önbellek: aynı sorgu 3-6 saat boyunca API'ye tekrar gitmez
  const cache = caches.default;
  const cacheKey = new Request(url.toString(), { method: 'GET' });
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  let body, ttl = 10800;
  try {
    const q = url.searchParams;
    if (ep === 'calendar') body = await calendar(q, env);
    else if (ep === 'anywhere') body = await anywhere(q, env);
    else if (ep === 'deals') { body = await deals(q, env); ttl = 21600; }
    else return json({ error: 'Bilinmeyen istek.' }, 404);
  } catch (e) {
    const status = e.status || 502;
    return json({ error: e.userMessage || 'Fiyat servisine şu an ulaşılamıyor. Biraz sonra tekrar dene.' }, status);
  }

  const res = json(body, 200, { 'Cache-Control': 'public, max-age=' + ttl });
  ctx.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}

// ---------- uç noktalar ----------

async function calendar(q, env) {
  const o = code(q.get('origin')), d = code(q.get('destination'));
  const month = q.get('month');
  if (!MONTH.test(month || '')) throw bad('Ay bilgisi hatalı.');
  const rt = q.get('rt') === '1';
  const stay = clampInt(q.get('stay'), 1, 30, 7);

  const p = { origin: o, destination: d, departure_at: month, group_by: 'departure_at', currency: 'try' };
  if (rt) { p.min_trip_duration = stay; p.max_trip_duration = stay; }
  const r = await tp('/aviasales/v3/grouped_prices', p, env);
  let days = Object.values(r.data || {}).map(t => norm(t, env));
  if (rt) days = days.filter(t => t.ret);

  // Gidiş-dönüş için yedek yöntem (eski takvim uç noktası, kalış süresi destekli)
  if (rt && !days.length) {
    const r2 = await tp('/v1/prices/calendar', {
      origin: o, destination: d, depart_date: month, departure_date: month,
      calendar_type: 'departure_date', length: stay, currency: 'try'
    }, env);
    days = Object.values(r2.data || {}).map(t => norm(t, env)).filter(t => t.ret);
  }

  days = days.filter(t => t.date.startsWith(month)).sort((a, b) => a.date.localeCompare(b.date));
  return { origin: o, destination: d, month, rt, stay, days };
}

async function anywhere(q, env) {
  const o = code(q.get('origin'));
  const month = q.get('month');
  if (!MONTH.test(month || '')) throw bad('Ay bilgisi hatalı.');
  const rt = q.get('rt') === '1';

  const r = await tp('/aviasales/v3/prices_for_dates', {
    origin: o, departure_at: month, unique: 'true', sorting: 'price',
    direct: 'false', limit: '100', page: '1', currency: 'try', one_way: rt ? 'false' : 'true'
  }, env);

  const best = {};
  for (const t of (r.data || []).map(x => norm(x, env))) {
    if (rt && !t.ret) continue;
    if (!best[t.destination] || t.price < best[t.destination].price) best[t.destination] = t;
  }
  const list = Object.values(best).sort((a, b) => a.price - b.price).slice(0, 30);
  return { origin: o, month, rt, list };
}

async function deals(q, env) {
  const o = code(q.get('origin'));
  const r = await tp('/aviasales/v3/get_special_offers', { origin: o, currency: 'try', locale: 'tr' }, env);
  let list = (r.data || []).map(x => ({
    ...norm(x, env),
    originName: x.origin_name || null,
    destName: x.destination_name || null,
    airlineTitle: x.airline_title || null
  }));

  // Fiyat hafızamız varsa (KV), her teklifin gerçekten "normalden ne kadar ucuz"
  // olduğunu kendi geçmiş verimizle hesaplayıp ekliyoruz.
  if (env.PRICE_HISTORY) {
    list = await Promise.all(list.map(async x => {
      const hist = await readHistory(env, o, x.destination);
      const base = baseline(hist);
      const discountPct = base ? Math.round((1 - x.price / base) * 100) : null;
      return { ...x, discountPct, baselinePrice: base };
    }));
    // Önce en yüksek gerçek indirim, sonra en düşük fiyat
    list.sort((a, b) => (b.discountPct ?? -999) - (a.discountPct ?? -999) || a.price - b.price);
  } else {
    list.sort((a, b) => a.price - b.price);
  }

  return { origin: o, list: list.slice(0, 20) };
}

// ---------- fiyat hafızası (fırsat avcısı) ----------

// Her gün çalışır: popüler rotaların en ucuz fiyatını bulup KV'ye tarih damgalı kaydeder.
async function runDealScan(env) {
  if (!env.TP_TOKEN || !env.PRICE_HISTORY) return; // ayarlar eksikse sessizce çık
  const today = new Date().toISOString().slice(0, 10);
  const months = [];
  const base = new Date();
  for (let i = 0; i <= DEAL_MONTHS_AHEAD; i++) {
    const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
    months.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
  }

  for (const origin of DEAL_ORIGINS) {
    const bestByDest = {};
    for (const month of months) {
      let r;
      try {
        r = await tp('/aviasales/v3/prices_for_dates', {
          origin, departure_at: month, unique: 'true', sorting: 'price',
          direct: 'false', limit: '100', page: '1', currency: 'try', one_way: 'true'
        }, env);
      } catch (e) {
        continue; // bu ay/şehir için veri alınamadıysa diğerlerine devam et
      }
      for (const x of (r.data || [])) {
        const dest = x.destination || x.destination_code;
        const price = Math.round(x.price ?? 0);
        if (!dest || !price) continue;
        if (!bestByDest[dest] || price < bestByDest[dest]) bestByDest[dest] = price;
      }
    }
    // Bulunan her rota için bugünün fiyatını hafızaya ekle
    for (const [dest, price] of Object.entries(bestByDest)) {
      await appendHistory(env, origin, dest, today, price);
    }
  }
}

async function readHistory(env, origin, dest) {
  try {
    const raw = await env.PRICE_HISTORY.get('hist:' + origin + ':' + dest);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

async function appendHistory(env, origin, dest, dateStr, price) {
  const key = 'hist:' + origin + ':' + dest;
  let hist = await readHistory(env, origin, dest);
  hist = hist.filter(h => h.d !== dateStr); // aynı gün tekrar çalışırsa üzerine yaz
  hist.push({ d: dateStr, p: price });
  if (hist.length > HISTORY_LEN) hist = hist.slice(hist.length - HISTORY_LEN);
  await env.PRICE_HISTORY.put(key, JSON.stringify(hist), { expirationTtl: 90 * 86400 });
}

// Geçmiş fiyatların medyanını (tipik fiyat) döndürür; yeterli veri yoksa null.
function baseline(hist) {
  if (!hist || hist.length < MIN_HISTORY_FOR_DEAL) return null;
  const vals = hist.map(h => h.p).sort((a, b) => a - b);
  const mid = Math.floor(vals.length / 2);
  return vals.length % 2 ? vals[mid] : Math.round((vals[mid - 1] + vals[mid]) / 2);
}

// ---------- yardımcılar ----------

async function tp(path, params, env) {
  const u = new URL(TP + path);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) u.searchParams.set(k, String(v));
  const res = await fetch(u.toString(), {
    headers: { 'X-Access-Token': env.TP_TOKEN, 'Accept-Encoding': 'gzip, deflate' }
  });
  if (res.status === 401 || res.status === 403) {
    const e = new Error('auth'); e.status = 500; e.userMessage = 'API token geçersiz görünüyor. Cloudflare\'deki TP_TOKEN değerini kontrol et.'; throw e;
  }
  if (res.status === 429) {
    const e = new Error('rate'); e.status = 503; e.userMessage = 'Çok fazla istek geldi. Bir dakika sonra tekrar dene.'; throw e;
  }
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const j = await res.json();
  if (j && j.success === false) throw new Error(j.error || 'API hatası');
  return j;
}

function norm(t, env) {
  const dep = t.departure_at || t.depart_date || '';
  const ret = t.return_at || t.return_date || '';
  const o = t.origin || t.origin_code, d = t.destination || t.destination_code;
  return {
    origin: o,
    destination: d,
    originAirport: t.origin_airport || null,
    destinationAirport: t.destination_airport || null,
    date: dep.slice(0, 10),
    depart: dep || null,
    ret: ret ? ret : null,
    price: Math.round(t.price ?? t.value ?? 0),
    airline: t.airline || null,
    transfers: t.transfers ?? t.number_of_changes ?? null,
    returnTransfers: t.return_transfers ?? null,
    link: bookLink(env, t.link, o, d, dep, ret)
  };
}

function bookLink(env, path, o, d, dep, ret) {
  const host = env.BOOK_HOST || 'https://www.aviasales.com';
  let full;
  if (path) {
    let p = path.startsWith('/') ? path : '/' + path;
    if (!p.startsWith('/search')) p = '/search' + p;
    full = host + p;
  } else {
    // Link yoksa (eski uç nokta) arama linkini kendimiz kuruyoruz
    const dm = s => s ? s.slice(8, 10) + s.slice(5, 7) : '';
    full = host + '/search/' + o + dm(dep) + d + dm(ret) + '1';
  }
  if (env.TP_MARKER) full += (full.includes('?') ? '&' : '?') + 'marker=' + encodeURIComponent(env.TP_MARKER);
  return full;
}

function code(v) {
  const c = (v || '').toUpperCase();
  if (!CODE.test(c)) throw bad('Havalimanı kodu hatalı.');
  return c;
}
function clampInt(v, min, max, def) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
}
function bad(msg) { const e = new Error(msg); e.status = 400; e.userMessage = msg; return e; }
function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extra }
  });
}
