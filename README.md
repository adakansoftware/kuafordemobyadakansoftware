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
npm run prisma:generate
npm run prisma:validate
npm run db:migrate
npm run db:hardening
npm run ops:migration-check
npm run ops:hardening-check
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
npm run ops:hardening-check
npm run ops:preflight
npm run verify:ci
npm run ops:retention -- --audit-days=90 --rate-limit-days=7
npm run ops:audit-summary -- --days=7
npm run build
npm run verify
npm run prisma:generate
npm run prisma:validate
npm run db:generate
npm run db:push
npm run db:migrate
npm run db:hardening
npm run db:seed
```

## Son Tamamlananlar

- `Faz 6`: Prisma migration disiplini ve baseline migration kaydi
- `Faz 7`: Audit raporlama ve retention komutlari
- `Faz 8`: Operasyon komutlarinin `verify` hattina baglanmasi
- `Faz 9`: Rezervasyon route/action kararlarinin ayrik helper'lara tasinmasi ve unit test kapsamining genisletilmesi

## Ortam Degiskenleri

Gerekli degiskenlerin ornekleri `.env.example` dosyasinda bulunur.

- `DATABASE_URL`: PostgreSQL baglantisi
- `NEXT_PUBLIC_SITE_URL`: canli site adresi
- `NODE_ENV`: `development`, `test` veya `production`
- `ADMIN_USERNAME`: admin kullanici adi
- `ADMIN_PASSWORD`: admin sifresi, en az 12 karakter
- `ALLOWED_ORIGIN_HOSTS`: ek izinli hostlar, sadece host ismi kullanin

Local gelistirme icin de `.env.local` icinde `NEXT_PUBLIC_SITE_URL`, `ADMIN_USERNAME` ve `ADMIN_PASSWORD`
alanlarini doldurmaniz onerilir; boylece `npm run ops:preflight` uyari vermez ve admin akislarini yerelde de
dogrulayabilirsiniz.

## Saglik ve Operasyon

- Health endpoint: `/api/health?scope=ready`
- Liveness probe: `/api/health?scope=live`
- Public booking endpoint: `/api/bookings`
- Migration check: `npm run ops:migration-check`
- Hardening manifest check: `npm run ops:hardening-check`
- Deploy preflight: `npm run ops:preflight`
- CI verify: `npm run verify:ci`
- Audit summary: `npm run ops:audit-summary -- --days=7`
- Retention dry-run: `npm run ops:retention -- --audit-days=90 --rate-limit-days=7`
- Tenant-aware index sertlestirmesi: `npm run db:hardening`
- Preflight, `.env.example` benzeri placeholder URL/host/sifre degerlerini de uyari olarak raporlar
- Operasyon notlari: [docs/OPERATIONS.md](/C:/Users/adaka/Desktop/aktif%20projeler/kuafordemobyadakansoftware/docs/OPERATIONS.md)

## Notlar

- Admin alani Basic Auth ile korunur.
- Booking akisi hizmet suresine gore cakisma ve kapasite kontrolu yapar.
- Unit test, smoke test, migration check, preflight ve typecheck birlikte `npm run verify` ile calistirilir.
- Build adimi `npm run build` ile ayri calistirilir; CI hattinda da verify sonrasi bagimsiz adim olarak kosulur.
