# Production Hardening Checklist

- `APP_SECURITY_SECRET` tanimla ve duzenli secret rotation planina bagla.
- Admin erisimini `ADMIN_ALLOWLIST_IPS` ile ofis/VPN cikis IP'leriyle sinirla.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` ve `TURNSTILE_SECRET_KEY` ile Turnstile'i aktif et.
- `HEALTHCHECK_TOKEN` tanimla; `/api/health?scope=ready` probe'larini basic auth yerine tercihen bu token ile cagir.
- Reverse proxy veya CDN katmaninda `TRACE` ve `TRACK` methodlarini reddet.
- Cloudflare veya benzeri WAF katmaninda `/api/bookings`, `/musteri`, `/admin` icin bot fight ve challenge policy uygula.
- CDN/WAF katmaninda IP reputation, ASN denylist ve country-based anomaly kurallarini ac.
- Veritabani tarafinda `npm run db:hardening` ve `npm run db:migrate` akislarini deployment pipeline'ina ekle.
- Uygulama loglarini merkezi bir sisteme aktar; `requestId`, `event`, `route`, `level` alanlarini indeksle.
- Health endpoint'ini load balancer readiness probe icin `/api/health?scope=ready` ile kullan; `x-health-token` header'i gonder ve public tarafta sadece `scope=live` kullan.
- Production ortaminda admin basic auth credential'larini uzun, rastgele ve secret manager uzerinden yonet.
- Uygulama ve veritabani icin connection limit, autoscaling ve p95/p99 latency alarm'lari tanimla.
- Bot basincinda `429`, `503`, `Retry-After` ve `X-Backpressure` metriklerini alarm kaynagi yap.
