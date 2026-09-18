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
    var
