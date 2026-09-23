(function () {
  'use strict';

  // ---------- sabit veriler ----------
  var TR = [
    { c: 'IST', n: 'İstanbul', s: 'İST + SAW' }, { c: 'ESB', n: 'Ankara' }, { c: 'IZM', n: 'İzmir' },
    { c: 'AYT', n: 'Antalya' }, { c: 'ADA', n: 'Adana' }, { c: 'TZX', n: 'Trabzon' },
    { c: 'GZT', n: 'Gaziantep' }, { c: 'DLM', n: 'Dalaman' }, { c: 'BJV', n: 'Bodrum' }
  ];
  // "Nereye" listesinde çıkan yurt dışı şehirler
  var INTL = [
    ['BCN', 'Barselona', 'Avrupa'], ['PRG', 'Prag', 'Avrupa'], ['ROM', 'Roma', 'Avrupa'], ['MIL', 'Milano', 'Avrupa'],
    ['PAR', 'Paris', 'Avrupa'], ['AMS', 'Amsterdam', 'Avrupa'], ['BER', 'Berlin', 'Avrupa'], ['MUC', 'Münih', 'Avrupa'],
    ['FRA', 'Frankfurt', 'Avrupa'], ['VIE', 'Viyana', 'Avrupa'], ['BUD', 'Budapeşte', 'Avrupa'], ['ATH', 'Atina', 'Avrupa'],
    ['LON', 'Londra', 'Avrupa'], ['CPH', 'Kopenhag', 'Avrupa'], ['STO', 'Stockholm', 'Avrupa'], ['TLL', 'Tallinn', 'Avrupa'],
    ['WAW', 'Varşova', 'Avrupa'], ['BEG', 'Belgrad', 'Avrupa'], ['SJJ', 'Saraybosna', 'Avrupa'], ['MAD', 'Madrid', 'Avrupa'],
    ['LIS', 'Lizbon', 'Avrupa'], ['ZRH', 'Zürih', 'Avrupa'], ['DUS', 'Düsseldorf', 'Avrupa'], ['CGN', 'Köln', 'Avrupa'],
    ['STR', 'Stuttgart', 'Avrupa'], ['HAM', 'Hamburg', 'Avrupa'], ['HAJ', 'Hannover', 'Avrupa'], ['NUE', 'Nürnberg', 'Avrupa'],
    ['BRU', 'Brüksel', 'Avrupa'], ['GVA', 'Cenevre', 'Avrupa'], ['BSL', 'Basel', 'Avrupa'], ['OPO', 'Porto', 'Avrupa'],
    ['VCE', 'Venedik', 'Avrupa'], ['NAP', 'Napoli', 'Avrupa'], ['BLQ', 'Bologna', 'Avrupa'], ['SOF', 'Sofya', 'Avrupa'],
    ['BUH', 'Bükreş', 'Avrupa'], ['KRK', 'Krakov', 'Avrupa'], ['RIX', 'Riga', 'Avrupa'], ['VNO', 'Vilnius', 'Avrupa'],
    ['HEL', 'Helsinki', 'Avrupa'], ['DUB', 'Dublin', 'Avrupa'], ['EDI', 'Edinburgh', 'Avrupa'], ['MAN', 'Manchester', 'Avrupa'],
    ['NCE', 'Nis', 'Avrupa'], ['LYS', 'Lyon', 'Avrupa'], ['MRS', 'Marsilya', 'Avrupa'], ['SKG', 'Selanik', 'Avrupa'],
    ['SKP', 'Üsküp', 'Avrupa'], ['TIA', 'Tiran', 'Avrupa'], ['PRN', 'Priştine', 'Avrupa'], ['KIV', 'Kişinev', 'Avrupa'],
    ['MLA', 'Malta', 'Avrupa'], ['SPU', 'Split', 'Avrupa'], ['DBV', 'Dubrovnik', 'Avrupa'], ['PMI', 'Mallorca', 'Avrupa'],
    ['AGP', 'Malaga', 'Avrupa'], ['VLC', 'Valensiya', 'Avrupa'], ['OSL', 'Oslo', 'Avrupa'],
    ['TBS', 'Tiflis', 'Kafkasya'], ['BAK', 'Bakü', 'Kafkasya'], ['EVN', 'Erivan', 'Kafkasya'],
    ['DXB', 'Dubai', 'Ortadoğu'], ['DOH', 'Doha', 'Ortadoğu'], ['AUH', 'Abu Dabi', 'Ortadoğu'], ['AMM', 'Amman', 'Ortadoğu'],
    ['BEY', 'Beyrut', 'Ortadoğu'], ['JED', 'Cidde', 'Ortadoğu'], ['RUH', 'Riyad', 'Ortadoğu'], ['KWI', 'Kuveyt', 'Ortadoğu'],
    ['TLV', 'Tel Aviv', 'Ortadoğu'], ['ECN', 'Lefkoşa (Ercan)', 'Ortadoğu'],
    ['HRG', 'Hurghada', 'Afrika'], ['SSH', 'Şarm El Şeyh', 'Afrika'], ['CAI', 'Kahire', 'Afrika'], ['TUN', 'Tunus', 'Afrika'],
    ['CAS', 'Kazablanka', 'Afrika'], ['RAK', 'Marakeş', 'Afrika'], ['ZNZ', 'Zanzibar', 'Afrika'], ['NBO', 'Nairobi', 'Afrika'],
    ['CPT', 'Cape Town', 'Afrika'], ['JNB', 'Johannesburg', 'Afrika'],
    ['MLE', 'Maldivler', 'Asya'], ['BKK', 'Bangkok', 'Asya'], ['TYO', 'Tokyo', 'Asya'], ['TAS', 'Taşkent', 'Asya'],
    ['ALA', 'Almatı', 'Asya'], ['NQZ', 'Astana', 'Asya'], ['SEL', 'Seul', 'Asya'], ['BJS', 'Pekin', 'Asya'],
    ['SHA', 'Şanghay', 'Asya'], ['HKG', 'Hong Kong', 'Asya'], ['SIN', 'Singapur', 'Asya'], ['KUL', 'Kuala Lumpur', 'Asya'],
    ['DPS', 'Bali', 'Asya'], ['HKT', 'Phuket', 'Asya'], ['DEL', 'Delhi', 'Asya'], ['BOM', 'Mumbai', 'Asya'],
    ['CMB', 'Kolombo', 'Asya'],
    ['NYC', 'New York', 'Amerika'], ['YTO', 'Toronto', 'Amerika'], ['MIA', 'Miami', 'Amerika'], ['CHI', 'Chicago', 'Amerika'],
    ['LAX', 'Los Angeles', 'Amerika'], ['WAS', 'Washington', 'Amerika'], ['SAO', 'São Paulo', 'Amerika'],
    ['BUE', 'Buenos Aires', 'Amerika'], ['HAV', 'Havana', 'Amerika'], ['CUN', 'Cancun', 'Amerika'], ['MEX', 'Meksiko', 'Amerika']
  ];
  var INTL_REGIONS = ['Avrupa', 'Kafkasya', 'Ortadoğu', 'Afrika', 'Asya', 'Amerika'];
  // "Nereden" ve "Nereye" listelerinin ikisi de bu tek havuzdan besleniyor,
  // böylece herhangi bir şehirden herhangi bir şehre arama yapılabiliyor.
  var ALL_REGIONS = ['Yurt içi'].concat(INTL_REGIONS);
  var ALL_CITIES = TR.map(function (x) { return [x.c, x.n + (x.s ? ' (' + x.s + ')' : ''), 'Yurt içi']; }).concat(INTL);
  // Fırsatlar bölümünde yurt içi/yurt dışı ayrımı için: sitenin bildiği tüm
  // uluslararası kodlar. Bunda olmayan bir kod, büyük ihtimalle bir Türkiye havalimanıdır.
  var INTL_CODE_SET = new Set(INTL.map(function (x) { return x[0]; }));
  // API'den gelen kodların Türkçe adları (listede olmayanlar kod olarak görünür)
  var NAMES = {
    SAW: 'İstanbul', ADB: 'İzmir', VAN: 'Van', DIY: 'Diyarbakır', ERZ: 'Erzurum', KYA: 'Konya', ASR: 'Kayseri',
    SZF: 'Samsun', MLX: 'Malatya', EZS: 'Elazığ', HTY: 'Hatay', GZP: 'Gazipaşa', NAV: 'Kapadokya', DNZ: 'Denizli',
    VAS: 'Sivas', KFS: 'Kastamonu', RZV: 'Rize-Artvin', COV: 'Çukurova (Adana)',
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
  function hasOption(selEl, val) {
    for (var i = 0; i < selEl.options.length; i++) if (selEl.options[i].value === val) return true;
    return false;
  }
  function populateSelect(selEl, excludeCode, addAny) {
    selEl.innerHTML = '';
    if (addAny) selEl.appendChild(opt('ANY', 'Her yer (en ucuzlar)'));
    ALL_REGIONS.forEach(function (region) {
      var items = ALL_CITIES.filter(function (x) { return x[2] === region && x[0] !== excludeCode; })
        .sort(function (a, b) { return a[1].localeCompare(b[1], 'tr'); });
      if (!items.length) return;
      var g = document.createElement('optgroup'); g.label = region;
      items.forEach(function (x) { g.appendChild(opt(x[0], x[1])); });
      selEl.appendChild(g);
    });
  }
  function fillTo() {
    var from = $('from').value, cur = $('to').value || state.to;
    populateSelect($('to'), from, true);
    $('to').value = hasOption($('to'), cur) && cur !== from ? cur : 'ANY';
    $('swapBtn').disabled = ($('to').value === 'ANY');
  }
  function fillFrom() {
    var to = $('to').value, cur = $('from').value || state.from;
    populateSelect($('from'), to === 'ANY' ? null : to, false);
    $('from').value = hasOption($('from'), cur) ? cur : 'IST';
  }
  populateSelect($('from'), null, false); $('from').value = state.from;
  fillTo();
  $('from').addEventListener('change', fillTo);
  $('to').addEventListener('change', fillFrom);
  $('swapBtn').addEventListener('click', function () {
    if ($('to').value === 'ANY') return; // takas için somut bir hedef gerekiyor
    var f = $('from').value, t = $('to').value;
    populateSelect($('from'), null, false); $('from').value = t;
    populateSelect($('to'), t, true); $('to').value = f;
    state.from = t; state.to = f; state.sel = null;
    search(true);
  });
  (function fillMonths() {
    var t = today();
    for (var i = 0; i < 12; i++) {
      var d = new Date(t.getFullYear(), t.getMonth() + i, 1);
      $('month').appendChild(opt(d.getFullYear() + '-' + pad(d.getMonth() + 1), MONTHS[d.getMonth()] + ' ' + d.getFullYear()));
    }
    $('month').selectedIndex = 1; state.ym = $('month').value;
  })();

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

  // ---------- yurt dışı / yurt içi sekmeleri (ortak) ----------
  function regionTabsHTML(idPrefix, intlHtml, domesticHtml) {
    return '<div class="chips" role="group" aria-label="Bölge">' +
      '<button type="button" class="chip region-chip" data-target="' + idPrefix + 'Intl" aria-pressed="true">✈️ Yurt Dışı</button>' +
      '<button type="button" class="chip region-chip" data-target="' + idPrefix + 'Domestic" aria-pressed="false">🛫 Yurt İçi</button>' +
      '</div>' +
      '<div id="' + idPrefix + 'Intl">' + intlHtml + '</div>' +
      '<div id="' + idPrefix + 'Domestic" style="display:none">' + domesticHtml + '</div>';
  }
  function wireRegionTabs(scopeEl) {
    var chips = scopeEl.querySelectorAll('.region-chip');
    chips.forEach(function (b) {
      b.addEventListener('click', function () {
        chips.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        chips.forEach(function (x) {
          var t = document.getElementById(x.dataset.target);
          if (t) t.style.display = (x === b) ? '' : 'none';
        });
      });
    });
  }

  function renderAnywhere(r) {
    var t = iso(today());
    var intl = (r.intl || []).filter(function (x) { return x.date >= t; });
    var domestic = (r.domestic || []).filter(function (x) { return x.date >= t; });
    var h = '<div class="result-head"><h2>' + esc(name(state.from)) + ' çıkışlı en ucuz yerler, ' + monthTitle() + '</h2><span class="best">' + (state.rt ? 'gidiş-dönüş' : 'tek yön') + '</span></div>';
    if (!intl.length && !domestic.length) {
      $('sonuc').innerHTML = h + '<div class="state">Bu ay için kayıtlı fiyat yok. Başka bir ay ya da kalkış şehri dene.</div>';
      return;
    }
    function board(list) {
      if (!list.length) return '<div class="state">Bu kategoride kayıtlı fiyat yok.</div>';
      var b = '<ul class="board">';
      list.forEach(function (x) {
        var dep = parse(x.date), ret = x.ret ? parse(x.ret) : null;
        b += '<li><a class="row" href="' + esc(x.link) + '" target="_blank" rel="noopener">' +
          '<span class="route">' + esc(name(x.destination)) + '<small>' + esc(AIRLINES[x.airline] || x.airline || '') + ', ' + stopsText(x.transfers) + '</small></span>' +
          '<span class="when">' + short(dep) + (ret ? ' – ' + short(ret) : '') + '</span>' +
          '<span></span><span class="amt">' + tl(x.price) + '</span></a></li>';
      });
      return b + '</ul>';
    }
    h += regionTabsHTML('any', board(intl), board(domestic));
    h += '<p class="src">Bir satıra tıklayınca bileti satan sitede o uçuş açılır.</p>';
    $('sonuc').innerHTML = h;
    wireRegionTabs($('sonuc'));
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
    h += '<p class="note">Tanımadığın küçük bir acenteye yönlendirilirsen, ödemeden önce adını hızlıca aratıp yorumlarına bakmanı öneririz. Çok düşük fiyatlar genelde acentenin düşük kâr marjından gelir; bu tek başına bir sorun değildir, ama iade ve değişiklik süreçleri büyük sitelere göre daha yavaş olabiliyor.</p>';
    h += '<p class="note">Satın almadan önce: ad-soyadının pasaporttaki hâliyle birebir aynı olduğundan, gerekiyorsa pasaport numarasının doğru girildiğinden ve tarihlerin doğru olduğundan emin ol. Bagaj hakkının fiyata dahil olup olmadığını da kontrol et — en ucuz biletlerde genelde sadece küçük bir el çantası hakkı bulunuyor.</p>';
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
    var list = (r.list || []).filter(function (x) { return x.date >= t; });
    var intl = list.filter(function (x) { return INTL_CODE_SET.has(x.destination); }).slice(0, 12);
    var domestic = list.filter(function (x) { return !INTL_CODE_SET.has(x.destination); }).slice(0, 12);
    if (!intl.length && !domestic.length) { $('deals').innerHTML = '<div class="state">Bu şehirden şu an fırsat bilet görünmüyor. Başka bir kalkış şehri seç.</div>'; return; }
    function board(list) {
      if (!list.length) return '<div class="state">Bu kategoride şu an fırsat bilet görünmüyor.</div>';
      var h = '<ul class="board">';
      list.forEach(function (x) {
        var dep = parse(x.date), ret = x.ret ? parse(x.ret) : null;
        h += '<li><a class="row" href="' + esc(x.link) + '" target="_blank" rel="noopener">' +
          '<span class="route">' + esc(name(x.origin)) + ' – ' + esc(NAMES[x.destination] || x.destName || x.destination) +
          '<small>' + esc(x.airlineTitle || AIRLINES[x.airline] || x.airline || '') + (ret ? ', gidiş-dönüş' : ', tek yön') + '</small></span>' +
          '<span class="when">' + short(dep) + (ret ? ' – ' + short(ret) : '') + '</span>' +
          '<span class="save">' + (x.discountPct != null && x.discountPct > 0 ? 'normalden %' + x.discountPct + ' ucuz' : 'fırsat') + '</span><span class="amt">' + tl(x.price) + '</span></a></li>';
      });
      return h + '</ul>';
    }
    $('deals').innerHTML = regionTabsHTML('deals', board(intl), board(domestic));
    wireRegionTabs($('deals'));
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

  // ---------- kesin tarihlerle ara ----------
  (function () {
    var today0 = today();
    $('exDepart').value = iso(addDays(today0, 45));
    $('exReturn').value = iso(addDays(today0, 52));

    // Buton yazısı, dönüş tarihi girilip girilmediğine göre kendiliğinden değişir.
    function updateExactBtnLabel() {
      $('exactBtn').textContent = $('exReturn').value ? 'Ara' : 'Tek yön ara';
    }
    $('exReturn').addEventListener('change', updateExactBtnLabel);
    $('exReturn').addEventListener('input', updateExactBtnLabel);
    updateExactBtnLabel();

    function renderExact(r) {
      if (r.exact) {
        var x = r.exact, dep = parse(x.date), ret = x.ret ? parse(x.ret) : null;
        var h = '<div class="detail"><h3>' + esc(name(r.origin)) + ' – ' + esc(name(r.destination)) + '</h3>';
        h += '<div class="price">' + tl(x.price) + '</div><div class="when">kişi başı, tam bu tarihler için</div>';
        h += '<dl><dt>Gidiş</dt><dd>' + fmt(dep) + '</dd>';
        if (ret) h += '<dt>Dönüş</dt><dd>' + fmt(ret) + '</dd>';
        h += '<dt>Havayolu</dt><dd>' + airlineHTML(x.airline) + '</dd></dl>';
        h += '<a class="btn" href="' + esc(x.link) + '" target="_blank" rel="noopener">Bileti satın alma sayfasında aç</a></div>';
        $('exactResult').innerHTML = h;
      } else if (r.near && r.near.length) {
        var h2 = '<div class="state">Tam bu tarihler için kayıtlı fiyat yok. En yakın bulduklarımız:</div><ul class="board">';
        r.near.forEach(function (x) {
          var d = parse(x.date), rt2 = x.ret ? parse(x.ret) : null;
          h2 += '<li><a class="row" href="' + esc(x.link) + '" target="_blank" rel="noopener">' +
            '<span class="route">' + short(d) + (rt2 ? ' – ' + short(rt2) : '') + '</span>' +
            '<span></span><span></span><span class="amt">' + tl(x.price) + '</span></a></li>';
        });
        $('exactResult').innerHTML = h2 + '</ul>';
      } else {
        $('exactResult').innerHTML = '<div class="state">Bu rota ve tarih için hiç veri yok. Yukarıdaki ay takviminden bakmayı dene.</div>';
      }
    }

    $('exactBtn').addEventListener('click', function () {
      if ($('to').value === 'ANY') {
        $('exactResult').innerHTML = '<div class="state err">Kesin tarih araması için "Nereye" kısmında belirli bir şehir seçmen gerekiyor.</div>';
        return;
      }
      var depart = $('exDepart').value;
      if (!depart) return;
      var ret = $('exReturn').value; // boşsa tek yön aranır
      $('exactResult').innerHTML = '<div class="state">Aranıyor…</div>';
      var q = 'origin=' + $('from').value + '&destination=' + $('to').value + '&depart=' + depart + (ret ? '&return=' + ret : '');
      api('/api/exact?' + q).then(renderExact).catch(function (err) {
        $('exactResult').innerHTML = '<div class="state err">' + esc(err.message) + '</div>';
      });
    });
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
