# Adakan Hair Studio

Next.js tabanli kuafor sitesi ve randevu yonetim cekirdegi. Bu repo, vitrin sitesi ile birlikte gercek kullanimda is gorecek rezervasyon, admin operasyonu, veri dogrulama ve temel guvenlik katmanlarini icerir.

## Kapsam

- Premium salon vitrin sitesi
- Online randevu talep akisi
- Admin operasyon paneli
- Prisma + PostgreSQL veri katmani
- Origin kontrolu, rate limit ve Basic Auth korumasi
- SEO, sitemap, robots ve health endpointleri

## Kurulum

```bash
npm install
cp .env.example .env.local
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

## Komutlar

```bash
npm run dev
npm run lint
npm run test:smoke
npm run build
npm run prisma:generate
npm run prisma:push
npm run db:seed
```

## Ortam Degiskenleri

Gerekli degiskenlerin ornekleri `.env.example` dosyasinda bulunur.

- `DATABASE_URL`: PostgreSQL baglantisi
- `NEXT_PUBLIC_SITE_URL`: canli site adresi
- `ADMIN_USERNAME`: admin kullanici adi
- `ADMIN_PASSWORD`: admin sifresi
- `ALLOWED_ORIGIN_HOSTS`: ek izinli hostlar

## Saglik ve Operasyon

- Health endpoint: `/api/health`
- Public booking endpoint: `/api/bookings`
- Operasyon notlari: [docs/OPERATIONS.md](/C:/Users/adaka/Desktop/aktif%20projeler/kuafordemobyadakansoftware/docs/OPERATIONS.md)

## Notlar

- Admin alani Basic Auth ile korunur.
- Booking akisi hizmet suresine gore cakisma ve kapasite kontrolu yapar.
- CI, lint ve build kontrollerini otomatik calistirir.
