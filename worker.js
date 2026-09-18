// Bilet Avcısı - Cloudflare Worker
// Adres: /api/calendar, /api/anywhere, /api/deals
// Token tarayıcıya hiç gitmez; Cloudflare'deki TP_TOKEN gizli değişkeninden okunur.

const TP = 'https://api.travelpayouts.com';
const CODE = /^[A-Z]{3}$/;
const MONTH = /^\d{4}-\d{2}$/;

const SITE = 'https://biletavcisi.net';

// Fiyat hafızası taranacak kalkış şehirleri ve kaç ay ileriye bakılacağı.
const DEAL_ORIGINS = ['IST', 'ESB', 'IZM', 'AYT'];
const DEAL_MONTHS_AHEAD = 2; // bu ay + gelecek 2 ay
const HISTORY_LEN = 45;      // her rota için saklanan gün sayısı
const MIN_HISTORY_FOR_DEAL = 5; // karşılaştırma yapılabilmesi için gereken en az gün sayısı
const ALERT_THRESHOLD_PCT = 25; // Telegram'a düşecek fırsat için minimum indirim yüzdesi
const ALERT_MAX_PER_RUN = 6;    // bir taramada en fazla kaç mesaj gönderilsin
const ALERT_COOLDOWN_DAYS = 3;  // aynı rota kaç gün boyunca tekrar paylaşılmasın

// Telegram mesajlarında kullanılan kısa şehir adları
const CITY_NAMES = {
  IST: 'İstanbul', ESB: 'Ankara', IZM: 'İzmir', AYT: 'Antalya',
  BCN: 'Barselona', PRG: 'Prag', ROM: 'Roma', MIL: 'Milano', PAR: 'Paris', AMS: 'Amsterdam',
  BER: 'Berlin', MUC: 'Münih', FRA: 'Frankfurt', VIE: 'Viyana', BUD: 'Budapeşte', ATH: 'Atina',
  LON: 'Londra', CPH: 'Kopenhag', STO: 'Stockholm', TLL: 'Tallinn', WAW: 'Varşova',
  BEG: 'Belgrad', SJJ: 'Saraybosna', MAD: 'Madrid', LIS: 'Lizbon', ZRH: 'Zürih',
  TBS: 'Tiflis', BAK: 'Bakü', DXB: 'Dubai', HRG: 'Hurghada', SSH: 'Şarm El Şeyh',
  MLE: 'Maldivler', BKK: 'Bangkok', TYO: 'Tokyo', NYC: 'New York'
};

// ---------- SEO: popüler rota sayfaları ----------
// Her biri /ucuz-ucak-bileti/<slug> adresinde, kendi başlığı ve metniyle yayınlanır.
const ROUTE_PAGES = [
  { slug: 'istanbul-roma', o: 'IST', d: 'ROM', dn: 'Roma', hrs: '2 saat 35 dakika', schengen: true,
    text: 'Roma, İstanbul\'dan en kısa uçuş sürelerinden birine sahip Avrupa başkentlerinden biri. Kısa mesafe sayesinde hafta sonu kaçamağı olarak da tercih ediliyor. Kolezyum, Vatikan ve Trastevere gibi bölgeler yürüme mesafesinde olduğu için şehir içi ulaşıma çok zaman ayırmadan yoğun bir gezi programı yapılabilir.',
    tips: 'Roma\'ya en uygun fiyatlar genellikle kış aylarında (Ocak-Mart, yılbaşı hariç) ve sonbahar başında (Ekim-Kasım) görülür. Yaz ayları hem sıcak hem de turist yoğunluğu yüksek olduğu için fiyatlar da buna paralel yükselir.' },
  { slug: 'istanbul-barselona', o: 'IST', d: 'BCN', dn: 'Barselona', hrs: '4 saat 5 dakika', schengen: true,
    text: 'Barselona, Gaudí\'nin mimarisi, Akdeniz sahili ve canlı gece hayatıyla Türkiye\'den en çok tercih edilen İspanya rotalarının başında geliyor. İstanbul\'a göre biraz daha uzun bir uçuş süresine sahip olsa da genellikle direkt seferlerle ulaşılabiliyor.',
    tips: 'Yaz aylarında (Haziran-Ağustos) hem fiyatlar hem de otel doluluğu zirve yapıyor. Nisan-Mayıs ve Eylül-Ekim döneminde hava hâlâ ılık, fiyatlar ise daha makul seviyede oluyor.' },
  { slug: 'istanbul-berlin', o: 'IST', d: 'BER', dn: 'Berlin', hrs: '3 saat 5 dakika', schengen: true,
    text: 'Berlin, Türkiye ile arasındaki yoğun diaspora bağlantısı sayesinde İstanbul\'dan en sık uçulan Avrupa şehirlerinden biri. Bu yoğunluk, rekabetçi fiyatların ve sık sefer seçeneklerinin de sebebi.',
    tips: 'Sık uçulan bir hat olduğu için fiyat dalgalanması diğer rotalara göre biraz daha az. Yine de okul tatillerine (yılbaşı, yarıyıl, yaz) denk gelmeyen hafta içi günler genelde daha ucuza geliyor.' },
  { slug: 'istanbul-londra', o: 'IST', d: 'LON', dn: 'Londra', hrs: '4 saat 5 dakika', schengen: false,
    text: 'Londra, Schengen alanına dahil olmadığı için ayrı bir vize süreci gerektiriyor, ancak Türkiye\'den en popüler uzun menzilli Avrupa rotalarından biri olmayı sürdürüyor. Şehrin iki büyük havalimanı (Heathrow ve Gatwick) farklı fiyat ve zaman seçenekleri sunuyor.',
    tips: 'Yılbaşı ve yaz tatili dönemleri dışında, özellikle Şubat-Mart ve Kasım aylarında fiyatlar belirgin şekilde düşüyor.' },
  { slug: 'istanbul-amsterdam', o: 'IST', d: 'AMS', dn: 'Amsterdam', hrs: '3 saat 40 dakika', schengen: true,
    text: 'Amsterdam, kanalları ve müzeleriyle kısa şehir turlarında öne çıkan bir rota. Hollanda\'nın diğer şehirlerine tren bağlantısı iyi olduğu için tek biletle çok noktalı bir gezi planlamak da mümkün.',
    tips: 'İlkbahar (Mart-Nisan, lale sezonu) fiyatları yükseltebilir; bunun dışında sonbahar ayları genellikle daha uygun.' },
  { slug: 'istanbul-paris', o: 'IST', d: 'PAR', dn: 'Paris', hrs: '3 saat 50 dakika', schengen: true,
    text: 'Paris, Avrupa\'nın en çok ziyaret edilen şehirlerinden biri olduğu için İstanbul\'dan yıl boyunca yoğun talep gören bir hat. Birden fazla havalimanına (Charles de Gaulle, Orly) inen seferler karşılaştırma yapmayı gerektirebilir.',
    tips: 'Moda haftaları ve büyük fuarlar döneminde (özellikle Eylül-Ekim) fiyatlar belirgin şekilde artar; bu dönemlerden kaçınmak tasarruf sağlar.' },
  { slug: 'istanbul-atina', o: 'IST', d: 'ATH', dn: 'Atina', hrs: '1 saat 20 dakika', schengen: true,
    text: 'Atina, kısa uçuş süresi sayesinde İstanbul\'dan hafta sonu tatili için en pratik seçeneklerden biri. Antik Yunan tarihine kısa sürede erişim isteyenler için düşük maliyetli bir alternatif oluşturuyor.',
    tips: 'Kısa mesafe ve sık sefer seçeneği sayesinde fiyatlar genelde diğer Avrupa rotalarına göre daha istikrarlı; yine de yaz ayları Ege turizmi nedeniyle daha pahalı.' },
  { slug: 'istanbul-budapeste', o: 'IST', d: 'BUD', dn: 'Budapeşte', hrs: '1 saat 50 dakika', schengen: true,
    text: 'Budapeşte, Tuna Nehri kıyısındaki mimarisi ve termal kaplıcalarıyla Doğu Avrupa\'nın en çok tercih edilen şehirlerinden biri. Kısa uçuş süresi ve genelde uygun fiyat seviyesi, kısa tatiller için cazip kılıyor.',
    tips: 'Yılbaşı pazarları dönemi (Kasım sonu-Aralık) hem güzel hem de yoğun; fiyattan tasarruf etmek isteyenler için Ocak-Mart arası daha sakin ve ucuz.' },
  { slug: 'istanbul-prag', o: 'IST', d: 'PRG', dn: 'Prag', hrs: '2 saat 35 dakika', schengen: true,
    text: 'Prag, ortaçağ dokusunu koruyan sokakları ve nispeten uygun yaşam maliyetiyle Türkiye\'den gidilen popüler Orta Avrupa rotalarından biri. Şehir merkezinin kompakt olması, kısa geziler için idealdir.',
    tips: 'Yaz ortası ve yılbaşı dönemi dışında, Şubat-Mart ayları genelde en uygun fiyatların görüldüğü zaman dilimi.' },
  { slug: 'istanbul-viyana', o: 'IST', d: 'VIE', dn: 'Viyana', hrs: '2 saat 10 dakika', schengen: true,
    text: 'Viyana, klasik müzik ve imparatorluk mimarisiyle bilinen, İstanbul\'dan kısa sürede ulaşılabilen bir başka Orta Avrupa rotası. Avusturya\'nın diğer bölgelerine (Salzburg, Alp kasabaları) tren bağlantısı da güçlü.',
    tips: 'Yılbaşı konserleri dönemi dışında kış ayları genelde daha uygun fiyatlı; Aralık ortası ile Ocak arası dikkatli planlama gerektirir.' },
  { slug: 'istanbul-dubai', o: 'IST', d: 'DXB', dn: 'Dubai', hrs: '4 saat 50 dakika', schengen: false,
    text: 'Dubai, Schengen sürecine gerek kalmadan (Türk vatandaşları için vizesiz) ulaşılabilen popüler bir uzun menzilli rota. Alışveriş, çöl turları ve modern mimarisiyle kısa tatillerde tercih ediliyor.',
    tips: 'Yaz ayları (Haziran-Ağustos) aşırı sıcaklık nedeniyle daha az tercih edilir ve genelde bu dönemde fiyatlar düşer; kış ayları ise hem hava hem talep açısından zirve dönemidir.' },
  { slug: 'istanbul-milano', o: 'IST', d: 'MIL', dn: 'Milano', hrs: '3 saat 5 dakika', schengen: true,
    text: 'Milano, moda ve tasarım dünyasının merkezlerinden biri olmasının yanında kuzey İtalya\'daki göl bölgesine (Como, Maggiore) de yakın bir geçiş noktası. İş seyahatleri ve alışveriş turları için sık tercih edilen bir rota.',
    tips: 'Moda haftaları (Şubat-Mart ve Eylül) döneminde fiyatlar belirgin şekilde yükselir; bu tarihlerden kaçınmak avantaj sağlar.' },
  { slug: 'istanbul-tiflis', o: 'IST', d: 'TBS', dn: 'Tiflis', hrs: '2 saat 5 dakika', schengen: false,
    text: 'Tiflis, kısa uçuş süresi ve vizesiz giriş imkanıyla (Türk vatandaşları için) son yıllarda hızla popülerleşen bir rota. Eski şehir dokusu, şarap bağları ve düşük yaşam maliyeti öne çıkan avantajları arasında.',
    tips: 'Kısa mesafe ve düşük rekabet nedeniyle fiyatlar genelde istikrarlı; yine de yılbaşı ve yaz ortası dönemlerinde bir miktar artış görülebilir.' },
  { slug: 'istanbul-baku', o: 'IST', d: 'BAK', dn: 'Bakü', hrs: '2 saat 40 dakika', schengen: false,
    text: 'Bakü, Hazar Denizi kıyısındaki modern mimarisi ve tarihi İçerişehir\'i ile Türkiye\'den vizesiz ulaşılabilen bir başka popüler rota. Kültürel yakınlık ve kısa uçuş süresi, kısa tatiller için cazip kılıyor.',
    tips: 'Formula 1 gibi büyük etkinlik dönemleri (genellikle sonbahar) hariç, fiyatlar yıl boyunca nispeten istikrarlı seyrediyor.' }
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      if (request.method !== 'GET') return json({ error: 'Sadece GET desteklenir.' }, 405);
      return handleApi(request, env, ctx, url.pathname.split('/')[2] || '');
    }
    if (url.pathname.startsWith('/ucuz-ucak-bileti/')) {
      const slug = url.pathname.split('/')[2] || '';
      const route = ROUTE_PAGES.find(r => r.slug === slug);
      if (route) return handleRoutePage(route, env, ctx);
      // Bilinmeyen slug: gerçek siteye yönlendir, 404 çöplüğü oluşturma
      return Response.redirect(SITE + '/', 302);
    }
    if (url.pathname === '/sitemap.xml') return sitemap();
    if (url.pathname === '/robots.txt') return new Response(
      'User-agent: *\nAllow: /\nSitemap: ' + SITE + '/sitemap.xml\n',
      { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
    // /api dışındaki her şey: site dosyaları (index.html, app.js, style.css)
    return env.ASSETS.fetch(request);
  },

  // Her gün otomatik çalışır (bkz. wrangler.jsonc > triggers.crons).
  // Popüler rotaların fiyatını Travelpayouts'tan çekip KV'deki fiyat hafızasına ekler.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runDealScan(env));
  }
};

// ---------- rota sayfası ----------

async function handleRoutePage(route, env, ctx) {
  const cache = caches.default;
  const cacheKey = new Request(SITE + '/ucuz-ucak-bileti/' + route.slug, { method: 'GET' });
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  var cheapest = null;
  if (env.TP_TOKEN) {
    try { cheapest = await cheapestForRoute(route.o, route.d, env); } catch (e) { cheapest = null; }
  }
  const html = routePageHTML(route, cheapest);
  const res = new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=21600' }
  });
  ctx.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}

async function cheapestForRoute(origin, dest, env) {
  const m = new Date(); const month = m.getFullYear() + '-' + String(m.getMonth() + 1).padStart(2, '0');
  const r = await tp('/aviasales/v3/prices_for_dates', {
    origin, destination: dest, departure_at: month, unique: 'false', sorting: 'price',
    direct: 'false', limit: '1', page: '1', currency: 'try', one_way: 'true'
  }, env);
  const item = (r.data || [])[0];
  if (!item || !item.price) return null;
  return { price: Math.round(item.price), date: (item.departure_at || '').slice(0, 10) };
}

function trDate(iso) {
  if (!iso) return '';
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const p = iso.split('-').map(Number);
  return p[2] + ' ' + months[p[1] - 1] + ' ' + p[0];
}
function nf(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function hesc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function routePageHTML(route, cheapest) {
  const title = 'İstanbul\'dan ' + route.dn + '\'a Ucuz Uçak Bileti | Bilet Avcısı';
  const priceLine = cheapest
    ? 'Bu ay görülen en düşük tek yön fiyat: ' + nf(cheapest.price) + ' TL (' + trDate(cheapest.date) + ')'
    : 'Güncel fiyat takvimi için aşağıdaki bağlantıyı kullan.';
  const desc = 'İstanbul - ' + route.dn + ' uçuşu yaklaşık ' + route.hrs + ' sürer. ' + priceLine;
  const others = ROUTE_PAGES.filter(r => r.slug !== route.slug).slice(0, 6);

  return '<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>' + hesc(title) + '</title>' +
    '<meta name="description" content="' + hesc(desc) + '">' +
    '<link rel="canonical" href="' + SITE + '/ucuz-ucak-bileti/' + route.slug + '">' +
    '<meta property="og:title" content="' + hesc(title) + '">' +
    '<meta property="og:description" content="' + hesc(desc) + '">' +
    '<meta property="og:locale" content="tr_TR">' +
    '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ctext y=\'.9em\' font-size=\'90\'%3E%E2%9C%88%EF%B8%8F%3C/text%3E%3C/svg%3E">' +
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet">' +
    '<link rel="stylesheet" href="/style.css">' +
    '<script type="application/ld+json">' + JSON.stringify({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'İstanbul\'dan ' + route.dn + '\'a uçuş kaç saat sürer?', acceptedAnswer: { '@type': 'Answer', text: 'Direkt seferlerde yaklaşık ' + route.hrs + '. Aktarmalı seferlerde bu süre değişebilir.' } },
        { '@type': 'Question', name: route.dn + '\'a en ucuz ne zaman gidilir?', acceptedAnswer: { '@type': 'Answer', text: route.tips } }
      ]
    }).replace(/</g, '\\u003c') + '</script>' +
    '</head><body><div class="wrap">' +
    '<header class="top"><a class="logo" href="/"><span class="logo-mark"><svg viewBox="0 0 24 24" fill="#000"><path d="M21.5 15.5v-2L13 8.5V3.2a1.7 1.7 0 0 0-3.4 0v5.3l-8.5 5v2l8.5-2.6v5.2l-2.3 1.7v1.6l4-1.2 4 1.2v-1.6L13 20.1v-5.2z"/></svg></span><span class="logo-word">Bilet Avcısı</span></a>' +
    '<nav class="nav"><a href="/">Anasayfa</a><a href="/#firsatlar">Fırsatlar</a><a href="/#vize">Vize</a></nav></header>' +
    '<section class="hero"><h1>İstanbul\'dan ' + hesc(route.dn) + '\'a Ucuz Uçak Bileti</h1>' +
    '<p>' + hesc(desc) + '</p></section>' +
    '<section><div class="detail"><p>' + hesc(route.text) + '</p>' +
    '<h2 style="font-size:22px">Ne zaman gitmeli?</h2><p>' + hesc(route.tips) + '</p>' +
    (route.schengen ? '<p class="note">' + hesc(route.dn) + ', Schengen bölgesinde. Vize başvuru merkezi ve gerekli belgeler için <a href="/#vize">vize rehberimize</a> bakabilirsin.</p>' : '') +
    '<a class="btn" href="/?from=IST&amp;to=' + route.d + '#ara">Fiyat takvimini gör</a></div></section>' +
    '<section><h2>Diğer popüler rotalar</h2><ul class="board">' +
    others.map(r => '<li><a class="row" href="/ucuz-ucak-bileti/' + r.slug + '"><span class="route">İstanbul – ' + hesc(r.dn) + '</span><span class="when">yaklaşık ' + hesc(r.hrs) + '</span></a></li>').join('') +
    '</ul></section>' +
    '<footer><p>Bilet Avcısı reklamsızdır ve bilet satmaz; seni bileti satan siteye yönlendirir.</p><p>Fırsatları kaçırma: <a href="https://t.me/biletavcisinet" target="_blank" rel="noopener">Telegram kanalımız</a></p></footer>' +
    '</div></body></html>';
}

function sitemap() {
  const entries = ['<url><loc>' + SITE + '/</loc><changefreq>daily</changefreq></url>']
    .concat(ROUTE_PAGES.map(r => '<url><loc>' + SITE + '/ucuz-ucak-bileti/' + r.slug + '</loc><changefreq>daily</changefreq></url>'));
  const xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + entries.join('') + '</urlset>';
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

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
// Ayrıca gerçekten öne çıkan (normalden %25+ ucuz) rotaları Telegram kanalına gönderir.
async function runDealScan(env) {
  if (!env.TP_TOKEN || !env.PRICE_HISTORY) return; // ayarlar eksikse sessizce çık
  const today = new Date().toISOString().slice(0, 10);
  const months = [];
  const base = new Date();
  for (let i = 0; i <= DEAL_MONTHS_AHEAD; i++) {
    const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
    months.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
  }

  const alerts = [];

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
        if (!bestByDest[dest] || price < bestByDest[dest].price) {
          bestByDest[dest] = { price, link: x.link || null, date: x.departure_at || null };
        }
      }
    }
    // Bulunan her rota için: önce eski hafızayla karşılaştır (fırsat mı?), sonra bugünün fiyatını ekle.
    for (const [dest, info] of Object.entries(bestByDest)) {
      const oldHist = await readHistory(env, origin, dest);
      const oldBase = baseline(oldHist);
      if (oldBase) {
        const pct = Math.round((1 - info.price / oldBase) * 100);
        if (pct >= ALERT_THRESHOLD_PCT) {
          const cooled = await env.PRICE_HISTORY.get('posted:' + origin + ':' + dest);
          if (!cooled) alerts.push({ origin, dest, price: info.price, pct, link: info.link, date: info.date });
        }
      }
      await appendHistory(env, origin, dest, today, info.price);
    }
  }

  // En yüksek indirimden başlayarak, en fazla ALERT_MAX_PER_RUN kadar mesaj gönder.
  alerts.sort((a, b) => b.pct - a.pct);
  for (const a of alerts.slice(0, ALERT_MAX_PER_RUN)) {
    await sendDealAlert(env, a);
    await env.PRICE_HISTORY.put('posted:' + a.origin + ':' + a.dest, '1', { expirationTtl: ALERT_COOLDOWN_DAYS * 86400 });
  }
}

async function sendDealAlert(env, a) {
  if (!env.TG_BOT_TOKEN || !env.TG_CHAT) return; // Telegram ayarlanmadıysa sessizce atla
  const on = CITY_NAMES[a.origin] || a.origin, dn = CITY_NAMES[a.dest] || a.dest;
  const link = bookLink(env, a.link, a.origin, a.dest, a.date, null);
  const text = '✈️ ' + on + ' – ' + dn + '\n' +
    nf(a.price) + ' TL — normalden %' + a.pct + ' ucuz\n' +
    (a.date ? '📅 ' + trDate(a.date.slice(0, 10)) + '\n' : '') +
    link;
  try {
    await fetch('https://api.telegram.org/bot' + env.TG_BOT_TOKEN + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TG_CHAT, text, disable_web_page_preview: false })
    });
  } catch (e) { /* Telegram'a ulaşılamazsa taramanın geri kalanını bozma */ }
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
function bad(msg) { const e =
