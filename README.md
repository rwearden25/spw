# Standard Power Washing — Site

Single-page marketing site for **Standard Power Washing LLC** (Fort Worth, TX). Copy and contact details mirror [standardpowerwashing.com](https://standardpowerwashing.com). Served by Express with a Resend-backed quote endpoint.

- **Contact:** 682-362-7638 · info@standardpowerwashing.com
- **Hours:** Mon–Sun, 7:00am – 7:00pm
- **Service:** Residential · Commercial · Industrial

## Run locally

```bash
npm install
npm start
```

Site: http://localhost:3000

## Environment

| Variable           | Purpose                                                    | Default                                   |
|--------------------|------------------------------------------------------------|-------------------------------------------|
| `PORT`             | Server port                                                | `3000`                                    |
| `RESEND_API_KEY`   | Resend API key (omit to disable email; leads still logged) | —                                         |
| `NOTIFY_EMAIL`     | Where quote requests get sent                              | `info@standardpowerwashing.com`           |
| `FROM_EMAIL`       | Resend `from` header                                       | `Standard Power Washing <quotes@standardpowerwashing.com>` |
| `SITE_URL`         | Canonical host for `sitemap.xml` / `robots.txt`            | derived from request                      |

## Deploy (Railway)

1. Push to this repo.
2. Railway → **New Project** → GitHub → select repo.
3. Add env var `RESEND_API_KEY` in Railway.
4. Point `standardpowerwashing.com` at the Railway service.

## Quote form fields (match the live site)

- Name *(required)*
- Email *(required)*
- Residential or commercial property?
- Number of building stories
- Approximate square footage
- Anything we should know? *(free text)*

Submissions go to `/api/quote`, appended to `leads.log`, and emailed via Resend if `RESEND_API_KEY` is set. Rate limit: 5 / hour / IP.

## Theme tokens

Brand tokens live in `<style>` inside `index.html`:

```css
:root {
  --c0:#f3f1ec;   /* paper concrete canvas */
  --c1:#e6e2d8;   /* light fill */
  --c5:#2a2721;   /* dark band (benefits, quote) */
  --ink:#0a0a0a;  /* raw ink — body type + rule lines */
  --blue:#2556c9; /* royal blue — sole accent */
}
```

Aesthetic: **Concrete Brutalist** — warm concrete grays with royal blue as the *only* accent. Zero border-radius, exposed grid cells with hard 1px ink rules, extreme type scale (Archivo 900 display up to 7.75rem next to 0.66rem IBM Plex Mono metadata). No shadows, no gradients, no decorative ornament. Press-down (`translate`) interactions instead of scale. Archivo (display + body) + IBM Plex Mono (labels, numerics, captions).
