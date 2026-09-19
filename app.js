(function () {
  'use strict';

  // ---------- sabit veriler ----------
  var TR = [
    { c: 'IST', n: 'İstanbul', s: 'İST + SAW' }, { c: 'ESB', n: 'Ankara' }, { c: 'IZM', n: 'İzmir' },
    { c: 'AYT', n: 'Antalya' }, { c: 'ADA', n: 'Adana' }, { c: 'TZX', n: 'Trabzon' },
    { c: 'GZT', n: 'Gaziantep' }, { c: 'DLM', n: 'Dalaman' }, { c: 'BJV', n: 'Bodrum' },
    { c: 'OSL', n: 'Oslo', intl: true } // deneme: Türkiye dışı bir çıkış şehri
  ];
  // "Nereye" listesinde çıkan yurt dışı şehirler
  var INTL = [
    ['BCN', 'Barselona'], ['PRG', 'Prag'], ['ROM', 'Roma'], ['MIL', 'Milano'], ['PAR', 'Paris'], ['AMS', 'Amsterdam'],
    ['BER', 'Berlin'], ['MUC', 'Münih'], ['FRA', 'Frankfurt'], ['VIE', 'Viyana'], ['BUD', 'Budapeşte'], ['ATH', 'Atina'],
    ['LON', 'Londra'], ['CPH', 'Kopenhag'], ['STO', 'Stockholm'], ['TLL', 'Tallinn'], ['WAW', 'Varşova'],
    ['BEG', 'Belgrad'], ['SJJ', 'Saraybosna'], ['MAD', 'Madrid'], ['LIS', 'Lizbon'], ['ZRH', 'Zürih'],
    ['TBS', 'Tiflis'], ['BAK', 'Bakü'], ['DXB', 'Dubai'], ['HRG', 'Hurghada'], ['SSH', 'Şarm El Şeyh'],
    ['MLE', 'Maldivler'], ['BKK', 'Bangkok'], ['TYO', 'Tokyo'], ['NYC', 'New York'], ['ECN', 'Lefkoşa (Ercan)']
  ];
  // API'den gelen kodların Türkçe adları (listede olmayanlar kod olarak görünür)
  var NAMES = {
    SAW: 'İstanbul', ADB: 'İzmir', VAN: 'Van', DIY: 'Diyarbakır', ERZ: 'Erzurum', KYA: 'Konya', ASR: 'Kayseri',
    SZF: 'Samsun', MLX: 'Malatya', EZS: 'Elazığ', HTY: 'Hatay', GZP: 'Gazipaşa', NAV: 'Kapadokya', DNZ: 'Denizli',
    EDO: 'Edremit', BAL: 'Batman', MQM: 'Mardin', GNY: 'Şanlıurfa', KSY: 'Kars', ERC: 'Erzincan', MSR: 'Muş',
    DUS: 'Düsseldorf', CGN: 'Köln', STR: 'Stuttgart', HAM: 'Hamburg', HAJ: 'Hannover', NUE: 'Nürnberg',
    BRU: 'Brüksel', GVA: 'Cenevre', BSL: 'Basel', OPO: 'Porto', VCE: 'Venedik', NAP: 'Napoli', BLQ: 'Bologna',
    SOF: 'Sofya', BUH: 'Bükreş', KRK: 'Krakov', RIX: 'Riga', VNO: 'Vilnius', HEL: 'Helsinki', OSL: 'Oslo',
    DUB: 'Dublin', EDI: 'Edinburgh', MAN: 'Manchester', NCE: 'Nis', LYS: 'Lyon', MRS: 'Marsilya', SKG: 'Selanik',
    SKP: 'Üsküp', TIA: 'Tiran', PRN: 'Priştine', KIV: 'Kişinev', EVN: 'Erivan', TAS: 'Taşkent', ALA: 'Almatı',
    NQZ: 'Astana', DOH: 'Doha', AUH: 'Abu Dabi', CAI: 'Kahire', TUN: 'Tunus', CAS: 'Kazablanka', RAK: 'Marakeş',
    AMM: 'Amman', BEY: 'Beyrut', JED: 'Cidde', RUH: 'Riyad', KWI: 'Kuveyt', TLV: 'Tel Aviv', MOW: 'Moskova',
    LED: 'St. Petersburg', SEL: 'Seul', BJS: 'Pekin', SHA: 'Şanghay', HKG: 'Hong Kong', SIN: 'Singapur',
    KUL: 'Kuala Lumpur', DPS: 'Bali', HKT: 'Phuket', DEL: 'Delhi', BOM: 'Mumbai', CMB: 'Kolombo',
    ZNZ: 'Zanzibar', NBO: 'Nairobi', CPT: 'Cape Town', JNB: 'Johannesburg', YTO: 'Toronto', MIA: 'Miami',
    CHI: 'Chicago', LAX: 'Los Angeles', WAS: 'Washington', SAO: 'São Paulo', BUE: 'Buenos Aires',
    HAV: 'Havana', CUN: 'Cancun', MEX: 'Meksiko', MLA: 'Malta', SPU: 'Split', DBV: 'Dubrovnik',
    PMI: 'Mallorca', AGP: 'Malaga', VLC: 'Valensiya', FCO: 'Roma', CDG: 'Paris', LHR: 'Londra'
  };
  TR.forEach(function (x) { NAMES[x.c] = x.n; });
  INTL.forEach(function (x) { NAMES[x[0]] = x[1]; });

  var AIRLINES = {
    TK: 'Türk Hava Yolları', PC: 'Pegasus', VF: 'AJet', XQ: 'SunExpress', W6: 'Wizz Air', W4: 'Wizz Air',
    W9: 'Wizz Air', FR: 'Ryanair', U2: 'easyJet', LH: 'Lufthansa', AF: 'Air France', KL: 'KLM', A3: 'Aegean',
    QR: 'Qatar Airways', EK: 'Emirates', FZ: 'flydubai', J2: 'AZAL', OS: 'Austrian', LX: 'Swiss', LO: 'LOT',
    JU: 'Air Serbia', AZ: 'ITA Airways', IB: 'Iberia', VY: 'Vueling', BA: 'British Airways', SU: 'Aeroflot',
    MS: 'EgyptAir', SV: 'Saudia', G9: 'Air Arabia', EY: 'Etihad', KC: 'Air Astana', HY: 'Uzbekistan Airways'
  };
  var MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  var DOW = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

  // ---------- yardımcılar ----------
  var $ = function (id) { return document.getElementById(id); };
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parse(s) { var p = s.slice(0, 10).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function today() { var t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  var nf = new Intl.NumberFormat('tr-TR');
  function tl(p) { return nf.format(p) + ' TL'; }
  function fmt(d, o) { return d.toLocaleDateString('tr-TR', o || { day: 'numeric', month: 'long', weekday: 'long' }); }
  function short(d) { return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }); }
  function time(s) { return s && s.length > 15 ? s.slice(11, 16) : ''; }
  function name(c) { return NAMES[c] || c; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; }); }
  function airlineHTML(code) {
    if (!code) return 'Bilinmiyor';
    return '<span class="al"><img src="https://pics.avs.io/44/44/' + esc(code) + '.png" alt="" loading="lazy">' + esc(AIRLINES[code] || code) + '</span>';
  }
  function stopsText(n) { return n == null ? 'Bilinmiyor' : n === 0 ? 'Direkt' : n + ' aktarma'; }
  function opt(v, t) { var o = document.createElement('option'); o.value = v; o.textContent = t; return o; }

  function api(path) {
    return fetch(path, { headers: { Accept: 'application/json' } }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error(j.error || 'Fiyatlar alınamadı. Biraz sonra tekrar dene.');
        return j;
      });
    });
  }

  // ---------- durum ----------
  var state = { from: 'IST', to: 'BCN', ym: null, rt: true, stay: 7, sel: null, days: [] };

  // ---------- form ----------
  TR.forEach(function (x) { $('from').appendChild(opt(x.c, x.n + (x.s ? ' (' + x.s + ')' : ''))); });
  function fillTo() {
    var sel = $('to'), cur = sel.value || state.to, from = $('from').value;
    sel.innerHTML = '';
    sel.appendChild(opt('ANY', 'Her yer (en ucuzlar)'));
    var g1 = document.createElement('optgroup'); g1.label = 'Yurt dışı';
    INTL.slice().sort(function (a, b) { return a[1].localeCompare(b[1], 'tr'); }).forEach(function (x) { g1.appendChild(opt(x[0], x[1])); });
    var g2 = document.createElement('optgroup'); g2.label = 'Yurt içi';
    TR.forEach(function (x) { if (x.c !== from && !x.intl) g2.appendChild(opt(x.c, x.n)); });
    sel.appendChild(g1); sel.appendChild(g2);
    sel.value = cur === from ? 'ANY' : cur;
    if (!sel.value) sel.value = 'ANY';
  }
  (function fillMonths() {
    var t = today();
    for (var i = 0; i < 12; i++) {
      var d = new Date(t.getFullYear(), t.getMonth() + i, 1);
      $('month').appendChild(opt(d.getFullYear() + '-' + pad(d.getMonth() + 1), MONTHS[d.getMonth()] + ' ' + d.getFullYear()));
    }
    $('month').selectedIndex = 1; state.ym = $('month').value;
  })();
  $('from').value = state.from; fillTo(); $('to').value = state.to;
  $('from').addEventListener('change', fillTo);

  document.querySelectorAll('.seg button').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.seg button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      state.rt = b.dataset.trip === 'rt';
      $('stayWrap').style.display = state.rt ? '' : 'none';
    });
  });

  $('searchForm').addEventListener('submit', function (e) {
    e.preventDefault();
    state.from = $('from').value; state.to = $('to').value; state.ym = $('month').value;
    state.stay = parseInt($('stay').value, 10); state.sel = null;
    search(true);
  });

  // ---------- arama ----------
  function tripLabel() { return state.rt ? 'gidiş-dönüş, ' + state.stay + ' gece' : 'tek yön'; }
  function monthTitle() { var p = state.ym.split('-').map(Number); return MONTHS[p[1] - 1] + ' ' + p[0]; }

  function search(scroll) {
    var out = $('sonuc');
    out.innerHTML = '<div class="state">Fiyatlar yükleniyor…</div>';
    if (scroll) out.scrollIntoView({ block: 'start' });
    var q = 'origin=' + state.from + '&month=' + state.ym + '&rt=' + (state.rt ? 1 : 0);
    var req = state.to === 'ANY'
      ? api('/api/anywhere?' + q).then(renderAnywhere)
      : api('/api/calendar?' + q + '&destination=' + state.to + '&stay=' + state.stay).then(renderCalendar);
    req.catch(function (err) {
      out.innerHTML = '<div class="state err">' + esc(err.message) + '</div>';
    });
  }

  function renderAnywhere(r) {
    var t = iso(today());
    var list = (r.list || []).filter(function (x) { return x.date >= t; });
    var h = '<div class="result-head"><h2>' + esc(name(state.from)) + ' çıkışlı en ucuz yerler, ' + monthTitle() + '</h2><span class="best">' + (state.rt ? 'gidiş-dönüş' : 'tek yön') + '</span></div>';
    if (!list.length) {
      $('sonuc').innerHTML = h + '<div class="state">Bu ay için kayıtlı fiyat yok. Başka bir ay ya da kalkış şehri dene.</div>';
      return;
    }
    h += '<ul class="board">';
    list.forEach(function (x) {
      var dep = parse(x.date), ret = x.ret ? parse(x.ret) : null;
      h += '<li><a class="row" href="' + esc(x.link) + '" target="_blank" rel="noopener">' +
        '<span class="route">' + esc(name(x.destination)) + '<small>' + esc(AIRLINES[x.airline] || x.airline || '') + ', ' + stopsText(x.transfers) + '</small></span>' +
        '<span class="when">' + short(dep) + (ret ? ' – ' + short(ret) : '') + '</span>' +
        '<span></span><span class="amt">' + tl(x.price) + '</span></a></li>';
    });
    h += '</ul><p class="src">Bir satıra tıklayınca bileti satan sitede o uçuş açılır.</p>';
    $('sonuc').innerHTML = h;
  }

  function renderCalendar(r) {
    state.days = r.days || [];
    var byDate = {}; state.days.forEach(function (x) { byDate[x.date] = x; });
    var p = state.ym.split('-').map(Number), first = new Date(p[0], p[1] - 1, 1), n = new Date(p[0], p[1], 0).getDate();
    var t = today(), vals = [];
    var cells = [];
    for (var i = 1; i <= n; i++) {
      var d = new Date(p[0], p[1] - 1, i), k = iso(d), past = d < t, x = past ? null : byDate[k];
      cells.push({ d: d, k: k, x: x, past: past }); if (x) vals.push(x.price);
    }
    var head = '<div class="result-head"><h2>' + esc(name(state.from)) + ' – ' + esc(name(state.to)) + ', ' + monthTitle() + '</h2>';
    if (!vals.length) {
      $('sonuc').innerHTML = head + '</div><div class="state">Bu rota ve ay için son günlerde kayıtlı fiyat yok. Başka bir ay seç ya da "Her yer" ile ara. Bu veri gerçek kullanıcı aramalarından geldiği için az aranan rotalarda boşluk olabilir.</div>';
      return;
    }
    var sorted = vals.slice().sort(function (a, b) { return a - b; });
    var lo = sorted[Math.floor(sorted.length / 3)], hi = sorted[Math.floor(sorted.length * 2 / 3)], min = sorted[0];
    var minCell = cells.filter(function (c) { return c.x && c.x.price === min; })[0];
    if (!state.sel && minCell) state.sel = minCell.k;

    var h = head + '<span class="best">En ucuz: ' + short(minCell.d) + ', ' + tl(min) + '</span></div>';
    h += '<div class="cal-layout"><div class="cal"><div class="cal-grid">';
    DOW.forEach(function (x) { h += '<div class="dow">' + x + '</div>'; });
    var off = (first.getDay() + 6) % 7; for (var b = 0; b < off; b++) h += '<div class="blank"></div>';
    cells.forEach(function (c) {
      var dn = c.d.getDate();
      if (!c.x) {
        h += '<button class="day" type="button" disabled aria-label="' + fmt(c.d) + ', ' + (c.past ? 'geçmiş tarih' : 'fiyat yok') + '"><span class="n">' + dn + '</span><span class="p">' + (c.past ? '' : '–') + '</span></button>';
        return;
      }
      var cls = c.x.price === min ? 'min' : c.x.price <= lo ? 'c1' : c.x.price >= hi ? 'c3' : 'c2';
      h += '<button class="day ' + cls + (state.sel === c.k ? ' sel' : '') + '" type="button" data-date="' + c.k + '" aria-label="' + fmt(c.d) + ', ' + tl(c.x.price) + '"><span class="n">' + dn + '</span><span class="p">' + nf.format(c.x.price) + '</span></button>';
    });
    h += '</div><div class="legend"><span><i class="sw" style="background:var(--sign)"></i>En ucuz gün</span><span><i class="sw" style="background:var(--cheap-bg)"></i>Ucuz</span><span><i class="sw" style="background:var(--mid-bg);border:1px solid var(--line)"></i>Orta</span><span><i class="sw" style="background:var(--high-bg)"></i>Pahalı</span><span>Fiyatlar TL, kişi başı</span></div></div>';
    h += '<div class="detail" id="detail">' + detailHTML() + '</div></div>';
    $('sonuc').innerHTML = h;

    document.querySelectorAll('#sonuc .day[data-date]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('#sonuc .day.sel').forEach(function (x) { x.classList.remove('sel'); });
        btn.classList.add('sel'); state.sel = btn.dataset.date; $('detail').innerHTML = detailHTML();
      });
    });
  }

  function detailHTML() {
    var x = state.days.filter(function (d) { return d.date === state.sel; })[0];
    if (!x) return '<p>Takvimden bir gün seç.</p>';
    var dep = parse(x.date), ret = x.ret ? parse(x.ret) : null;
    var h = '<h3>' + esc(name(x.origin)) + ' – ' + esc(name(x.destination)) + '</h3><div class="when">' + tripLabel() + '</div>';
    h += '<div class="price">' + tl(x.price) + '</div><div class="when">kişi başı</div>';
    h += '<dl><dt>Gidiş</dt><dd>' + fmt(dep) + (time(x.depart) ? ', ' + time(x.depart) : '') + '</dd>';
    if (ret) h += '<dt>Dönüş</dt><dd>' + fmt(ret) + (time(x.ret) ? ', ' + time(x.ret) : '') + '</dd>';
    h += '<dt>Havayolu</dt><dd>' + airlineHTML(x.airline) + '</dd><dt>Aktarma (gidiş)</dt><dd>' + stopsText(x.transfers) + '</dd>';
    if (ret && x.returnTransfers != null) h += '<dt>Aktarma (dönüş)</dt><dd>' + stopsText(x.returnTransfers) + '</dd>';
    if (x.originAirport && x.destinationAirport) h += '<dt>Havalimanı</dt><dd>' + esc(x.originAirport) + ' – ' + esc(x.destinationAirport) + '</dd>';
    h += '</dl><a class="btn" href="' + esc(x.link) + '" target="_blank" rel="noopener">Bileti satın alma sayfasında aç</a>';
    h += '<p class="note">Bu fiyat son günlerde görülen en düşük fiyat. Satın alma sayfasında değişmiş olabilir.</p>';
    return h;
  }

  // ---------- fırsatlar ----------
  var DEAL_FROM = ['IST', 'ESB', 'IZM', 'AYT'], dealCache = {};
  function loadDeals(o) {
    var box = $('deals');
    if (dealCache[o]) return renderDeals(dealCache[o]);
    box.innerHTML = '<div class="state">Fırsatlar yükleniyor…</div>';
    api('/api/deals?origin=' + o).then(function (r) { dealCache[o] = r; renderDeals(r); })
      .catch(function (err) { box.innerHTML = '<div class="state err">' + esc(err.message) + '</div>'; });
  }
  function renderDeals(r) {
    var t = iso(today());
    var list = (r.list || []).filter(function (x) { return x.date >= t; }).slice(0, 12);
    if (!list.length) { $('deals').innerHTML = '<div class="state">Bu şehirden şu an fırsat bilet görünmüyor. Başka bir kalkış şehri seç.</div>'; return; }
    var h = '<ul class="board">';
    list.forEach(function (x) {
      var dep = parse(x.date), ret = x.ret ? parse(x.ret) : null;
      h += '<li><a class="row" href="' + esc(x.link) + '" target="_blank" rel="noopener">' +
        '<span class="route">' + esc(name(x.origin)) + ' – ' + esc(NAMES[x.destination] || x.destName || x.destination) +
        '<small>' + esc(x.airlineTitle || AIRLINES[x.airline] || x.airline || '') + (ret ? ', gidiş-dönüş' : ', tek yön') + '</small></span>' +
        '<span class="when">' + short(dep) + (ret ? ' – ' + short(ret) : '') + '</span>' +
        '<span class="save">' + (x.discountPct != null && x.discountPct > 0 ? 'normalden %' + x.discountPct + ' ucuz' : 'fırsat') + '</span><span class="amt">' + tl(x.price) + '</span></a></li>';
    });
    $('deals').innerHTML = h + '</ul>';
  }
  (function chips() {
    var c = $('dealChips');
    DEAL_FROM.forEach(function (code, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = name(code);
      b.setAttribute('aria-pressed', String(i === 0));
      b.addEventListener('click', function () {
        c.querySelectorAll('.chip').forEach(function (y) { y.setAttribute('aria-pressed', String(y === b)); });
        loadDeals(code);
      });
      c.appendChild(b);
    });
  })();

  // ---------- vize ----------
  var CENTERS = {
    vfs: { n: 'VFS Global', u: 'https://www.vfsglobal.com' },
    idata: { n: 'iDATA', u: 'https://www.idata.com.tr' },
    bls: { n: 'BLS International', u: 'https://www.blsinternational.com' }
  };
  var VISA = [['Almanya', 'idata'], ['İtalya', 'idata'], ['İspanya', 'bls']];
  ['Avusturya', 'Belçika', 'Bulgaristan', 'Çekya', 'Danimarka', 'Estonya', 'Finlandiya', 'Fransa', 'Hırvatistan', 'Hollanda', 'İsveç', 'İsviçre', 'İzlanda', 'Letonya', 'Lihtenştayn', 'Litvanya', 'Lüksemburg', 'Malta', 'Norveç', 'Polonya', 'Slovakya', 'Slovenya']
    .forEach(function (n) { VISA.push([n, 'vfs']); });
  VISA.push(['İngiltere', 'vfs', 'uk']);
  VISA.sort(function (a, b) { return a[0].localeCompare(b[0], 'tr'); });
  VISA.forEach(function (v, i) { $('country').appendChild(opt(i, v[0])); });
  $('country').value = String(VISA.findIndex(function (v) { return v[0] === 'Fransa'; }));
  $('travelDate').value = iso(addDays(today(), 120));

  // Vize kategorileri: her ikisinde de aynı 4 kısa süreli tür + "kapsam dışı" seçeneği.
  var VISA_CATS = [
    ['tourism', 'Turizm'],
    ['family', 'Aile / Arkadaş Ziyareti'],
    ['business', 'İş (Toplantı / Fuar)'],
    ['study', 'Kısa Dönem Öğrenci Değişimi'],
    ['longterm', 'Uzun Dönem Çalışma / Öğrenci']
  ];
  VISA_CATS.forEach(function (c) { $('visaCategory').appendChild(opt(c[0], c[1])); });

  // Ortak belgeler (her kategoride istenir)
  var DOC_BASE = [
    'Dönüş tarihinden sonra en az 3 ay geçerli, son 10 yılda alınmış pasaport (en az 2 boş sayfa)',
    'Doldurulmuş ve imzalanmış vize başvuru formu',
    'Son 6 ay içinde çekilmiş biyometrik fotoğraf',
    'Gidiş-dönüş uçak bileti rezervasyonu',
    'Seyahat boyunca geçerli, en az 30.000 € teminatlı seyahat sağlık sigortası',
    'Son 3 aylık banka hesap dökümü (mali yeterlilik)'
  ];
  // Kategoriye özel ek belgeler
  var DOC_EXTRA = {
    tourism: ['Otel veya konaklama rezervasyonu', 'Günlük seyahat planı / güzergah'],
    family: ['Davet eden kişiden davetiye mektubu', 'Davet edenin ikamet belgesi / pasaport örneği'],
    business: ['İşvereninden görevlendirme yazısı', 'Ziyaret edilecek şirketten davet mektubu', 'Şirketin faaliyet belgesi (varsa)'],
    study: ['Okuldan kabul veya kayıt yazısı', '18 yaş altıysa veli izin belgesi (noter onaylı)']
  };
  // Ücret bilgisi: Schengen ülkelerinde ortak, İngiltere'de ayrı.
  var FEES = {
    schengen: { amt: '90 €', sub: '12 yaş ve üzeri için. 6-11 yaş arası çocuklarda 45 €, 6 yaş altı ücretsizdir. Bu, AB\'nin resmi konsolosluk ücretidir; VFS/iDATA/BLS gibi merkezlerin ayrıca aldığı hizmet ücreti (genelde 20-30 €) bu tutara dahil değildir.' },
    uk: { amt: '135 £', sub: '6 aya kadar geçerli Standard Visitor vizesi için (Nisan 2026 itibarıyla). 2/5/10 yıllık uzun süreli vizelerde ücret daha yüksektir.' }
  };

  function renderVisa() {
    var v = VISA[+$('country').value], c = CENTERS[v[1]], uk = v[2] === 'uk';
    $('centerInfo').innerHTML = '<div class="center-name">' + c.n + '</div>' +
      '<span class="tag">' + (uk ? 'Schengen dışı' : 'Schengen') + '</span>' +
      '<p>' + v[0] + ' için Türkiye\'deki başvurular ' + c.n + ' üzerinden alınıyor.' + (uk ? ' Başvuru önce GOV.UK üzerinden başlatılır, biyometri randevusu merkezde verilir.' : '') + '</p>' +
      '<a class="btn" href="' + c.u + '" target="_blank" rel="noopener">' + c.n + ' sayfasını aç</a>';
    renderVisaDocs(uk);
    renderVisaDates(v, uk);
  }

  function renderVisaDocs(uk) {
    var cat = $('visaCategory').value;
    if (cat === 'longterm') {
      $('visaDocs').innerHTML = '<div class="status wait">Uzun dönem çalışma veya öğrenci vizesi kısa süreli ziyaretçi vizesi kapsamına girmiyor. Bu, ayrı bir başvuru süreci; ücreti ve istenen belgeler ülkeye ve vize türüne göre değişiyor.' +
        (uk ? ' İngiltere için <a href="https://www.gov.uk/skilled-worker-visa" target="_blank" rel="noopener">Skilled Worker</a> veya <a href="https://www.gov.uk/student-visa" target="_blank" rel="noopener">Student</a> vizesi sayfalarına bak.' : ' Ülkenin göçmenlik dairesinin veya konsolosluğunun resmi sayfasından "ulusal vize" (D vizesi) şartlarını kontrol et.') +
        '</div>';
      return;
    }
    var fee = uk ? FEES.uk : FEES.schengen;
    var extra = DOC_EXTRA[cat] || [];
    var h = '<div class="fee-box"><div class="fee-amt">' + fee.amt + '</div><div class="fee-sub">' + fee.sub + '</div></div>';
    h += '<div class="doc-group">Gerekli belgeler</div><ul class="doclist">';
    DOC_BASE.concat(extra).forEach(function (d) { h += '<li>' + esc(d) + '</li>'; });
    h += '</ul><p class="note">Bu liste genel bir kılavuzdur; ülkeye ve başvuru merkezine göre ek belge istenebilir. Kesin listeyi başvurmadan önce merkezin resmi sayfasından teyit et.</p>';
    $('visaDocs').innerHTML = h;
  }

  function renderVisaDates(v, uk) {
    var val = $('travelDate').value;
    if (!val) { $('visaDates').innerHTML = '<p class="note">Tarihleri görmek için uçuş tarihini gir.</p>'; return; }
    var fly = parse(val), t = today(), long = { day: 'numeric', month: 'long', year: 'numeric' };
    var earliest = uk ? new Date(fly.getFullYear(), fly.getMonth() - 3, fly.getDate()) : new Date(fly.getFullYear(), fly.getMonth() - 6, fly.getDate());
    var latest = uk ? null : addDays(fly, -15);
    var h = '<ul class="dates"><li><span>En erken başvuru</span><b>' + fmt(earliest, long) + '</b></li>';
    if (latest) h += '<li><span>En geç başvuru</span><b>' + fmt(latest, long) + '</b></li>';
    h += '<li><span>Uçuş</span><b>' + fmt(fly, long) + '</b></li></ul>';
    if (fly < t) h += '<div class="status late">Bu tarih geçmişte kaldı. Gelecekteki bir uçuş tarihi gir.</div>';
    else if (latest && t > latest) h += '<div class="status late">Standart başvuru süresi geçti. Konsolosluğun acil başvuru seçeneklerine bak.</div>';
    else if (t < earliest) h += '<div class="status wait">Başvuru penceresi ' + Math.ceil((earliest - t) / 864e5) + ' gün sonra açılıyor. O gün randevu aramaya başla; yoğun dönemlerde randevular hızlı doluyor.</div>';
    else h += '<div class="status ok">Şu an başvurabilirsin. Randevu aramaya hemen başla.</div>';
    h += '<p class="note">' + (uk ? 'İngiltere\'ye seyahatten en erken 3 ay önce başvurulabilir.' : 'Schengen kurallarına göre başvuru seyahatten en erken 6 ay, en geç 15 gün önce yapılır.') + '</p>';
    $('visaDates').innerHTML = h;
  }
  $('country').addEventListener('change', renderVisa);
  $('visaCategory').addEventListener('change', function () {
    var v = VISA[+$('country').value];
    renderVisaDocs(v[2] === 'uk');
  });
  $('travelDate').addEventListener('change', function () {
    var v = VISA[+$('country').value];
    renderVisaDates(v, v[2] === 'uk');
  });

  // ---------- popüler rotalar (SEO sayfalarına bağlantı) ----------
  var ROUTE_LINKS = [
    ['istanbul-roma', 'Roma', '2 saat 35 dakika'], ['istanbul-barselona', 'Barselona', '4 saat 5 dakika'],
    ['istanbul-berlin', 'Berlin', '3 saat 5 dakika'], ['istanbul-londra', 'Londra', '4 saat 5 dakika'],
    ['istanbul-amsterdam', 'Amsterdam', '3 saat 40 dakika'], ['istanbul-paris', 'Paris', '3 saat 50 dakika'],
    ['istanbul-atina', 'Atina', '1 saat 20 dakika'], ['istanbul-budapeste', 'Budapeşte', '1 saat 50 dakika'],
    ['istanbul-prag', 'Prag', '2 saat 35 dakika'], ['istanbul-viyana', 'Viyana', '2 saat 10 dakika'],
    ['istanbul-dubai', 'Dubai', '4 saat 50 dakika'], ['istanbul-milano', 'Milano', '3 saat 5 dakika'],
    ['istanbul-tiflis', 'Tiflis', '2 saat 5 dakika'], ['istanbul-baku', 'Bakü', '2 saat 40 dakika']
  ];
  (function renderRouteLinks() {
    var h = '';
    ROUTE_LINKS.forEach(function (r) {
      h += '<li><a class="row" href="/ucuz-ucak-bileti/' + r[0] + '"><span class="route">İstanbul – ' + esc(r[1]) + '</span><span class="when">yaklaşık ' + esc(r[2]) + '</span></a></li>';
    });
    $('routeLinks').innerHTML = h;
  })();

  // ---------- rehberler (SEO sayfalarına bağlantı) ----------
  var GUIDE_LINKS = [
    ['yurtdisi-esim-nasil-alinir', 'Yurt Dışına Çıkarken eSIM Nasıl Alınır?'],
    ['ucuz-otel-hostel-nasil-bulunur', 'Seyahatte Ucuz Otel ve Hostel Nasıl Bulunur?'],
    ['yurt-disi-cikis-harci-2026', '2026 Yurt Dışı Çıkış Harcı Ne Kadar, Nasıl Ödenir?'],
    ['turk-pasaportu-vizesiz-ulkeler-2026', 'Türk Pasaportuyla 2026\'da Vizesiz Gidilebilecek Ülkeler'],
    ['schengen-vize-istatistikleri-2025', 'Hangi Ülke Daha Kolay Vize Veriyor? 2025 Schengen İstatistikleri'],
    ['yilbasi-pazarlari-en-guzel-avrupa-rotalari', 'Yılbaşı Pazarları İçin En Güzel Avrupa Rotaları'],
    ['kabin-bagaji-olculeri-thy-pegasus-ajet', 'Kabin Bagajı Ölçüleri: THY, Pegasus, AJet Karşılaştırması'],
    ['ucus-iptal-gecikme-tazminat-haklari', 'Uçuş İptal veya Gecikmesinde Yolcu Hakların Ne?'],
    ['bagaj-kaybolursa-ne-yapilir', 'Bagajın Kaybolursa Ne Yapmalısın?'],
    ['en-ucuz-ucak-bileti-ne-zaman-alinir', 'En Ucuz Uçak Bileti Ne Zaman Alınır?'],
    ['yurtdisinda-kredi-karti-doviz-kullanimi', 'Yurt Dışında Kredi Kartı ve Döviz Kullanımı: Pratik İpuçları'],
    ['pasaport-yenileme-randevu-ucret-2026', '2026 Pasaport Yenileme: Randevu, Ücretler ve Gerekli Belgeler']
  ];
  (function renderGuideLinks() {
    var h = '';
    GUIDE_LINKS.forEach(function (g) {
      h += '<li><a class="row" href="/rehber/' + g[0] + '"><span class="route">' + esc(g[1]) + '</span></a></li>';
    });
    $('guideLinks').innerHTML = h;
  })();

  // ---------- başlangıç ----------
  // Rota sayfasından "?from=IST&to=BCN" ile gelindiyse o rotayı otomatik yükle.
  (function applyUrlParams() {
    var p = new URLSearchParams(location.search);
    var f = (p.get('from') || '').toUpperCase(), t = (p.get('to') || '').toUpperCase();
    if (f && TR.some(function (x) { return x.c === f; })) { state.from = f; $('from').value = f; fillTo(); }
    if (t) { state.to = t; $('to').value = t; if ($('to').value !== t) $('to').value = 'ANY'; }
  })();
  search(false);
  loadDeals('IST');
  renderVisa();
})();
