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
npx prisma migrate deploy
npm run ops:migration-check
npm run db:seed
npm run dev
```

## Komutlar

```bash
npm run dev
npm run lint
npm run typecheck
npm run test:unit
npm run test:smoke
npm run ops:migration-check
npm run ops:preflight
npm run ops:retention -- --audit-days=90 --rate-limit-days=7
npm run ops:audit-summary -- --days=7
npm run build
npm run verify
npm run prisma:generate
npm run db:seed
```

## Yeni Fazlar

- `Faz 6`: Prisma migration disiplini ve baseline migration kaydi
- `Faz 7`: Audit raporlama ve retention komutlari
- `Faz 8`: Bu operasyon komutlarinin verify hattina baglanmasi

## Ortam Degiskenleri

Gerekli degiskenlerin ornekleri `.env.example` dosyasinda bulunur.

- `DATABASE_URL`: PostgreSQL baglantisi
- `NEXT_PUBLIC_SITE_URL`: canli site adresi
- `ADMIN_USERNAME`: admin kullanici adi
- `ADMIN_PASSWORD`: admin sifresi, en az 12 karakter
- `ALLOWED_ORIGIN_HOSTS`: ek izinli hostlar

Local gelistirme icin de `.env.local` icinde `NEXT_PUBLIC_SITE_URL`, `ADMIN_USERNAME` ve `ADMIN_PASSWORD`
alanlarini doldurmaniz onerilir; boylece `npm run ops:preflight` uyari vermez ve admin akislarini yerelde de
dogrulayabilirsiniz.

## Saglik ve Operasyon

- Health endpoint: `/api/health?scope=ready`
- Liveness probe: `/api/health?scope=live`
- Public booking endpoint: `/api/bookings`
- Migration check: `npm run ops:migration-check`
- Deploy preflight: `npm run ops:preflight`
- Audit summary: `npm run ops:audit-summary -- --days=7`
- Retention dry-run: `npm run ops:retention -- --audit-days=90 --rate-limit-days=7`
- Operasyon notlari: [docs/OPERATIONS.md](/C:/Users/adaka/Desktop/aktif%20projeler/kuafordemobyadakansoftware/docs/OPERATIONS.md)

## Notlar

- Admin alani Basic Auth ile korunur.
- Booking akisi hizmet suresine gore cakisma ve kapasite kontrolu yapar.
- Unit test, smoke test, migration check, preflight, typecheck ve build birlikte `npm run verify` ile calistirilir.
