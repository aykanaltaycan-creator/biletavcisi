// Bilet Avcısı - Cloudflare Worker
// Adres: /api/calendar, /api/anywhere, /api/deals
// Token tarayıcıya hiç gitmez; Cloudflare'deki TP_TOKEN gizli değişkeninden okunur.

const TP = 'https://api.travelpayouts.com';
const CODE = /^[A-Z]{3}$/;
const MONTH = /^\d{4}-\d{2}$/;

const SITE = 'https://biletavcisi.net';

// Ortaklık linkleri (Travelpayouts Tools sayfasından üretildi). Yeni bir tane
// eklemek/değiştirmek istersen sadece burayı güncellemen yeterli.
const AFF = {
  airalo: 'https://airalo.tpo.mx/Fw1whSRw',
  booking: '' // henüz eklenmedi
};

// Fiyat hafızası taranacak kalkış şehirleri ve kaç ay ileriye bakılacağı.
const DEAL_ORIGINS = ['IST', 'ESB', 'IZM', 'AYT'];
const DEAL_MONTHS_AHEAD = 1; // bu ay + gelecek ay (istek sayısını düşük tutmak için)
const HISTORY_LEN = 45;      // her rota için saklanan gün sayısı
const MIN_HISTORY_FOR_DEAL = 5; // karşılaştırma yapılabilmesi için gereken en az gün sayısı
const ALERT_THRESHOLD_PCT = 25; // Telegram'a "fırsat" olarak düşecek minimum indirim yüzdesi
const ALERT_MAX_PER_RUN = 6;    // bir taramada en fazla kaç mesaj gönderilsin
const ALERT_MIN_PER_RUN = 2;    // gerçek fırsat azsa bile en az kaç mesaj gönderilsin
const ALERT_COOLDOWN_DAYS = 3;  // gerçek fırsat aynı rotayı kaç gün tekrar paylaşmasın
const FILLER_COOLDOWN_DAYS = 1; // dolgu mesajı (henüz veri yok/eşik altı) kaç gün beklesin

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

// ---------- SEO: seyahat rehberleri ----------
// Her biri /rehber/<slug> adresinde. Yeni bir rehber eklemek için bu diziye
// {slug, title, desc, bodyHtml} formatında bir nesne eklemen yeterli.
const GUIDE_PAGES = [
  {
    slug: 'yurtdisi-esim-nasil-alinir',
    title: 'Yurt Dışına Çıkarken eSIM Nasıl Alınır?',
    desc: 'Roaming yerine eSIM kullanmak neden daha ucuz ve pratik? Adım adım nasıl alınıp kurulur, hangi telefonlar destekliyor.',
    bodyHtml: `
      <p>Yurt dışına çıkan hemen herkesin karşılaştığı ilk sorun aynı: havaalanına iner inmez internete nasıl bağlanılır? Telefon operatörünün roaming paketi genelde en pahalı seçenek. Son birkaç yıldır çok daha ucuz ve pratik bir alternatif var: <strong>eSIM</strong>.</p>

      <h2>eSIM nedir, normal SIM karttan farkı ne?</h2>
      <p>eSIM, telefonuna takılan fiziksel bir kart değil; telefonun içine dijital olarak kurulan bir hat profili. Bir QR kodu okutarak birkaç dakikada kuruluyor, kargo beklemek ya da havaalanında SIM kart standı aramak gerekmiyor. Mevcut Türkiye hattın telefonda kalmaya devam ediyor, eSIM sadece veri (internet) için ikinci bir hat gibi ekleniyor.</p>

      <h2>Telefonum eSIM destekliyor mu?</h2>
      <p>iPhone XS ve sonrası tüm iPhone modelleri, çoğu 2019 sonrası Samsung Galaxy (S20 ve sonrası, bazı Note modelleri), Google Pixel 3 ve sonrası eSIM destekliyor. Kesin olarak öğrenmek için telefonun <strong>Ayarlar → Hücresel/Mobil Şebeke</strong> bölümünde "eSIM Ekle" ya da "Add eSIM" seçeneği olup olmadığına bakmak yeterli.</p>

      <h2>Nasıl satın alınıp kurulur?</h2>
      <ol>
        <li>Gideceğin ülke veya bölge için bir eSIM sağlayıcısının uygulamasından ya da sitesinden uygun veri paketini seçip ödemeyi yap.</li>
        <li>Sana bir QR kod gönderilir.</li>
        <li>Telefonunda Ayarlar → Hücresel Şebeke → eSIM Ekle diyip bu QR kodu okut.</li>
        <li>Uçuştan <strong>önce, evindeki Wi-Fi'dayken</strong> kurulumu tamamla — kurulum internet gerektirir, havaalanında Wi-Fi aramakla uğraşmak istemezsin.</li>
        <li>Uçaktan inince telefon ayarlarından yeni hattı "açık" konuma getirmen yeterli, otomatik bağlanır.</li>
      </ol>

      <h2>Hangi sağlayıcıya bakmalı?</h2>
      <p>Airalo, Holafly ve Ubigi gibi birkaç tanınmış sağlayıcı var. Aralarındaki fark genelde şu noktalarda toplanıyor: kaç ülkeyi tek pakette kapsadığı (Avrupa turlarında "bölgesel" paketler tek tek ülke almaktan daha avantajlı olabiliyor), veri sınırının sabit mi yoksa "sınırsız ama yavaşlatmalı" mı olduğu, ve destek dilinin Türkçe olup olmadığı. Satın almadan önce güncel fiyat ve kapsama alanını sağlayıcının kendi sitesinden kontrol etmek en sağlıklısı, çünkü paketler sık güncelleniyor.</p>
      <p><a class="btn" href="${AFF.airalo}" target="_blank" rel="noopener nofollow sponsored">Airalo'da ülkeler ve paketlere bak</a></p>

      <h2>Pratik bir ipucu</h2>
      <p>WhatsApp, Telegram gibi uygulamalar üzerinden mesajlaşma ve arama internet üzerinden çalıştığı için, çoğu seyahatte yerel bir telefon numarasına ihtiyaç duyulmuyor — sadece veri (data) paketi yeterli oluyor. Bu da eSIM'i daha da pratik kılıyor.</p>
    `
  },
  {
    slug: 'ucuz-otel-hostel-nasil-bulunur',
    title: 'Seyahatte Ucuz Otel ve Hostel Nasıl Bulunur?',
    desc: 'Karşılaştırma siteleri nasıl kullanılır, hostel mi otel mi seçilmeli, rezervasyonu ne zaman yapmalı? Pratik bir rehber.',
    bodyHtml: `
      <p>Uçak biletini bulduktan sonra sırada konaklama var. Doğru yerde, doğru fiyata kalmak birkaç basit alışkanlıkla kolaylaşıyor.</p>

      <h2>Tek tek otel sitesine bakma, karşılaştır</h2>
      <p>Her otelin kendi sitesine tek tek girip fiyat karşılaştırmak yerine, birden fazla kaynağı aynı anda gösteren karşılaştırma siteleri zaman kazandırır.</p>

      <h2>Otel mi, hostel mi?</h2>
      <p>Hostel'ler genelde paylaşımlı oda seçeneğiyle bütçe seyahatinde en ucuz seçenek; ayrıca ortak mutfak ve sosyal alanlar sayesinde tek başına seyahat edenler için insan tanımak da kolaylaşıyor. Mahremiyet önemliyse hostel'lerin "özel oda" seçenekleri de genelde standart bir otel odasından daha ucuza geliyor.</p>

      <h2>Ne zaman rezervasyon yapmalı?</h2>
      <p>Genel bir kural olarak seyahatten <strong>2 ila 8 hafta önce</strong> bakmak iyi bir denge sağlıyor — çok erken bakıldığında fiyatlar henüz netleşmemiş olabiliyor, son ana bırakıldığında ise popüler tarihlerde seçenek daralıyor. Mümkünse <strong>ücretsiz iptal edilebilir</strong> bir rezervasyon seçmek, fiyat daha da düşerse yeniden rezervasyon yapabilme esnekliği tanıyor.</p>

      <h2>Konum seçimi</h2>
      <p>En ucuz otel her zaman en iyi seçim olmuyor. Şehir merkezine veya toplu taşıma durağına olan uzaklığı, gece geç saatte dönerken güvenli bir bölge olup olmadığını da hesaba katmak, taksi/ulaşım masrafında geri dönüyor.</p>

      <h2>Yorumları nasıl okumalı</h2>
      <p>Puan ortalamasından çok, <strong>yakın tarihli</strong> yorumlara bakmak daha güvenilir — bir otel zamanla değişebilir. Az sayıda yorumla yüksek puan almış bir yere temkinli yaklaşmakta fayda var. Temizlik ve konumdan bahseden yorumlar genelde en somut bilgiyi veriyor.</p>

      <h2>Vize başvurusuyla bağlantısı</h2>
      <p><a href="/#vize">Vize rehberimizde</a> de belirttiğimiz gibi, birçok ülke başvuru sırasında bir konaklama rezervasyon belgesi istiyor. Bu yüzden vize başvurusu öncesinde ücretsiz iptal edilebilir bir rezervasyon yapmak, hem belgeyi hazırlamış olmak hem de plan değişirse zarar etmemek için işe yarıyor.</p>
    `
  },
  {
    slug: 'yurt-disi-cikis-harci-2026',
    title: '2026 Yurt Dışı Çıkış Harcı Ne Kadar, Nasıl Ödenir?',
    desc: 'Türkiye\'den her çıkışta ödenen harcın 2026 tutarı, ödeme yöntemleri, muafiyetler ve iade süreci.',
    bodyHtml: `
      <p>Türkiye Cumhuriyeti pasaportuyla yurt dışına çıkan her vatandaş, çıkış başına bir harç ödüyor. Adı "yurt dışına çıkış harcı" ve her yıl yeniden değerleme oranında güncelleniyor.</p>

      <h2>2026'da tutar ne kadar?</h2>
      <p><strong>1 Ocak 2026'dan itibaren yurt dışı çıkış harcı kişi başı 1.250 TL.</strong> Bir önceki yıl (2025) bu tutar 710 TL idi; yıllık yeniden değerleme oranına göre artırıldı. Harç, <strong>her çıkışta ayrı ayrı</strong> alınıyor — çok girişli bir vizen olsa bile, Türkiye'den her çıkışında yeniden ödüyorsun.</p>

      <h2>Nasıl ödenir?</h2>
      <p>1 Ocak 2025'ten itibaren basılı harç pulu uygulaması tamamen kalktı, sistem artık dijital. Ödeme şu kanallardan yapılabiliyor:</p>
      <ul>
        <li>Bankaların mobil uygulaması veya internet şubesi</li>
        <li>Gelir İdaresi Başkanlığı'nın online sistemleri</li>
        <li>PTT şubeleri</li>
        <li>Havalimanındaki banka şubeleri veya kiosklar (son ana kalırsa)</li>
      </ul>
      <p>Ödeme, sistem tarafından çıkış sırasında otomatik kontrol ediliyor; yanında fiziki bir dekont taşımak zorunlu değil, ama olası bir aksaklığa karşı ödeme ekran görüntüsünü telefonda saklamakta fayda var.</p>

      <h2>Kimler muaf?</h2>
      <ul>
        <li>7 yaşını doldurmamış çocuklar</li>
        <li>Sadece T.C. kimlik kartıyla KKTC'ye geçenler (pasaportla geçilirse harç ödeniyor)</li>
        <li>Uluslararası taşımacılıkta görevli personel (kara/hava/deniz)</li>
        <li>Yurt dışında daimi olarak öğrenci kaydı bulunanlar (belgeyle)</li>
      </ul>
      <p>Bunların dışında genel bir muafiyet yok — eğitim, iş ya da tatil amaçlı her çıkışta harç ödeniyor.</p>

      <h2>Seyahat gerçekleşmezse ne olur?</h2>
      <p>Harcı ödedikten sonra seyahat iptal olursa, dekont ve kimlik bilgilerinle ilgili kuruma iade başvurusu yapılabiliyor. Prosedür zaman zaman değişebildiği için başvuru öncesi güncel bilgiyi Gelir İdaresi Başkanlığı'nın sitesinden teyit etmek en sağlıklısı.</p>

      <p class="note">Bu tutar her yıl güncellenebildiği için, seyahatinden hemen önce güncel rakamı bir kez daha kontrol etmen iyi olur.</p>
    `
  },
  {
    slug: 'turk-pasaportu-vizesiz-ulkeler-2026',
    title: 'Türk Pasaportuyla 2026\'da Vizesiz Gidilebilecek Ülkeler',
    desc: 'Bordo pasaportla vize almadan ya da kapıda vize ile girilebilen ülkeler, bölge bölge örneklerle.',
    bodyHtml: `
      <p>2026 itibarıyla Türk pasaportu (sıradan, "bordo" pasaport) ile vizesiz ya da kapıda vize/e-vize gibi kolaylaştırılmış yollarla girilebilen ülke sayısı yaklaşık <strong>97</strong>. Bu rakam yıldan yıla küçük değişiklikler gösterebiliyor.</p>

      <p class="note">Not: Kamu görevlilerine verilen yeşil (hususi) pasaportun ayrıcalıkları daha geniş. Bu yazı, çoğu okurun sahip olduğu sıradan bordo pasaport için geçerli.</p>

      <h2>Vizesiz, kapıda vize (VOA) ve e-Vize farkı</h2>
      <p><strong>Vizesiz:</strong> pasaportla doğrudan giriş yapılır, önceden hiçbir işlem gerekmez. <strong>Kapıda vize (VOA):</strong> sınıra varınca, genelde nakit ya da kartla küçük bir ücret ödeyip vize alınır. <strong>e-Vize:</strong> seyahatten önce internetten form doldurup online ödeme yapılır, belge genelde e-postayla gelir. Üçü de konsolosluğa gidip randevu almaktan çok daha pratik.</p>

      <h2>Bölge bölge örnekler</h2>
      <p><strong>Balkanlar:</strong> Arnavutluk, Bosna Hersek, Kuzey Makedonya, Sırbistan, Karadağ ve Kosova — genelde 90 güne kadar vizesiz.</p>
      <p><strong>Kafkasya:</strong> Gürcistan tamamen vizesiz; Azerbaycan'a bazı sınır kapılarından yalnızca kimlikle bile geçilebiliyor.</p>
      <p><strong>Güney Amerika:</strong> Arjantin, Brezilya, Şili, Kolombiya, Peru, Uruguay ve Ekvador gibi ülkeler turistik ziyaretlerde genelde 90 güne kadar vize istemiyor.</p>
      <p><strong>Asya:</strong> Japonya, Güney Kore, Katar, Malezya, Singapur, Tayland ve Ürdün vizesiz girilebilen ülkeler arasında; Kırgızistan 90 güne kadar vize muafiyeti tanıyor.</p>
      <p><strong>Kuzey Afrika ve Ortadoğu:</strong> Fas ve Tunus vizesiz; Lübnan da Türk vatandaşlarına kapılarını açık tutuyor.</p>

      <h2>Sınırda hangi belgeler istenebilir?</h2>
      <ul>
        <li>Girişten itibaren en az 6 ay geçerli pasaport</li>
        <li>Dönüş ya da ileri tarihli uçak bileti</li>
        <li>Konaklama kanıtı (otel rezervasyonu)</li>
        <li>Yeterli maddi imkânı gösteren bir belge (bazı ülkelerde)</li>
      </ul>

      <h2>Bir uyarı</h2>
      <p>Bu tür listeler ülkeler arasındaki anlaşmalara bağlı olduğu için zaman zaman değişebiliyor. Uçak biletini almadan önce, gideceğin ülkenin Türkiye'deki büyükelçiliğinin veya kendi dışişleri sitesinin güncel bilgisini mutlaka kontrol et — burada verdiğimiz bilgi genel bir çerçeve sunar, kesin kural yerine geçmez.</p>

      <p>Schengen bölgesine gidecekler için ayrıca <a href="/#vize">vize rehberimize</a> ve <a href="/rehber/yurt-disi-cikis-harci-2026">çıkış harcı yazımıza</a> göz atabilirsin.</p>
    `
  },
  {
    slug: 'schengen-vize-istatistikleri-2025',
    title: 'Hangi Ülke Daha Kolay Vize Veriyor? 2025 Schengen İstatistikleri',
    desc: 'Avrupa Komisyonu\'nun açıkladığı 2025 verilerine göre Türk vatandaşlarının Schengen vize ret oranları, ülke ülke.',
    bodyHtml: `
      <p>Avrupa Komisyonu, Schengen ülkelerinin verdiği ve reddettiği kısa süreli vizelere ait istatistikleri her yıl yayımlıyor. 28 Mayıs 2026'da açıklanan en güncel veriler, 2025 yılını kapsıyor.</p>

      <h2>Genel tablo</h2>
      <p>2025'te Türkiye'den yapılan Schengen vizesi başvuru sayısı <strong>1.268.376</strong>'ya ulaştı — bir önceki yıla göre yaklaşık %8'lik bir artış. Bunların <strong>1.072.054'ü onaylandı</strong>, <strong>183.196'sı reddedildi</strong>. Yani genel ret oranı <strong>%14,6</strong> oldu (2024'te bu oran %14,5 civarındaydı, neredeyse değişmedi). Türkiye, Çin'in ardından dünyada en çok Schengen vizesi başvurusu yapılan ikinci ülke olmayı sürdürdü.</p>

      <h2>Ülkeye göre ret oranları</h2>
      <p>En çok başvuru yapılan ülke <strong>Yunanistan</strong> oldu (310.920 başvuru) ve ret oranı <strong>%10,7</strong> ile genel ortalamanın altında kaldı. İkinci sırada en çok başvurulan ülke olan <strong>Almanya</strong>'da (217.627 başvuru) ise ret oranı <strong>%21,1</strong> ile yüksek hacimli ülkeler arasında en dikkat çekici rakam oldu.</p>
      <p>Diğer bazı ülkelerdeki ret oranları: <strong>Hollanda %9</strong>, <strong>Bulgaristan %10,1</strong>, <strong>İspanya ve Romanya %7,4</strong>. En düşük ret oranı <strong>%3,5</strong> ile <strong>Portekiz</strong>'de görüldü — ancak bu ülkeye yapılan başvuru sayısı (yaklaşık 3.921) diğerlerine göre çok düşük, bu yüzden oranı temkinli yorumlamak gerekiyor. Genel olarak en yüksek ret oranına sahip ülke ise yaklaşık <strong>%34,8</strong> ile <strong>Malta</strong> oldu.</p>

      <h2>Bu rakamlar ne anlama geliyor?</h2>
      <p>Düşük ret oranı olan bir ülke "kesin vize alırım" garantisi vermiyor — başvurunun gücü (gelir durumu, önceki seyahat geçmişi, davet mektubu gibi belgeler) istatistiksel orandan çok daha belirleyici. Ayrıca Schengen kuralları gereği, başvurunu <strong>asıl gideceğin ülkeye</strong> yapman gerekiyor; sadece ret oranı düşük diye farklı bir ülkeye başvurmak kurallara aykırı ve tek başına reddedilme sebebi olabilir.</p>

      <p>Hangi ülke için hangi merkeze başvurulduğunu ve gerekli belgeleri <a href="/#vize">vize rehberimizde</a> bulabilirsin.</p>
    `
  },
  {
    slug: 'yilbasi-pazarlari-en-guzel-avrupa-rotalari',
    title: 'Yılbaşı Pazarları İçin En Güzel Avrupa Rotaları',
    desc: 'Kasım-Aralık ayında Avrupa\'nın en atmosferik yılbaşı pazarlarına sahip şehirlerini ve pratik ipuçlarını derledik.',
    bodyHtml: `
      <p>Avrupa'da yılbaşı pazarları genelde Kasım sonunda açılıyor, bazıları Aralık sonuna kadar sürüyor. Sıcak şarap (glühwein), el yapımı hediyelik eşya ve ışıklarla süslenmiş meydanlar, kış tatilinin klasik bir parçası haline geldi.</p>

      <h2>Viyana</h2>
      <p>Rathausplatz'daki (Belediye Sarayı Meydanı) pazar, Avrupa'nın en görkemli yılbaşı pazarlarından biri. Schönbrunn Sarayı'nın bahçesindeki daha sakin pazar da alternatif bir seçenek. <a href="/ucuz-ucak-bileti/istanbul-viyana">İstanbul-Viyana uçuşlarına buradan bakabilirsin</a>.</p>

      <h2>Prag</h2>
      <p>Eski Şehir Meydanı'ndaki pazar, ortaçağ mimarisiyle çevrili olması sayesinde çok fotogenik bir atmosfer sunuyor. <a href="/ucuz-ucak-bileti/istanbul-prag">İstanbul-Prag uçuşlarına buradan bakabilirsin</a>.</p>

      <h2>Budapeşte</h2>
      <p>Vörösmarty Meydanı'ndaki pazar, özellikle yöresel lezzetler (kürtőskalács gibi) açısından öne çıkıyor. <a href="/ucuz-ucak-bileti/istanbul-budapeste">İstanbul-Budapeşte uçuşlarına buradan bakabilirsin</a>.</p>

      <h2>Nürnberg</h2>
      <p>Almanya'nın en eski ve en ünlü yılbaşı pazarlarından biri (Christkindlesmarkt), her yıl yoğun ilgi görüyor.</p>

      <h2>Strazburg</h2>
      <p>Kendini "Noel'in Başkenti" olarak tanımlayan şehir, ahşap kirişli tarihi evleriyle masalsı bir hava taşıyor.</p>

      <h2>Köln</h2>
      <p>Katedralin çevresinde birden fazla pazar aynı anda kuruluyor, tek gezide birkaç farklı atmosfer deneyimlenebiliyor.</p>

      <h2>Pratik ipuçları</h2>
      <ul>
        <li>Pazarların çoğu Aralık'ın son haftasında (bazen 23-26 Aralık civarı) kapanıyor, kesin tarihleri gitmeden önce kontrol et.</li>
        <li>Hafta sonları ve akşam saatleri en kalabalık zamanlar; hafta içi gündüz saatleri daha sakin.</li>
        <li>Bu şehirlerin hepsi Schengen bölgesinde, vize süreci ve gerekli belgeler için <a href="/#vize">vize rehberimize</a> bakabilirsin.</li>
        <li>Kalın giyinmeyi ihmal etme — açık hava pazarlarında akşamları hava hızla soğuyor.</li>
      </ul>
    `
  },
  {
    slug: 'kabin-bagaji-olculeri-thy-pegasus-ajet',
    title: 'Kabin Bagajı Ölçüleri: THY, Pegasus, AJet Karşılaştırması',
    desc: 'Türk havayollarının kabin bagajı boyut ve ağırlık kuralları, koltuk altı çantasıyla farkı.',
    bodyHtml: `
      <p>Uçağa binmeden önce çoğu kişinin son anda merak ettiği soru: "bu çanta kabin bagajı sınırına giriyor mu?" İşte üç büyük Türk havayolunun güncel kuralları.</p>

      <h2>Standart kabin bagajı</h2>
      <p>Bileti kabin bagajı hakkı içeren bir pakette aldıysan:</p>
      <ul>
        <li><strong>THY ve AJet:</strong> 55 x 40 x 23 cm, 8 kg</li>
        <li><strong>Pegasus:</strong> 55 x 40 x 20 cm, 8 kg (bazı kaynaklarda 23 cm de geçiyor; kesin ölçüyü bilet alırken kendi hesabından teyit etmekte fayda var)</li>
      </ul>

      <h2>Koltuk altı çantası (kişisel eşya)</h2>
      <p>En ucuz bilet paketlerinde (örneğin Pegasus'un "Light" paketi) sadece koltuk altına sığan küçük bir çanta hakkı oluyor: <strong>40 x 30 x 15 cm, 3 kg</strong>. Bir sırt çantası veya dizüstü bilgisayar çantası bu ölçüye uyduğu sürece kabul ediliyor.</p>

      <h2>En ucuz bilette bagaj hakkı yok mu demek?</h2>
      <p>Evet, tam olarak öyle. Havayollarının "en ucuz" görünen fiyatları genelde sadece koltuk altı çantasını kapsıyor. Yanında bavul götürecekseniz bilet alırken bir üst pakete geçmen ya da ayrıca kabin/kayıtlı bagaj hakkı satın alman gerekiyor — bunu havalimanında son anda yapmak, önceden internetten almaktan neredeyse her zaman daha pahalıya geliyor.</p>

      <h2>Kayıtlı (uçak altı) bagaj</h2>
      <p>Kayıtlı bagajda tek bir parça, kaç kg hakkın olursa olsun <strong>32 kg</strong>'ı geçemez; bu havacılık güvenlik kuralı tüm havayolları için geçerli. Ağırlığın fazlası varsa birden fazla parçaya bölünmesi gerekiyor.</p>

      <p class="note">Bu bilgiler genel bir özet niteliğinde; bilet alırken satın aldığın paketin tam bagaj hakkını mutlaka kontrol et, çünkü kurallar paket ve rotaya göre değişebiliyor.</p>
    `
  },
  {
    slug: 'ucus-iptal-gecikme-tazminat-haklari',
    title: 'Uçuş İptal veya Gecikmesinde Yolcu Hakların Ne?',
    desc: 'Avrupa\'nın EC261 yönetmeliğine göre hangi durumlarda 250-600 € tazminat alabilirsin.',
    bodyHtml: `
      <p>Avrupa'da uçuş yapan yolcular, dünyanın en kapsamlı yolcu haklarından birine sahip: <strong>EC261</strong> (261/2004 sayılı AB Yönetmeliği). Bu hak Türkiye'den değil ama Avrupa'dan dönüş uçuşların için önemli olabilir.</p>

      <h2>Hangi uçuşlar kapsamda?</h2>
      <p>EC261, bir AB/AEA havalimanından kalkan <strong>her</strong> uçuşu (havayolu fark etmeksizin) ve AB dışından AB'ye inen, AB lisanslı bir havayolunun uçtuğu uçuşları kapsıyor. İzlanda, Norveç ve İsviçre de bu kapsamda. Pratikte bu, örneğin <strong>Viyana'dan İstanbul'a dönüş uçuşunun</strong> kapsamda olduğu, ama İstanbul'dan Viyana'ya gidiş uçuşunun (Türk havayolu kullanıyorsan) kapsam dışı kalabileceği anlamına geliyor.</p>

      <h2>Ne kadar tazminat alınır?</h2>
      <p>Tazminat, bilet fiyatından bağımsız, sadece <strong>mesafeye</strong> göre belirleniyor:</p>
      <ul>
        <li>1.500 km'ye kadar (örn. İstanbul–Atina): <strong>250 €</strong></li>
        <li>1.500–3.500 km arası (örn. İstanbul–Londra): <strong>400 €</strong></li>
        <li>3.500 km üzeri (örn. İstanbul–New York): <strong>600 €</strong></li>
      </ul>
      <p>Bu tazminat, varışta <strong>en az 3 saat</strong> gecikme yaşandığında ya da uçuş kalkıştan 14 günden az bir süre önce iptal edildiğinde geçerli.</p>

      <h2>Her zaman alınır mı?</h2>
      <p>Hayır. Hava koşulları, grev veya güvenlik riski gibi "olağanüstü haller" varsa havayolu tazminattan muaf olabiliyor. Ancak teknik arıza veya personel eksikliği gibi havayolunun kendi organizasyonel sorunları bu kapsamda sayılmıyor — yani bu durumlarda tazminat hakkın devam ediyor.</p>

      <h2>Nasıl başvurulur?</h2>
      <p>İlk adım doğrudan havayolunun kendi sitesindeki tazminat başvuru formu. Havayolu yanıt vermez ya da reddederse, tazminatın bir kısmını komisyon olarak alan uzman şirketler (AirHelp gibi) üzerinden de başvurabilirsin — bu şirketler süreci senin yerine takip ediyor.</p>
    `
  },
  {
    slug: 'bagaj-kaybolursa-ne-yapilir',
    title: 'Bagajın Kaybolursa Ne Yapmalısın?',
    desc: 'Havalimanında ilk yapman gereken adım, tazminat limitleri ve başvuru süreleri.',
    bodyHtml: `
      <p>Bagajın çıkmadıysa panik yapmadan önce atman gereken tek bir kritik adım var, gerisi onun üzerine kurulu.</p>

      <h2>En önemli adım: PIR raporu</h2>
      <p>Gümrükten geçmeden <strong>önce</strong>, havayolunun bagaj kayıp masasına giderek bir <strong>PIR (Property Irregularity Report)</strong> düzenlet. Bu belge, sorunun bagaj hâlâ havayolunun elindeyken oluştuğunun resmi kanıtı. Bu belge olmadan sonradan yapılan neredeyse hiçbir tazminat başvurusu kabul edilmiyor.</p>

      <h2>Ne kadar süre "kayıp" sayılır?</h2>
      <p>Uluslararası uçuşlarda geçerli Montreal Sözleşmesi'ne göre bagaj, uçuştan itibaren <strong>21 gün</strong> içinde bulunup teslim edilmezse resmen "kayıp" sayılıyor (havayolu daha erken kaybettiğini kabul ederse o tarih geçerli oluyor).</p>

      <h2>Ne kadar tazminat alınabilir?</h2>
      <p>Montreal Sözleşmesi, kayıp, hasarlı veya gecikmeli bagaj için sorumluluğu <strong>1.519 SDR</strong> (Aralık 2024 güncellemesiyle yaklaşık <strong>1.920 €</strong>) ile sınırlıyor. Bu limit, çanta başına değil <strong>yolcu başına</strong> geçerli. Yani bagajının veya içindekilerin değeri bu sınırı aşıyorsa, aradaki farkı havayolundan tazmin ettiremezsin — değerli eşyalar için ayrıca seyahat sigortası düşünülebilir.</p>

      <h2>Başvuru süreleri</h2>
      <ul>
        <li><strong>Hasarlı bagaj:</strong> teslim alındıktan sonra en geç 7 gün içinde itiraz edilmeli.</li>
        <li><strong>Gecikmeli bagaj:</strong> teslim edildikten sonra en geç 21 gün içinde başvuru yapılmalı.</li>
      </ul>

      <h2>Beklerken ne yapmalı?</h2>
      <p>Bagaj gecikmesi durumunda, havayolu genelde diş fırçası, iç çamaşırı gibi acil ihtiyaçların makul maliyetini karşılıyor — bu masrafların fişlerini sakla. Havayolu genelde geçici ihtiyaçlar için önceden nakit vermez, harcamayı sen yapıp fişle geri talep edersin.</p>

      <p class="note">Bu tutarlar Özel Çekme Hakkı (SDR) cinsinden belirlenip düzenli olarak güncelleniyor; başvuru sırasında güncel euro karşılığını havayolunun veya ICAO'nun sitesinden teyit etmek en sağlıklısı.</p>
    `
  },
  {
    slug: 'en-ucuz-ucak-bileti-ne-zaman-alinir',
    title: 'En Ucuz Uçak Bileti Ne Zaman Alınır?',
    desc: '"Salı günü al" gibi efsanelerin ötesinde, gerçekten işe yarayan bilet alma stratejileri.',
    bodyHtml: `
      <p>"Bileti falanca gün al, en ucuzu o gün çıkar" gibi tavsiyeler internette çok dolaşıyor, ama çoğu havayolu fiyatlandırma sistemlerinin karmaşıklığı düşünüldüğünde güvenilir bir dayanağı yok. Daha sağlam birkaç prensip var.</p>

      <h2>Asıl belirleyici: alım zamanlaması</h2>
      <p>"Hangi gün alınır"dan çok, "kaç gün/hafta önce alınır" fiyatı daha çok etkiliyor. Genel bir çerçeve:</p>
      <ul>
        <li><strong>Yurt içi uçuşlar:</strong> seyahatten birkaç hafta ila ~2 ay önce</li>
        <li><strong>Avrupa'ya kısa/orta mesafe:</strong> 2-4 ay önce</li>
        <li><strong>Yaz sezonu, yılbaşı gibi yoğun dönem uçuşları:</strong> 4-6 ay, hatta daha erken</li>
      </ul>
      <p>Çok erken almak da her zaman en ucuzu garanti etmiyor — havayolları fiyatları sezona yaklaştıkça birkaç kez günceller, bazen düşürür.</p>

      <h2>Hangi gün uçmak daha ucuz?</h2>
      <p>"Hangi gün almalı" sorusundan farklı olarak, "hangi gün uçmalı" sorusunun biraz daha güçlü bir dayanağı var: iş seyahati talebinin düşük olduğu <strong>salı, çarşamba</strong> gibi hafta ortası günler, cuma akşamı veya pazar gibi yoğun günlere kıyasla genelde biraz daha ucuza geliyor. Yine de bu bir garanti değil, rotaya göre değişebilir.</p>

      <h2>Tek yön mü, gidiş-dönüş mü?</h2>
      <p>Bazı düşük maliyetli havayollarında iki ayrı tek yön bilet, bir gidiş-dönüş biletten daha ucuza gelebiliyor; bazı geleneksel havayollarında ise tam tersi. Kesin bir kural yok, her ikisini de karşılaştırmak gerekiyor.</p>

      <h2>Tahmin yerine takip et</h2>
      <p>Tek seferlik bir "kural" aramak yerine, ilgilendiğin rotanın fiyatının zaman içinde nasıl değiştiğini görmek çok daha güvenilir. <a href="/#ara">Fiyat takvimimizde</a> bir ay boyunca günlük fiyatları karşılaştırabilir, <a href="/#firsatlar">Fırsatlar</a> bölümünden de normalin belirgin altına düşen anları yakalayabilirsin.</p>
    `
  },
  {
    slug: 'yurtdisinda-kredi-karti-doviz-kullanimi',
    title: 'Yurt Dışında Kredi Kartı ve Döviz Kullanımı: Pratik İpuçları',
    desc: 'Havalimanında döviz bozdurma tuzağı, kartla ödemede "kendi para biriminle mi öde" sorusu ve daha fazlası.',
    bodyHtml: `
      <p>Yurt dışına çıkmadan önce birkaç basit alışkanlık, tatil boyunca gereksiz komisyon ödemeni engelliyor.</p>

      <h2>Havalimanında döviz bozdurma tuzağı</h2>
      <p>Havalimanındaki döviz bürolarının kurları genelde şehir merkezindeki bankalara veya ATM'lere göre belirgin şekilde daha kötü. Mümkünse havalimanında sadece ilk birkaç saatlik ihtiyacın kadar (taksi, kahve gibi) küçük bir miktar bozdurup, geri kalanını şehirde ya da ATM'den çekmek daha avantajlı oluyor.</p>

      <h2>"Kendi para biriminle mi ödeyeyim?" sorusuna hayır de</h2>
      <p>Yurt dışında POS cihazında kartla öderken bazen cihaz "TL olarak mı, yoksa yerel para birimiyle mi ödemek istersin?" diye soruyor. Bu, <strong>Dinamik Kur Dönüşümü (DCC)</strong> denen bir uygulama ve neredeyse her zaman senin aleyhine işleyen bir kur kullanıyor. Doğru seçim, ne sorulursa sorulsun her zaman <strong>yerel para birimiyle</strong> ödemeyi seçmek — kartını çıkaran banka, kendi güncel kurunu (genelde daha iyi) uygular.</p>

      <h2>Kartında yurt dışı işlem ücreti var mı?</h2>
      <p>Bazı kartlar yurt dışı alışverişlerde ekstra bir komisyon kesiyor. Seyahat öncesi bankandan ya da kart sözleşmenden bu ücretin olup olmadığını kontrol etmek, sürpriz bir ekstra masrafı önlüyor.</p>

      <h2>Yedek kart bulundur</h2>
      <p>Bir kartın yurt dışında bloke olması ya da kaybolması ihtimaline karşı, farklı bir bankadan ikinci bir kartı ayrı bir yerde taşımak makul bir önlem.</p>

      <h2>Nakit tamamen gereksiz değil</h2>
      <p>Bazı ülkelerde küçük esnaf, bahşiş veya toplu taşıma hâlâ nakit istiyor olabilir. Kartla her yerde ödeme yapabileceğini varsaymadan önce, gideceğin ülkede nakit kullanımının ne kadar yaygın olduğunu kısaca araştırmak faydalı.</p>
    `
  },
  {
    slug: 'pasaport-yenileme-randevu-ucret-2026',
    title: '2026 Pasaport Yenileme: Randevu, Ücretler ve Gerekli Belgeler',
    desc: 'Pasaport yenileme randevusu nasıl alınır, 2026 harç ve defter bedelleri ne kadar, süre ne kadar sürer?',
    bodyHtml: `
      <p>Pasaportun süresi dolmadan (özellikle Schengen başvurusu düşünüyorsan en az 6 ay geçerlilik payıyla) yenilemek, seyahat planının aksamaması için önemli bir adım.</p>

      <h2>Randevu nasıl alınır?</h2>
      <p>Pasaport başvurusu randevusuz yapılamıyor. Randevu şu kanallardan alınabiliyor:</p>
      <ul>
        <li><strong>randevu.nvi.gov.tr</strong> üzerinden online</li>
        <li><strong>e-Devlet</strong> üzerinden NVİ hizmetleri bölümü</li>
        <li><strong>ALO 199</strong> Vatandaş Etkileşim Merkezi'ni arayarak</li>
      </ul>
      <p>İkamet ettiğin şehirden başvurmak zorunda değilsin; Türkiye genelinde herhangi bir nüfus müdürlüğünü seçebilirsin.</p>

      <h2>2026 ücretleri ne kadar?</h2>
      <table style="width:100%;border-collapse:collapse;margin:12px 0">
        <tr style="border-bottom:1px solid var(--line)"><th style="text-align:left;padding:6px 0">Süre</th><th style="text-align:right;padding:6px 0">Toplam ücret</th></tr>
        <tr style="border-bottom:1px solid var(--line)"><td style="padding:6px 0">6 ay</td><td style="text-align:right">4.157,50 TL</td></tr>
        <tr style="border-bottom:1px solid var(--line)"><td style="padding:6px 0">1 yıl</td><td style="text-align:right">5.454,00 TL</td></tr>
        <tr style="border-bottom:1px solid var(--line)"><td style="padding:6px 0">2 yıl</td><td style="text-align:right">8.049,50 TL</td></tr>
        <tr style="border-bottom:1px solid var(--line)"><td style="padding:6px 0">3 yıl</td><td style="text-align:right">10.867,00 TL</td></tr>
        <tr><td style="padding:6px 0">4-10 yıl</td><td style="text-align:right">14.761,40 TL</td></tr>
      </table>
      <p><strong>25 yaşını doldurmamış öğrenciler harç bedelinden muaf</strong>, sadece 1.351 TL defter bedeli ödüyor.</p>

      <h2>Gerekli belgeler</h2>
      <ul>
        <li>T.C. kimlik kartı</li>
        <li>Son 6 ay içinde çekilmiş biyometrik fotoğraf</li>
        <li>Harç ve defter bedeli ödeme dekontu (randevudan önce ödenmiş olmalı)</li>
        <li>20 yaş üstü erkekler için askerlik durum belgesi</li>
        <li>18 yaşından küçükler için veli muvafakatnamesi</li>
        <li>Yenileme ise mevcut pasaport</li>
      </ul>

      <h2>Ne kadar sürede çıkar?</h2>
      <p>Normal başvurularda pasaport genelde <strong>1-2 hafta</strong> içinde hazır oluyor. Acil ihtiyaç varsa, ek ücret karşılığında <strong>1-3 iş günü</strong>ne düşen acil pasaport başvurusu da mümkün (genelde daha kısa süreli, 6 ay veya 1 yıllık olarak veriliyor).</p>

      <h2>Pasaport kaybolur veya çalınırsa?</h2>
      <p>Önce en yakın karakola giderek tutanak tutturman gerekiyor — bu, eski pasaportun kötüye kullanılmasını önlemek için sisteme işleniyor. Kayıp pasaport için yenileme ücreti, standart başvuru ücretiyle aynı; ekstra bir "kayıp cezası" uygulanmıyor.</p>

      <p class="note">Ücretler her yıl yeniden değerleme oranında güncelleniyor. Başvurudan hemen önce randevu.nvi.gov.tr üzerinden güncel tutarı bir kez daha kontrol etmen iyi olur.</p>
    `
  }
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
    if (url.pathname.startsWith('/rehber/')) {
      const slug = url.pathname.split('/')[2] || '';
      const guide = GUIDE_PAGES.find(g => g.slug === slug);
      if (guide) return handleGuidePage(guide, env, ctx);
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
function tgEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
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
    '<footer><p>Bilet Avcısı reklamsızdır ve bilet satmaz; seni bileti satan siteye yönlendirir.</p><p>Fırsatları kaçırma: <a href="https://t.me/biletavcisinet" target="_blank" rel="noopener">Telegram kanalımız</a> · <a href="https://whatsapp.com/channel/0029VbDPvgL4CrfftLkvBc3G" target="_blank" rel="noopener">WhatsApp kanalımız</a></p></footer>' +
    '</div></body></html>';
}

function sitemap() {
  const entries = ['<url><loc>' + SITE + '/</loc><changefreq>daily</changefreq></url>']
    .concat(ROUTE_PAGES.map(r => '<url><loc>' + SITE + '/ucuz-ucak-bileti/' + r.slug + '</loc><changefreq>daily</changefreq></url>'))
    .concat(GUIDE_PAGES.map(g => '<url><loc>' + SITE + '/rehber/' + g.slug + '</loc><changefreq>weekly</changefreq></url>'));
  const xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + entries.join('') + '</urlset>';
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

// ---------- rehber sayfası ----------

async function handleGuidePage(guide, env, ctx) {
  const cache = caches.default;
  const cacheKey = new Request(SITE + '/rehber/' + guide.slug, { method: 'GET' });
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  const others = GUIDE_PAGES.filter(g => g.slug !== guide.slug);
  const html = '<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>' + hesc(guide.title) + ' | Bilet Avcısı</title>' +
    '<meta name="description" content="' + hesc(guide.desc) + '">' +
    '<link rel="canonical" href="' + SITE + '/rehber/' + guide.slug + '">' +
    '<meta property="og:title" content="' + hesc(guide.title) + '">' +
    '<meta property="og:description" content="' + hesc(guide.desc) + '">' +
    '<meta property="og:locale" content="tr_TR">' +
    '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ctext y=\'.9em\' font-size=\'90\'%3E%E2%9C%88%EF%B8%8F%3C/text%3E%3C/svg%3E">' +
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet">' +
    '<link rel="stylesheet" href="/style.css">' +
    '<style>.guide-body h2{font-family:var(--display);font-weight:700;font-size:24px;margin:28px 0 8px}.guide-body p,.guide-body li{line-height:1.65}.guide-body ol{padding-left:22px}.guide-body li{margin-bottom:8px}</style>' +
    '</head><body><div class="wrap">' +
    '<header class="top"><a class="logo" href="/"><span class="logo-mark"><svg viewBox="0 0 24 24" fill="#000"><path d="M21.5 15.5v-2L13 8.5V3.2a1.7 1.7 0 0 0-3.4 0v5.3l-8.5 5v2l8.5-2.6v5.2l-2.3 1.7v1.6l4-1.2 4 1.2v-1.6L13 20.1v-5.2z"/></svg></span><span class="logo-word">Bilet Avcısı</span></a>' +
    '<nav class="nav"><a href="/">Anasayfa</a><a href="/#firsatlar">Fırsatlar</a><a href="/#rehberler">Rehberler</a><a href="/#vize">Vize</a></nav></header>' +
    '<section class="hero"><h1>' + hesc(guide.title) + '</h1><p>' + hesc(guide.desc) + '</p></section>' +
    '<section><div class="detail guide-body">' + guide.bodyHtml + '</div></section>' +
    '<section><h2>Diğer rehberler</h2><ul class="board">' +
    others.map(g => '<li><a class="row" href="/rehber/' + g.slug + '"><span class="route">' + hesc(g.title) + '</span></a></li>').join('') +
    '</ul></section>' +
    '<footer><p>Bilet Avcısı reklamsızdır ve bilet satmaz; seni bileti satan siteye yönlendirir.</p><p>Fırsatları kaçırma: <a href="https://t.me/biletavcisinet" target="_blank" rel="noopener">Telegram kanalımız</a> · <a href="https://whatsapp.com/channel/0029VbDPvgL4CrfftLkvBc3G" target="_blank" rel="noopener">WhatsApp kanalımız</a></p></footer>' +
    '</div></body></html>';

  const res = new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=21600' }
  });
  ctx.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
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
  if (rt) {
    // Tam olarak seçilen gece sayısını değil, etrafındaki makul bir aralığı arıyoruz.
    // Yoksa "7 gece" seçince 6 veya 8 geceli çok daha ucuz bir bilet varken bile
    // "sonuç yok" görünebiliyordu.
    const tol = stay <= 4 ? 1 : stay <= 7 ? 2 : 3;
    p.min_trip_duration = Math.max(1, stay - tol);
    p.max_trip_duration = stay + tol;
  }
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
  // olduğunu kendi geçmiş verimizle hesaplayıp ekliyoruz. Tek bir okuma yeterli:
  // tüm şehrin hafızası zaten tek pakette (mem:<ORIGIN>).
  if (env.PRICE_HISTORY) {
    const mem = await readOriginMem(env, o); // 1 KV okuma, kaç teklif olursa olsun
    list = list.map(x => {
      const base = baseline(mem.hist[x.destination] || []);
      const discountPct = base ? Math.round((1 - x.price / base) * 100) : null;
      return { ...x, discountPct, baselinePrice: base };
    });
    // Önce en yüksek gerçek indirim, sonra en düşük fiyat
    list.sort((a, b) => (b.discountPct ?? -999) - (a.discountPct ?? -999) || a.price - b.price);
  } else {
    list.sort((a, b) => a.price - b.price);
  }

  return { origin: o, list: list.slice(0, 20) };
}

// ---------- fiyat hafızası (fırsat avcısı) ----------
//
// ÖNEMLİ: Cloudflare'in ücretsiz planı, bir cron çalışmasında yapılabilecek toplam
// istek sayısını (Travelpayouts + KV okuma/yazma) sınırlıyor. Bu yüzden her rota
// için ayrı bir KV dosyası tutmak yerine, her ŞEHİR için TEK bir "hafıza paketi"
// kullanıyoruz: mem:<ORIGIN> = { hist: {DEST: [{d,p},...]}, cooldown: {DEST: "YYYY-MM-DD"} }
// Böylece bir şehirde 5 rota da olsa 100 rota da olsa, maliyet hep "1 okuma + 1 yazma".

async function readOriginMem(env, origin) {
  try {
    const raw = await env.PRICE_HISTORY.get('mem:' + origin);
    const j = raw ? JSON.parse(raw) : null;
    return { hist: (j && j.hist) || {}, cooldown: (j && j.cooldown) || {} };
  } catch (e) {
    return { hist: {}, cooldown: {} };
  }
}

function addDaysISO(dateStr, days) {
  const p = dateStr.split('-').map(Number);
  const d = new Date(p[0], p[1] - 1, p[2] + days);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

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

  const candidates = [];
  const memByOrigin = {}; // her şehrin hafızası burada RAM'de tutulur, en sona kadar KV'ye yazılmaz

  for (const origin of DEAL_ORIGINS) {
    const mem = await readOriginMem(env, origin); // 1 KV okuma (şehir başına)
    memByOrigin[origin] = mem;

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

    // Bulunan her rota için: önce hafızayla karşılaştır (fırsat mı?), sonra bugünün
    // fiyatını hafızaya ekle. Hepsi RAM'de; KV'ye bu şehir bitince tek seferde yazılır.
    for (const [dest, info] of Object.entries(bestByDest)) {
      const oldHist = mem.hist[dest] || [];
      const oldBase = baseline(oldHist);
      const pct = oldBase ? Math.round((1 - info.price / oldBase) * 100) : null;
      const cooledUntil = mem.cooldown[dest];
      const cooled = cooledUntil && today < cooledUntil;
      if (!cooled) candidates.push({ origin, dest, price: info.price, link: info.link, date: info.date, pct });

      let h = oldHist.filter(x => x.d !== today);
      h.push({ d: today, p: info.price });
      if (h.length > HISTORY_LEN) h = h.slice(h.length - HISTORY_LEN);
      mem.hist[dest] = h;
    }
  }

  // 1) Önce gerçek fırsatları (eşiği geçenleri) seç, en yüksek indirimden başlayarak.
  let chosen = candidates.filter(c => c.pct != null && c.pct >= ALERT_THRESHOLD_PCT)
    .sort((a, b) => b.pct - a.pct).slice(0, ALERT_MAX_PER_RUN);

  // 2) Kanal boş kalmasın: yeterli gerçek fırsat yoksa, eşiği geçmeyen ama yine de
  //    en iyi indirimli rotalarla tamamla (indirim yüzdesi dürüstçe olduğu gibi yazılır).
  if (chosen.length < ALERT_MIN_PER_RUN) {
    const fillers = candidates.filter(c => c.pct != null && !chosen.includes(c))
      .sort((a, b) => b.pct - a.pct);
    for (const f of fillers) { if (chosen.length >= ALERT_MIN_PER_RUN) break; chosen.push(f); }
  }

  // 3) Hâlâ yetmiyorsa (fiyat hafızası henüz çok yeni, karşılaştıracak veri yok):
  //    indirim iddiası olmadan, sadece "bugünün fiyatı" diye en ucuz rotalarla doldur.
  if (chosen.length < ALERT_MIN_PER_RUN) {
    const priceOnly = candidates.filter(c => c.pct == null && !chosen.includes(c))
      .sort((a, b) => a.price - b.price);
    for (const f of priceOnly) { if (chosen.length >= ALERT_MIN_PER_RUN) break; chosen.push(f); }
  }

  for (const a of chosen) {
    await sendDealAlert(env, a);
    const isReal = a.pct != null && a.pct >= ALERT_THRESHOLD_PCT;
    const ttlDays = isReal ? ALERT_COOLDOWN_DAYS : FILLER_COOLDOWN_DAYS;
    memByOrigin[a.origin].cooldown[a.dest] = addDaysISO(today, ttlDays);
  }

  // Her şehir için TEK bir yazma — kaç rota işlendiyse işlensin, maliyet hep aynı.
  for (const origin of DEAL_ORIGINS) {
    try {
      await env.PRICE_HISTORY.put('mem:' + origin, JSON.stringify(memByOrigin[origin]), { expirationTtl: 90 * 86400 });
    } catch (e) { /* bir şehrin yazımı başarısız olsa bile diğerlerini etkilemesin */ }
  }
}

async function sendDealAlert(env, a) {
  if (!env.TG_BOT_TOKEN || !env.TG_CHAT) return; // Telegram ayarlanmadıysa sessizce atla
  const on = CITY_NAMES[a.origin] || a.origin, dn = CITY_NAMES[a.dest] || a.dest;
  const link = bookLink(env, a.link, a.origin, a.dest, a.date, null);
  const priceLine = (a.pct != null && a.pct > 0)
    ? nf(a.price) + ' TL — normalden %' + a.pct + ' ucuz'
    : nf(a.price) + ' TL';
  // HTML formatı: uzun linkin kendisi yerine kısa, tıklanabilir bir yazı gösterilir.
  const text = '✈️ <b>' + tgEsc(on) + ' – ' + tgEsc(dn) + '</b>\n' +
    tgEsc(priceLine) + '\n' +
    (a.date ? '📅 ' + tgEsc(trDate(a.date.slice(0, 10))) + '\n' : '') +
    '<a href="' + tgEsc(link) + '">✈️ Bileti gör ve satın al</a>' +
    (a.pct == null ? '\n\n<i>Bu rota için fiyat geçmişi henüz oluşuyor; birkaç gün içinde karşılaştırmalı gösterebileceğiz.</i>' : '');
  try {
    await fetch('https://api.telegram.org/bot' + env.TG_BOT_TOKEN + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TG_CHAT, text, parse_mode: 'HTML', disable_web_page_preview: false })
    });
  } catch (e) { /* Telegram'a ulaşılamazsa taramanın geri kalanını bozma */ }
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
