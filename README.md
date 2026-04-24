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

## Tech pattern

Single `index.html` that mounts a React app via ESM:

- **Tailwind** via CDN (`cdn.tailwindcss.com`)
- **React 18 + react-icons** via `esm.sh` (`importmap`)
- Google Fonts: **Cinzel** (display, matches the live site's `Cinzel`), **Lato** (body, matches the live site), **Cabin** (labels)
- Custom atmospheric CSS (`bg-hydro` layered radials, `mist` drift animation, `grain` overlay)
- Express backend (`server.js`) still serves the file and handles `/api/quote` → Resend

## Theme: "Hydro"

Matches the live site's real palette (dark near-black + slate-blues + white — no teal, no green):

```css
/* canvas */     #0b1018  /* deep hydro */
/* surface */    rgba(255,255,255,0.055) + blur  /* card-glass */
/* borders */    rgba(200,220,255,0.09)          /* hairline */
/* text */       #e6edf5 / #b0c0d6 (steel) / #7f8ea8 (slate)
/* CTA */        polished-steel gradient (#fff → #d3dbe8 on #0b1018)
```

Atmosphere: cool radial glows suggesting water-lit space, pale mist particles drifting upward behind the hero, subtle grain overlay, italic Cinzel pulls for emphasis words (`power washing`, `cleanliness`, `touch`). All imagery is **real SPW work photos + their actual logo** from `img1.wsimg.com/isteam/ip/93f78982-b83a-41d3-9e29-d59d8d1ff91c/`. Hero background is the Getty landscaper-with-pressure-washer still used on the live homepage.
