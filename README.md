# Scan & Eat — Frontend (static, ready for Vercel)

Three plain HTML/CSS/JS apps, no build step, no dependencies to install:

| App | URL | Who uses it |
|---|---|---|
| Customer | `/customer/index.html?table=<token>` | Guests, via the QR code on their table |
| Kitchen Display | `/kitchen/login.html` | Kitchen staff — live incoming orders |
| Admin Dashboard | `/admin/login.html` | Owner/manager — menu, offers, tables, QR codes |

`/` is a small launcher page. `/customer`, `/kitchen` and `/admin` redirect to the right entry page.

## Out of the box: demo preview

`BACKEND_URL` is empty, so every app runs in **demo mode**: sample menu, sample
kitchen tickets, sample admin data, all inside the browser. Nothing is sent
anywhere, no network request is made, and a banner says so on every page.
Staff apps accept the demo accounts only in this mode (see the project report).
Refreshing the page resets the sample data.

## Deploy on Vercel

This folder is the project root (it contains `vercel.json`).

**CLI**

```bash
npm i -g vercel
cd scan-eat-frontend
vercel          # first run: log in; Framework "Other", no build command, output directory "./"
vercel --prod
```

**GitHub** — push the *contents* of this folder as a repository, then Vercel →
Add New → Project → Import. Framework Preset: **Other**. Leave Build Command,
Output Directory and Install Command empty.

If the deployment URL asks you to log in to Vercel, that is *Deployment
Protection* — turn it off under Project Settings → Deployment Protection.

## Connect a real backend later

1. Deploy the ASP.NET Core backend (HTTPS).
2. Set the same value in **both** `shared/js/config.js` and `customer/js/config.js`:
   ```js
   const BACKEND_URL = "https://api.your-domain.com";   // no trailing slash, no "/api"
   ```
   (`"same-origin"` is for when these files are served by the backend's own `wwwroot`.)
3. On the backend set `Cors__AllowedOrigins__0=https://<your-vercel-domain>` and
   `FrontendBaseUrl=https://<your-vercel-domain>` (that is what gets printed into the table QR codes).
4. Optional: tighten `connect-src` in `vercel.json` from `https: wss:` to your API origin.

With a backend configured, an unreachable server is shown as an error: the
sample-data fallback only exists on localhost, so real customers can never be
shown sample data or a fake "order sent" message.

## Files

```
index.html, landing.js      launcher page
vercel.json                 redirects + security headers (CSP, nosniff, frame-deny, ...)
robots.txt                  keeps /admin and /kitchen out of search results
shared/                     config, auth, API client, login form (kitchen + admin)
customer/  kitchen/  admin/ the three apps (customer/ is self-contained, own config.js)
```

Kitchen live updates use the SignalR browser client from cdnjs (pinned 8.0.7, with an
SRI hash). If the hub is unreachable the board keeps working by polling every 10 s.
