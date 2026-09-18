# Bilet Avcısı

biletavcisi.net: reklamsız uçak bileti fiyat takvimi, fırsat biletler ve vize rehberi.

## Dosyalar

- `index.html`: sayfanın kendisi
- `style.css`: görünüm
- `app.js`: sayfanın çalışan kısmı (arama, takvim, fırsatlar, vize)
- `functions/api/[endpoint].js`: sunucu fonksiyonu. Travelpayouts'tan fiyatları çeker, token'ı gizli tutar ve sonuçları 3-6 saat önbelleğe alır.

## Cloudflare ayarları

Pages projesinde **Settings > Variables and Secrets** bölümüne şunları ekle:

| Ad | Tür | Değer |
|---|---|---|
| `TP_TOKEN` | Secret | Travelpayouts API token'ı |
| `TP_MARKER` | Text | Travelpayouts marker numaran (komisyon için) |

Değişken ekledikten sonra **Deployments** bölümünden son yayını "Retry deployment" ile yeniden yayınla. Yoksa yeni değerler devreye girmez.

## Build ayarları

- Framework preset: **None**
- Build command: boş
- Build output directory: `/`

## Kontrol

Site açıldıktan sonra tarayıcıda şu adresi aç:
`https://biletavcisi.net/api/deals?origin=IST`

JSON verisi görüyorsan her şey çalışıyor. "TP_TOKEN tanımlı değil" yazıyorsa değişkeni ekleyip yeniden yayınla.
