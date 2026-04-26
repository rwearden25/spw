# Standard Power Washing — Site

Single-page marketing site for **Standard Power Washing LLC** (Fort Worth, TX). Live at [www.standardpowerwashing.com](https://www.standardpowerwashing.com). Served by Express with a Resend-backed lead endpoint.

- **Contact:** 682-362-7638 · info@standardpowerwashing.com
- **Hours:** Mon–Sun, 7:00am – 7:00pm
- **Service:** Residential · Commercial · Industrial

## Section structure (top to bottom)

1. **Hero** — full-bleed Getty video, primary CTA "Request a Free Estimate" → `#quote`, secondary CTA "Our Products" → `#products`
2. **Plan a Project** (`#estimator`) — interactive lead-capture configurator (service · property · sqft). **No prices displayed** — see Public pricing policy below
3. **Products** (`#products`) — SPW Inc software portfolio tiles linking out to `psupp.ai`, `pzip.ai`, `pquote.ai`, `www.pquote.ai/voice`
4. **Services** (`#services`) — pressure-washing service cards (House Wash, Concrete, Roof, etc.) — keyword-rich body copy for SEO
5. **Our Work** (`#work`) — before/after compare sliders
6. **Benefits** (`#benefits`)
7. **About** (`#about`)
8. **Request a Quote** (`#quote`) — contact form, posts to `/api/quote`
9. **Contact** (`#contact`)

## Public pricing policy

> **Do not display dollar amounts, per-sqft rates, tier brackets, or quote ranges anywhere on the public site.**

Every visible surface is lead-capture only. The `Estimator` component still collects service / property / sqft as hand-raise signals, but feeds them straight into the contact form via a `spw:prefill` CustomEvent — no math, no $, no ranges. Internal-only tools can show pricing freely; the rule applies to *public* surfaces (anything served from this repo).

Rationale: published rates anchor negotiation, leak competitive intel, and undercut mid-market positioning ("not the cheapest, not the priciest"). If a future change request asks to "add a price calculator" or "show pricing," push back and confirm before implementing.

## Domain & cache topology

- **Canonical host:** `www.standardpowerwashing.com`. The bare apex `standardpowerwashing.com` 301-forwards to `www` via GoDaddy domain forwarding (registrar-level, no Railway DNS swap needed). All `<link rel="canonical">`, OG/Twitter URLs, and JSON-LD `@id`/`url` values point at `www`.
- **HTML cache:** `index.html` is served with `Cache-Control: public, max-age=0, must-revalidate` so deploys are visible immediately on returning visitors and on the Fastly edge in front of Railway. Static assets (anything non-`.html`) get `public, max-age=604800, immutable`.
- **OG image:** currently the SPW logo at 1200×1200 (Wix-CDN sourced). A proper 1200×630 designed card committed to this repo as `og-image.png` is a known follow-up; the meta tags will switch to it when the asset exists.

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
| `NOTIFY_EMAIL`     | **Where quote requests get delivered** (your GoDaddy mailbox) | `info@standardpowerwashing.com`           |
| `FROM_EMAIL`       | Resend `from` header (sandbox sender works out-of-the-box) | `Standard Power Washing <onboarding@resend.dev>` |
| `SITE_URL`         | Canonical host for `sitemap.xml` / `robots.txt`            | derived from request                      |

### To get leads landing in your GoDaddy mailbox (info@standardpowerwashing.com)

1. Sign up at [resend.com](https://resend.com) and create an API key.
2. In Railway → **Variables**, add:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```
   That's the only variable you *must* set. `NOTIFY_EMAIL` already defaults to `info@standardpowerwashing.com`, and `FROM_EMAIL` already defaults to Resend's verified sandbox sender.
3. Submit a test request from the live site. The email lands in your info@ GoDaddy inbox with a clean HTML summary; the **Reply** button goes directly to the lead's email address (set via `reply_to`).

**Later — branded sender (optional):** once you want emails to say "from `quotes@standardpowerwashing.com`" instead of `onboarding@resend.dev`, verify the domain in Resend (it gives you DKIM/SPF/MX records to add in GoDaddy's DNS panel), then set `FROM_EMAIL=Standard Power Washing <quotes@standardpowerwashing.com>` in Railway.

**Belt-and-suspenders fallback:** every submission is also appended to `leads.log` on the server, so if Resend ever misbehaves you can still recover the leads from Railway's filesystem / logs.

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
