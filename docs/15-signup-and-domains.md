# 15 — Landing page, portfolio subdomains and custom domains

Roadmap step 5. The main site becomes the product's front door, and each portfolio gets a proper address:

| Address | When |
|---|---|
| `https://<site>/u/<username>` | Always |
| `https://<username>.<DOMAIN>` | `PORTFOLIO_SUBDOMAINS=true` (wildcard DNS + certificates) |
| `https://hana.com` (the owner's own domain) | `CUSTOM_DOMAINS=true`, once the owner's DNS proves the domain is theirs |

Everything is **off by default**. A deployment behaves exactly as before until you change `.env.prod`, set up DNS and HTTPS, and deploy.

## What users see

- **Landing page** at the main site's `/` (when `PORTFOLIO_USERNAME` is empty). It covers what Vega does, how it works, professions and features, with "Create your portfolio" and "Log in". It uses the plain app look and only product copy. If `REGISTRATION_OPEN=false`, it offers "Log in" and says sign-ups open soon (`GET /api/sites/info/`).
- **Signup** shows the address the account will get (`abebe.<DOMAIN>` or `<site>/u/abebe`).
- **Dashboard → Domain:**
  - **Addresses:** lists the portfolio's addresses, marks the main one (used on the QR code and CV PDFs) and has copy and open buttons.
  - **Your own domain:** you enter a domain and get the DNS records to add:
    - `TXT _vega.<domain>` = a random token (proves ownership)
    - `CNAME <domain> → CUSTOM_DOMAIN_TARGET` (for `www.` or other subdomains), or `A <domain> → CUSTOM_DOMAIN_IP` (for a root domain)
  - **Verify:** looks up both records and says which one is still missing. Removing the domain falls back to the subdomain.
- **On a portfolio's own address**, the portfolio is at `/` (`/projects`, `/resume`, …). `/login`, `/register` and `/dashboard` send you to the main site, because accounts live there. A domain nobody verified shows "This domain isn't connected yet".
- **QR codes, CV PDFs and the profile's `public_url`** use the best address: own domain, then subdomain, then `/u/` path.

## How it works

```
backend/portfolio/
  domains.py        resolve_host(), public_url(), DNS records, check_domain() (dnspython)
  middleware.py     PortfolioHostsMiddleware: with either feature on, ALLOWED_HOSTS becomes "*" and this
                    allows the configured hosts, real users' subdomains and verified domains only (else 400)
  views.py          GET /api/sites/info/ · /api/sites/resolve/?host= · /api/sites/tls-allowed/?domain=
  manage_views.py   GET/PUT/DELETE /api/me/domain/ · POST /api/me/domain/verify/ (10/minute)
  models.py         Portfolio.custom_domain (unique), domain_token, domain_verified_at
frontend/src/
  lib/site.js            detectSite(hostname): main site | <username>.<BASE_DOMAIN> | maybe a custom domain
  site/SiteProvider.jsx  asks /api/sites/resolve/ only on unknown hosts
  App.jsx                routes per site kind; pages/Landing.jsx; dashboard/pages/DomainPage.jsx
deploy/
  Caddyfile                              on-demand TLS edge (optional compose profile "edge")
  nginx-host-subdomains.conf.example     subdomains with the host Nginx and a wildcard certificate
```

- **Ownership is proven by the TXT record only.** Routing (CNAME or A record) is checked and reported, but not required for verification, because DNS for the domain may still be propagating. An unverified domain never resolves, never passes the host check and never gets a certificate.
- **Certificates.** Caddy's on-demand TLS asks `/api/sites/tls-allowed/` before requesting a certificate for a host. The answer is yes only for the main domain, real users' subdomains and verified domains, so nobody can make the server request certificates for arbitrary names. That endpoint is exempt from the host check, because Caddy calls it as `web`.
- **Verified domains are cached for 60 seconds.** The host check runs on every request. Changing or removing a domain clears the cache entry.
- **Reserved names.** Usernames like `app`, `mail`, `cdn` and `domains` can't be registered, and `www`, `api`, `admin`, … are never treated as portfolio subdomains.

## Turning it on

### 1. The landing page and signup

In `.env.prod`:

```
PORTFOLIO_USERNAME=          # empty: "/" is the landing page (your portfolio stays at /u/vega)
REGISTRATION_OPEN=true       # let people sign up
```

Deploy. Nothing else is needed.

### 2. Subdomains and custom domains: pick how HTTPS is done

**Option A, Caddy edge (recommended, needed for custom domains).** Caddy takes over ports 80 and 443 and gets a certificate for each host on its first visit.

1. DNS:
   - `*.andu.aetechsolution.et A <server IP>` for subdomains
   - `domains.andu.aetechsolution.et A <server IP>` as the CNAME target owners point their domains at
2. The host Nginx gives up 80 and 443:
   - In the Laravel site's Nginx config, change `listen 80` to `listen 127.0.0.1:8080` and remove its 443 block.
   - Disable `/etc/nginx/sites-enabled/andu.aetechsolution.et`.
   - `sudo systemctl reload nginx`
3. In `deploy/Caddyfile`, uncomment the block for the Laravel domain so Caddy forwards it to `host.docker.internal:8080`. Caddy gets that domain's certificate too.
4. `.env.prod`:
   ```
   PORTFOLIO_SUBDOMAINS=true
   CUSTOM_DOMAINS=true
   CUSTOM_DOMAIN_TARGET=domains.andu.aetechsolution.et
   CUSTOM_DOMAIN_IP=<server IP>
   ```
5. `docker compose -f docker-compose.prod.yml --env-file .env.prod --profile edge up -d --build`, then update `deploy.sh` to pass `--profile edge` as well.

**Option B, subdomains only, keeping the host Nginx.**
1. Get a wildcard certificate (Let's Encrypt only issues these with a DNS challenge), for example: `certbot certonly --manual --preferred-challenges dns -d andu.aetechsolution.et -d '*.andu.aetechsolution.et'`. A certbot DNS plugin makes renewal automatic.
2. Install `deploy/nginx-host-subdomains.conf.example`.
3. Set `PORTFOLIO_SUBDOMAINS=true` and deploy.

Custom domains need Option A, because each domain needs its own certificate on first use.

### Trying it locally

`*.localhost` resolves to your machine, so subdomains work without DNS:

```bash
cd backend && BASE_DOMAIN=localhost PORTFOLIO_SUBDOMAINS=1 CUSTOM_DOMAINS=1 \
  CUSTOM_DOMAIN_TARGET=domains.localhost CUSTOM_DOMAIN_IP=127.0.0.1 venv/bin/python manage.py runserver 127.0.0.1:8001
cd frontend && VITE_API_URL=/api VITE_DEV_PROXY=http://127.0.0.1:8001 VITE_BASE_DOMAIN=localhost \
  VITE_PORTFOLIO_SUBDOMAINS=true VITE_DEV_HOSTS=.test npx vite --port 5173
```

Then open `http://localhost:5173/` (landing page) and `http://sample.localhost:5173/` (a portfolio). To try a custom domain, mark it verified in the Django shell and map it to 127.0.0.1 (in `/etc/hosts`, or Chromium's `--host-resolver-rules`).

## Checks

- **Backend tests.** 8 new (`DomainTests`), 67 in total:
  - host resolution
  - connecting and verifying a domain with DNS mocked (wrong token, right token, routing check)
  - domain validation and duplicates across users
  - the TLS check
  - unknown hosts refused, while Caddy's internal check is allowed
  - site info
  - the best address for QR codes
- **Browser run with both features on:**
  - Landing page at `localhost`.
  - The demo portfolio at `sample.localhost`, with `/projects` and links working; its `/dashboard` sends you to the main site.
  - A verified custom domain (`hana.test`) shows the portfolio; an unverified one shows the "not connected" page.
  - Plain 404 on the main site.
  - The signup address preview.
  - The Domain page: invalid domain error, connect, DNS records, verify reporting both records missing.
  - No horizontal scroll at 390px.
- **axe-core.** 0 violations on the landing page, both 404 pages and the Domain page, in light and dark mode.
- **Not tested here.** I didn't run Caddy itself (no Docker daemon in this environment), so try Option A on a staging host first.

## Next

- Email verification and password reset (needs outgoing email: SMTP or a provider)
- A guided first-run setup after signup (profession → profile → look → CV)
