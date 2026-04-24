# Standard Power Washing — Site

Commercial exterior cleaning site for **Standard Power Washing LLC** (Aledo / Fort Worth, TX). Single-page, mobile-first, served by Express.

- **Live contact:** 682-362-7638 · info@standardpowerwashing.com
- **Tech:** single-file `index.html` + Express for the `/api/quote` endpoint and Resend email delivery.

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
4. Add custom domain `standardpowerwashing.com`.

## Quick customization

Brand tokens live in `<style>` inside `index.html`:

```css
:root {
  --navy:#1e3a8a;       /* primary brand blue */
  --royal:#2556c9;      /* accent / CTA */
  --royal-hi:#3b73e8;
  --royal-lo:#163f9d;
  --bg:#faf7f0;         /* paper canvas */
  --ink:#0f1115;        /* body copy */
}
```

Find/replace targets when rebranding or updating contact info:

| Find                          | What it is        |
|-------------------------------|-------------------|
| `Standard Power Washing`      | Company name      |
| `standardpowerwashing.com`    | Domain            |
| `682-362-7638`                | Phone             |
| `6823627638`                  | Phone (digits)    |
| `info@standardpowerwashing.com` | Email           |
| `Aledo`                       | City              |

## Lead fallback

If `RESEND_API_KEY` is unset, every submission is appended to `leads.log` at the project root. Server logs also print each request. Rate limit: 5 requests / hour / IP.
