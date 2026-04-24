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
  --bg:#ffffff;          /* white canvas */
  --bg-soft:#f7f9fa;     /* off-white section fill */
  --bg-tint:#eef9f8;     /* soft teal tint */
  --ink:#1a202c;         /* dark charcoal body */
  --teal:#14b8a6;        /* primary accent / CTA */
  --teal-deep:#0f766e;   /* headings accent */
  --teal-100:#99f6e4;    /* highlight */
}
```

Aesthetic: matches the live `standardpowerwashing.com` theme — white canvas, dark charcoal text, teal accents, soft rounded corners (10-20px), subtle shadows for depth, sticky blurred header, generous whitespace. **Manrope** geometric sans across display + body for a clean, modern, user-friendly feel. Gentle scroll-reveal animations; pulse indicator on hero badge; smooth press-down on buttons with teal shadow depth cue.
