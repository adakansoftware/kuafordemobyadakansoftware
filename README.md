# Adakan Hair Studio

Adakan Hair Studio için hazırlanmış, production'a yakın kalite hedefiyle güçlendirilmiş Next.js tabanlı salon sitesi ve randevu operasyon çekirdeği.

## Kapsam

- Premium salon vitrin deneyimi
- Online randevu talep akışı
- Admin operasyon paneli
- Prisma + PostgreSQL veri katmanı
- Güvenlik başlıkları, proxy koruması ve rate-limit yapısı
- SEO, sitemap, robots ve structured data desteği

## Komutlar

```bash
npm install
npm run lint
npm run test:smoke
npm run build
npx prisma generate
npx prisma db push
npm run db:seed
```

## Sağlık Kontrolü

- Public sağlık endpointi: `/api/health`
- Booking API endpointi: `/api/bookings`

## Notlar

- Admin alanı Basic Auth ile korunur.
- Booking akışı çakışma kontrolü, kapasite kontrolü ve input validation ile sertleştirilmiştir.
- CI workflow'u her push ve PR'da lint, smoke check ve build adımlarını çalıştırır.
