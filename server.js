const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the single-file site + any future static assets from project root.
// Cache strategy: always revalidate HTML so new deploys are visible immediately
// (mobile browsers and the Fastly edge in front of Railway both honor this);
// keep static assets cached aggressively since they change less often.
app.use(express.static(__dirname, {
  etag: true,
  index: 'index.html',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    }
  }
}));

// Per-IP rate limiter (5 submissions / hour)
const rateMap = new Map();
function rateLimit(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const max = 5;
  if (!rateMap.has(ip)) rateMap.set(ip, []);
  const hits = rateMap.get(ip).filter(t => now - t < windowMs);
  if (hits.length >= max) {
    return res.status(429).json({ success: false, message: 'Too many requests. Please call us directly at 682-362-7638.' });
  }
  hits.push(now);
  rateMap.set(ip, hits);
  next();
}

app.post('/api/quote', rateLimit, async (req, res) => {
  const { name, email, propertyType, stories, sqft, details } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and email are required.' });
  }

  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });

  const logEntry = `\n--- QUOTE REQUEST ${timestamp} ---\nName: ${name}\nEmail: ${email}\nProperty: ${propertyType || 'N/A'}\nStories: ${stories || 'N/A'}\nSq Ft: ${sqft || 'N/A'}\nDetails: ${details || 'N/A'}\n`;

  try {
    fs.appendFileSync(path.join(__dirname, 'leads.log'), logEntry);
  } catch (e) {
    console.error('Failed to write lead log:', e.message);
  }

  console.log(logEntry);

  const RESEND_KEY = process.env.RESEND_API_KEY;
  const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'info@standardpowerwashing.com';
  // standardpowerwashing.com is verified in Resend (DKIM + SPF/MX via GoDaddy),
  // so we can send from a branded address. Override via env if ever needed.
  const FROM_EMAIL = process.env.FROM_EMAIL || 'Standard Power Washing <quotes@standardpowerwashing.com>';

  if (RESEND_KEY) {
    try {
      const emailHtml = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;max-width:600px;margin:0 auto;background:#f5efe2;padding:28px;border-radius:8px;border:1px solid #ddd4bf;">
          <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#0a1430;margin-bottom:2px;letter-spacing:-0.02em;">New Quote Request</div>
          <div style="color:#626c8a;margin-bottom:22px;font-size:13px;">${timestamp}</div>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:11px 0;border-bottom:1px solid #ede5d1;font-weight:600;color:#1e2847;width:120px;font-size:13px;">Name</td><td style="padding:11px 0;border-bottom:1px solid #ede5d1;color:#0a1430;">${name}</td></tr>
            <tr><td style="padding:11px 0;border-bottom:1px solid #ede5d1;font-weight:600;color:#1e2847;font-size:13px;">Email</td><td style="padding:11px 0;border-bottom:1px solid #ede5d1;"><a href="mailto:${email}" style="color:#2556c9;font-weight:600;">${email}</a></td></tr>
            <tr><td style="padding:11px 0;border-bottom:1px solid #ede5d1;font-weight:600;color:#1e2847;font-size:13px;">Property</td><td style="padding:11px 0;border-bottom:1px solid #ede5d1;color:#0a1430;">${propertyType || '—'}</td></tr>
            <tr><td style="padding:11px 0;border-bottom:1px solid #ede5d1;font-weight:600;color:#1e2847;font-size:13px;">Stories</td><td style="padding:11px 0;border-bottom:1px solid #ede5d1;color:#0a1430;">${stories || '—'}</td></tr>
            <tr><td style="padding:11px 0;border-bottom:1px solid #ede5d1;font-weight:600;color:#1e2847;font-size:13px;">Sq. Footage</td><td style="padding:11px 0;border-bottom:1px solid #ede5d1;color:#0a1430;">${sqft || '—'}</td></tr>
            <tr><td style="padding:11px 0;font-weight:600;color:#1e2847;vertical-align:top;font-size:13px;">Details</td><td style="padding:11px 0;color:#0a1430;">${details || '—'}</td></tr>
          </table>
          <p style="margin:22px 0 0;font-size:12px;color:#8a94b0;">Sent from standardpowerwashing.com</p>
        </div>
      `;

      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [NOTIFY_EMAIL],
          // Let Ross hit "Reply" from info@ and respond directly to the lead
          reply_to: email,
          subject: `New Quote: ${name}${propertyType ? ' — ' + propertyType : ''}`,
          html: emailHtml
        })
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error('Resend error:', errText);
      } else {
        console.log('Email sent successfully to', NOTIFY_EMAIL);
      }
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
    }
  } else {
    console.log('RESEND_API_KEY not set — email not sent. Lead saved to leads.log');
  }

  res.json({ success: true, message: 'Quote request received!' });
});

app.get('/sitemap.xml', (req, res) => {
  const host = process.env.SITE_URL || `https://${req.headers.host}`;
  const today = new Date().toISOString().split('T')[0];
  res.header('Content-Type', 'application/xml');
  // Include in-page anchors so Google indexes each section as a distinct
  // discovery target for service-specific queries (e.g. "roof cleaning fort worth").
  const urls = [
    { path: '/',            pri: '1.0', freq: 'weekly' },
    { path: '/#products',   pri: '0.9', freq: 'monthly' },
    { path: '/#services',   pri: '0.9', freq: 'monthly' },
    { path: '/#estimator',  pri: '0.9', freq: 'monthly' },
    { path: '/#work',       pri: '0.8', freq: 'weekly' },
    { path: '/#benefits',   pri: '0.7', freq: 'monthly' },
    { path: '/#about',      pri: '0.6', freq: 'monthly' },
    { path: '/#quote',      pri: '0.9', freq: 'monthly' },
    { path: '/#contact',    pri: '0.7', freq: 'monthly' }
  ];
  const body = urls.map(u =>
    `  <url><loc>${host}${u.path}</loc><lastmod>${today}</lastmod><changefreq>${u.freq}</changefreq><priority>${u.pri}</priority></url>`
  ).join('\n');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`);
});

app.get('/robots.txt', (req, res) => {
  const host = process.env.SITE_URL || 'https://www.standardpowerwashing.com';
  res.type('text/plain');
  // Explicitly invite major crawlers and declare the sitemap.
  res.send(
    'User-agent: *\n' +
    'Allow: /\n' +
    'Disallow: /api/\n' +
    'Disallow: /leads.log\n' +
    '\n' +
    'User-agent: Googlebot\n' +
    'Allow: /\n' +
    '\n' +
    'User-agent: Bingbot\n' +
    'Allow: /\n' +
    '\n' +
    `Sitemap: ${host}/sitemap.xml\n`
  );
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Standard Power Washing site running on port ${PORT}`);

  // Startup diagnostics — exposes WHY the Resend key isn't picked up, without
  // leaking the key itself. Looks for the variable, any near-miss names, and
  // common paste mistakes (quotes, whitespace).
  const resendRaw = process.env.RESEND_API_KEY;
  const resendEnvKeys = Object.keys(process.env).filter(k => /resend/i.test(k));

  if (typeof resendRaw === 'undefined') {
    console.log('⚠ RESEND_API_KEY is UNDEFINED in this container.');
    if (resendEnvKeys.length) {
      console.log('  ↳ But these Resend-ish env keys ARE set:', resendEnvKeys.join(', '));
      console.log('  ↳ Rename one of them to exactly "RESEND_API_KEY" in Railway → Variables.');
    } else {
      console.log('  ↳ No env vars matching /resend/i were found at all.');
      console.log('  ↳ Check Railway → your service → Variables. Name must be exactly RESEND_API_KEY (no quotes).');
    }
  } else if (resendRaw === '') {
    console.log('⚠ RESEND_API_KEY is set but EMPTY.');
  } else {
    const trimmed = resendRaw.trim().replace(/^["']|["']$/g, '');
    const hadQuotes = trimmed !== resendRaw.trim();
    const hadWhitespace = resendRaw !== resendRaw.trim();
    console.log(`✓ RESEND_API_KEY is set (length=${resendRaw.length}, starts with "${resendRaw.slice(0, 3)}…")`);
    if (hadWhitespace) console.log('  ⚠ Value has leading/trailing whitespace — remove it in Railway → Variables.');
    if (hadQuotes)     console.log('  ⚠ Value is wrapped in quote characters — remove them in Railway → Variables.');
    if (!resendRaw.startsWith('re_')) console.log('  ⚠ Resend keys normally start with "re_" — double-check you pasted the right key.');
  }
  console.log(`  → Leads will be delivered to: ${process.env.NOTIFY_EMAIL || 'info@standardpowerwashing.com'}`);
  console.log(`  → FROM header: ${process.env.FROM_EMAIL || 'Standard Power Washing <quotes@standardpowerwashing.com>'}`);
});
