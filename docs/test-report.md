# PDKS Mobile — Test Raporu

**Proje:** Mobil Personel Geçiş Uygulaması
**Geliştirici:** Halit ACET
**Rapor Tarihi:** 20.07.2026
**Test Ortamı:** TECNO CM7 (Android), Windows 10 + SQL Server 2012 Express, Spring Boot 3.3 (lokal)

Bu rapor, proje dokümanında tanımlanan dört kabul senaryosunun (TC01–TC04) ve ek modüllerin test sonuçlarını içerir. Tüm testler gerçek Android cihaz üzerinde gerçekleştirilmiş, sunucu tarafı davranışları admin paneli ve gerektiğinde API üzerinden doğrulanmıştır.

---

## TC01 — Farklı Cihazdan Giriş Denemesi

| | |
|---|---|
| **Ön koşul** | Personel hesabı bir cihaza eşleştirilmiş durumda |
| **Adımlar** | 1. İlk girişte cihaz otomatik eşleştirilir (bilgilendirme mesajı gösterilir) 2. Hesap farklı bir cihazdan giriş yapmayı dener |
| **Beklenen** | Giriş engellenir, kullanıcı yönlendirici bir hata ekranı görür |
| **Gerçekleşen** | ✅ "Bu cihaz kayıtlı değil" ekranı gösterildi; İK'ya yönlendiren 3 adımlı açıklama sunuldu; giriş engellendi |
| **Kanıt** | `tc01-cihaz-eslestirildi.png` (ilk eşleştirme mesajı) · `tc01-device-mismatch.png` (farklı cihaz engel ekranı) · `panel-cihazlar.png` (paneldeki eşleştirme kaydı) |

## TC02 — Çevrimdışı Geçiş ve Senkronizasyon

| | |
|---|---|
| **Ön koşul** | Cihazda uçak modu açık (internet yok) |
| **Adımlar** | 1. Uçak modunda geçiş yapılır 2. Başarı ekranı görülür 3. Ana ekranda bekleyen kayıt rozeti kontrol edilir 4. Uçak modu kapatılır, otomatik senkronizasyon izlenir |
| **Beklenen** | Kayıt cihazda saklanır, bağlantı gelince otomatik iletilir, çift kayıt oluşmaz |
| **Gerçekleşen** | ✅ Başarı ekranı "kaydınız cihazda saklandı, bağlantı gelince gönderilecek" mesajıyla gösterildi; ana ekranda sarı çevrimdışı bandı + "SENKRONİZE BEKLİYOR · 2 KAYIT" rozeti; Geçmiş'te BEKLİYOR etiketli kayıtlar; bağlantı gelince rozetler kalktı, kayıtlar sunucuya işlendi. Aynı kuyruğun tekrar gönderiminde çift kayıt oluşmadığı doğrulandı (idempotency) |
| **Kanıt** | `tc02-offline-basari.png` (çevrimdışı başarı ekranı) · `tc02-ana-ekran-bekliyor.png` (sarı bant + rozet) · `tc02-gecmis-bekliyor.png` (BEKLİYOR etiketli liste) · `tc02-sync-sonrasi.png` (senkron sonrası temiz liste) |

## TC03 — GPS Kapalıyken Geçiş Denemesi

| | |
|---|---|
| **Ön koşul** | Cihazda konum servisi kapalı |
| **Adımlar** | 1. QR veya konum ile geçiş başlatılır |
| **Beklenen** | Konum alınamadığı için geçişe izin verilmez |
| **Gerçekleşen** | ✅ "Konumunuz alınamıyor" ekranı gösterildi; "Konum Ayarlarını Aç" butonu ve 3 adımlı yönlendirme sunuldu; geçiş kaydı oluşmadı |
| **Kanıt** | `tc03-gps-kapali.png` (hata ekranı) · `tc03-konum-dogrulaniyor.png` (normal akıştaki doğrulama ekranı — karşılaştırma için) |

## TC04 — Sahte Konum (Mock GPS) Tespiti

| | |
|---|---|
| **Ön koşul** | Cihaza sahte GPS uygulaması kurulu, geliştirici seçeneklerinden mock location app olarak seçili, sahte yayın Google Haritalar'da doğrulanmış |
| **Adımlar** | 1. Sahte konum yayını başlatılır 2. Uygulamadan geçiş denenir 3. Sunucu tarafı katman ayrıca uzak koordinat/hız senaryolarıyla doğrulanır |
| **Beklenen** | Sahte konum tespit edilir, geçiş reddedilir; sunucu tarafı da bağımsız olarak şüpheli konumları reddeder |
| **Gerçekleşen** | ✅ Cihazda `position.mocked` bayrağı ile tespit edildi, sunucuya istek gitmeden "Geçiş kaydedilemedi" ekranı gösterildi. Sunucu tarafı savunma: imkânsız hız (Bursa→Ankara), geofence ihlali, donmuş koordinat ve mock bayrağı senaryolarının tümü reddedildi ve Şüpheli Denemeler'e loglandı |
| **Kanıt** | `tc04-fake-gps-ekrani.png` (mobil red ekranı) · `panel-supheli-denemeler.png` (İmkânsız Hız / Tesis Dışı rozetli sunucu logları) |

---

## Ek Modül Testleri

| Modül | Test | Sonuç | Kanıt |
|---|---|---|---|
| Kimlik doğrulama | Yanlış şifre hatası; ilk girişte zorunlu şifre değişimi; yeni şifreyle giriş | ✅ | `login.png`, `sifre-degistirme.png` |
| Geçiş çekirdeği | QR okutma + arka planda konum doğrulama; GPS ile geçiş; onay ekranında tip değiştirme; başarı ekranı | ✅ | `qr-tarama.png`, `gecis-onay.png`, `gecis-basarili.png` |
| Ana ekran | Duruma göre dinamik kart (İçeride/Dışarıda) ve buton etiketleri; gerçek vardiya bilgisi; bugünkü süre | ✅ | `home-icerde.png`, `home-disarida.png` |
| Geçmiş | Tarihe göre gruplu liste, yöntem/tip rozetleri, boş durum | ✅ | `gecmis.png` |
| Profil | Çalışma bilgileri, BU AY puantaj özeti, kayıtlı cihaz kartı | ✅ | `profil.png` |
| Admin panel | Dashboard istatistikleri; personel CRUD + vardiya atama; cihaz sıfırlama; lokasyon yönetimi + QR üretimi; filtreli geçiş kayıtları + CSV | ✅ | `panel-dashboard.png`, `panel-personel.png`, `panel-lokasyonlar-qr.png`, `panel-gecisler.png` |
| Uçtan uca QR döngüsü | Panelden üretilen lokasyon QR'ı mobil uygulamayla okutuldu, geçiş kaydı oluştu | ✅ | `panel-lokasyonlar-qr.png` + `gecis-basarili.png` |
| Vardiya + Puantaj | Vardiya tanımlama/atama; tam gün hesabı (8s 0dk TAM); geç kalma (89dk); eksik kayıt; hafta sonu mesaisi; mola düşümü | ✅ | `panel-vardiyalar.png`, `panel-puantaj.png` |
| Manuel düzeltme + denetim | Zorunlu gerekçeyle manuel kayıt; gerekçeli silme + `deleted_transaction_logs` denetim izi | ✅ | `panel-puantaj-duzelt.png`, `panel-silme-gerekce.png` |
| Dışa aktarım | Geçiş kayıtları ve puantaj CSV (UTF-8 BOM, Türkçe karakter uyumlu, Excel'de doğrulandı) | ✅ | `export-excel.png` |

---

## Karşılaşılan Sorunlar ve Çözümleri

### 1. SQL Server 2012 – Modern Java TLS Uyumsuzluğu
**Sorun:** SQL Server 2012 yalnızca TLS 1.0 konuşurken modern JDK güvenlik politikası TLS 1.0'ı devre dışı bırakıyor; bağlantı kurulamadı.
**Çözüm:** JDBC sürücüsü uyumlu sürüme sabitlendi, lokal geliştirme için TLS override tanımlandı. Üretimde güncel SQL Server ile bu geçici çözüme gerek kalmayacağı not edildi.

### 2. Mock Konum Tespitinin Çalışmaması (Konum API Katmanı)
**Sorun:** Sahte GPS aktifken uygulama konumu hiç alamıyor, mock tespiti tetiklenmiyordu.
**Teşhis:** Kullanılan kütüphane Android'in eski LocationManager API'sini dinliyordu; sahte GPS uygulamaları modern FusedLocationProvider'ı besliyor — iki katman birbirini görmüyordu.
**Çözüm:** FusedLocationProvider tabanlı `react-native-geolocation-service` kütüphanesine geçildi, `position.mocked` bayrağıyla tespit sağlandı. Test aracının niteliğinin de kritik olduğu görüldü: sürekli yayın yapmayan sahte GPS uygulaması timeout'a yol açarken, sürekli yayın yapan araçla tespit anında çalıştı. Süreç, adım adım değişken izole ederek hata ayıklamanın örneği olarak kaydedildi.

### 3. Puantaj Motorunda Hesap Hataları
**Sorun:** Hafta sonuna mesai beklentisi yazılması; hafta sonu mesaisinden mola düşülmesi (65dk çalışma → 5dk görünüyordu); çift GİRİŞ'te ilk giriş saatinin üst yazılması.
**Çözüm:** Hafta sonu beklenen süre 0 + `WEEKEND_WORK` durumu; hafta sonu mola düşümü kaldırıldı; çift eşleştirme, eşleşen tüm çiftleri toplayıp eşleşmeyenleri anomali olarak işaretleyecek şekilde düzeltildi. Debug logları teşhis için `debug` seviyesinde kalıcı bırakıldı.

### 4. Ağ Erişimi (Fiziksel Cihaz – Lokal Backend)
**Sorun:** Telefon tarayıcıdan backend'e ulaşırken uygulama "Sunucuya bağlanılamadı" veriyordu.
**Çözüm:** Android 9+ cleartext (HTTP) kısıtı için `network_security_config` tanımlandı, güvenlik duvarında 8080 portu açıldı.

---

## Bilinen Sınırlamalar ve Üretim Notları

- **iOS:** Derleme macOS/Xcode gerektirdiğinden bu stajda kapsam dışıdır (işveren onayıyla). Kod tabanı iOS uyumludur; iOS'ta resmi mock-konum API'si bulunmadığından TC04 sunucu tarafı anomali katmanıyla karşılanacak şekilde tasarlanmıştır.
- **Huawei (HMS):** GMS bulunmayan cihazlar HMS Location Kit entegrasyonu gerektirir; kapsam dışıdır (işveren onayıyla).
- **QR:** Mevcut QR'lar statiktir; zamanla değişen dinamik QR yol haritasındadır.
- **Kayıt silme:** Gerekçe zorunludur ve denetim loguna yazılır; üretim için tam soft-delete önerilir.
- **Bordro:** Sistem bilinçli olarak bordro/maaş hesabına girmez; puantaj CSV çıktısı bordro yazılımına/mali müşavire veri sağlar.

---

## Ekran Görüntüsü Dizini (docs/screenshots/)

| Dosya | İçerik |
|---|---|
| `login.png` | Giriş ekranı |
| `sifre-degistirme.png` | Zorunlu ilk şifre değişimi + canlı kural doğrulama |
| `home-icerde.png` / `home-disarida.png` | Ana ekran iki durum varyantı (vardiya kartı + dinamik butonlar) |
| `qr-tarama.png` | QR tarama + arka plan konum göstergesi |
| `gecis-onay.png` | Geçiş onayı (tip değiştirme linkiyle) |
| `gecis-basarili.png` | Başarı ekranı |
| `gecmis.png` | Geçmiş hareketler listesi |
| `profil.png` | Profil (BU AY özeti + kayıtlı cihaz) |
| `tc01-cihaz-eslestirildi.png` | İlk cihaz eşleştirme bilgilendirmesi |
| `tc01-device-mismatch.png` | Farklı cihaz engel ekranı |
| `tc02-offline-basari.png` | Çevrimdışı başarı ekranı |
| `tc02-ana-ekran-bekliyor.png` | Çevrimdışı bant + senkron rozeti |
| `tc02-gecmis-bekliyor.png` | BEKLİYOR etiketli kayıtlar |
| `tc02-sync-sonrasi.png` | Senkronizasyon sonrası |
| `tc03-gps-kapali.png` | Konum alınamıyor ekranı |
| `tc03-konum-dogrulaniyor.png` | Normal konum doğrulama akışı |
| `tc04-fake-gps-ekrani.png` | Sahte konum red ekranı |
| `panel-dashboard.png` | Admin dashboard |
| `panel-personel.png` | Personel yönetimi |
| `panel-cihazlar.png` | Cihaz eşleştirmeleri |
| `panel-gecisler.png` | Filtreli geçiş kayıtları |
| `panel-supheli-denemeler.png` | Şüpheli denemeler (sebep rozetleriyle) |
| `panel-lokasyonlar-qr.png` | Lokasyonlar + QR üretim modali |
| `panel-vardiyalar.png` | Vardiya yönetimi |
| `panel-puantaj.png` | Aylık puantaj raporu |
| `panel-puantaj-duzelt.png` | Manuel düzeltme modali |
| `panel-silme-gerekce.png` | Gerekçeli silme modali |
| `export-excel.png` | Excel'de açılmış CSV çıktısı |
