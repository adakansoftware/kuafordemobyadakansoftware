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
- `npm run build`
- `npx prisma generate`
- `npx prisma db push`

## 3. Rezervasyon Mantigi

- Sistem yalnizca baslangic saatini degil, hizmetin kapladigi tum yari saatlik zaman pencerelerini dikkate alir.
- Bu sayede uzun sureli islemler sonraki slotlari da bloke eder.
- Eszamanli rezervasyonlarda PostgreSQL advisory lock ile ayni zaman pencereleri transaction bazinda kilitlenir.

## 4. Gunluk Operasyon

- `/api/health` endpointini uptime monitor ile 1 dakikalik aralikta izleyin.
- Admin erisim loglarini hosting tarafinda saklayin.
- Veritabani yedeklemesini gunluk otomatik alin.
- Rate-limit tablosunu periyodik olarak kontrol edin; beklenmeyen artis bot trafigine isaret edebilir.

## 5. Guvenlik

- Admin sifresini duz metin paylasmayin; sadece secret manager uzerinden dagitin.
- Production ortaminda HTTPS zorunlu olsun.
- Domain degisirse `NEXT_PUBLIC_SITE_URL` ve `ALLOWED_ORIGIN_HOSTS` birlikte guncellensin.
- Gerekmiyorsa preview deployment'lari public booking icin kullanmayin.

## 6. Isletme Tavsiyeleri

- Randevu onay surecini en fazla 15-30 dakika icinde tamamlayin.
- Iptal ve degisiklik politikasini ekip ici standartlastirin.
- Haftalik olarak tamamlanan randevu, iptal ve doluluk oranlarini takip edin.
