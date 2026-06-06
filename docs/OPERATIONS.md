# Operations Runbook

Bu proje UI degisimi gerektirmeden gercek kullanim icin daha saglam bir cekirdek sunar. Canliya cikmadan once asagidaki maddeleri tamamlayin.

## 1. Zorunlu Kurulum

- `DATABASE_URL` icin yonetilen bir PostgreSQL servisi kullanin.
- `NEXT_PUBLIC_SITE_URL` degerini canli domain ile birebir eslestirin.
- `ADMIN_USERNAME` ve en az 12 karakterlik `ADMIN_PASSWORD` icin guclu, benzersiz degerler tanimlayin.
- `ALLOWED_ORIGIN_HOSTS` icine kullandiginiz ek hostlari ekleyin.

## 2. Canliya Cikis Kontrolu

- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run test:smoke`
- `npm run ops:migration-check`
- `npm run ops:preflight`
- `npm run build`
- `npx prisma generate`
- `npx prisma migrate deploy`

## 3. Rezervasyon Mantigi

- Sistem yalnizca baslangic saatini degil, hizmetin kapladigi tum yari saatlik zaman pencerelerini dikkate alir.
- Bu sayede uzun sureli islemler sonraki slotlari da bloke eder.
- Eszamanli rezervasyonlarda PostgreSQL advisory lock ile ayni zaman pencereleri transaction bazinda kilitlenir.

## 4. Health ve Readiness

- `/api/health?scope=live` endpointini basic uptime monitor ile 1 dakikalik aralikta izleyin.
- `/api/health?scope=ready` endpointini deploy sonrasi readiness kontrolde kullanin.
- Readiness sonucu `rate_limit_storage` veya `audit_log_storage` icin hata donuyorsa `npx prisma migrate deploy` adimini yeniden calistirin.
- `HEAD /api/health?scope=ready` probe'u da desteklenir; body ihtiyaci olmayan monitorlerde bunu tercih edin.

## 5. Gunluk Operasyon

- Admin erisim loglarini hosting tarafinda saklayin.
- Veritabani yedeklemesini gunluk otomatik alin.
- Rate-limit tablosunu periyodik olarak kontrol edin; beklenmeyen artis bot trafigine isaret edebilir.
- Haftalik olarak audit log buyumesini kontrol edin; beklenmeyen artis abuse veya operasyon hatasina isaret edebilir.
- `npm run ops:audit-summary -- --days=7` ile haftalik audit ozeti alin.
- `npm run ops:retention -- --audit-days=90 --rate-limit-days=7` ile once dry-run yapin, sonra gerekiyorsa `--apply` ile temizlik calistirin.

## 6. Guvenlik

- Admin sifresini duz metin paylasmayin; sadece secret manager uzerinden dagitin.
- Production ortaminda HTTPS zorunlu olsun.
- Domain degisirse `NEXT_PUBLIC_SITE_URL` ve `ALLOWED_ORIGIN_HOSTS` birlikte guncellensin.
- Gerekmiyorsa preview deployment'lari public booking icin kullanmayin.

## 7. Kurtarma ve Bakim

- Yeni ortama geciste sira: `npx prisma generate` -> `npx prisma migrate deploy` -> `npm run ops:migration-check` -> `npm run ops:preflight` -> `npm run verify`.
- Audit log yazimi warning veriyorsa uygulama calismaya devam eder, ancak operasyon izi eksik kalir; ilk firsatta Prisma migration'larini hedef veritabanina uygulayin.
- Rate-limit tablo erisiminde sorun varsa sistem memory fallback ile calisir; bu durum gecicidir ve node yeniden basladiginda sayaclar sifirlanir.
- Migration klasoru artik repo icinde versiyonlanir. Yeni schema degisikliginde `db push` yerine migration uretip review ederek ilerleyin.

## 8. Isletme Tavsiyeleri

- Randevu onay surecini en fazla 15-30 dakika icinde tamamlayin.
- Iptal ve degisiklik politikasini ekip ici standartlastirin.
- Haftalik olarak tamamlanan randevu, iptal ve doluluk oranlarini takip edin.
