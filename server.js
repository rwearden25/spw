const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the single-file site + any future static assets from project root
app.use(express.static(__dirname, {
  maxAge: '7d',
  etag: true,
  index: 'index.html'
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
  const { services, propertyType, details, timeline, name, phone, email, city } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Name and phone are required.' });
  }

  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });

  const logEntry = `\n--- QUOTE REQUEST ${timestamp} ---\nName: ${name}\nPhone: ${phone}\nEmail: ${email || 'N/A'}\nCity: ${city || 'N/A'}\nServices: ${(services || []).join(', ')}\nProperty: ${propertyType || 'N/A'}\nTimeline: ${timeline || 'N/A'}\nDetails: ${details || 'N/A'}\n`;

  try {
    fs.appendFileSync(path.join(__dirname, 'leads.log'), logEntry);
  } catch (e) {
    console.error('Failed to write lead log:', e.message);
  }

  console.log(logEntry);

  const RESEND_KEY = process.env.RESEND_API_KEY;
  const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'info@standardpowerwashing.com';
  const FROM_EMAIL = process.env.FROM_EMAIL || 'Standard Power Washing <quotes@standardpowerwashing.com>';

  if (RESEND_KEY) {
    try {
      const emailHtml = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;max-width:600px;margin:0 auto;background:#faf7f0;padding:28px;border-radius:16px;border:1px solid #d9d3c2;">
          <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#0f1115;margin-bottom:2px;letter-spacing:-0.02em;">New Quote Request</div>
          <div style="color:#6b6f7c;margin-bottom:22px;font-size:13px;">${timestamp}</div>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:11px 0;border-bottom:1px solid #e8e1cf;font-weight:600;color:#2a2d36;width:120px;font-size:13px;">Name</td><td style="padding:11px 0;border-bottom:1px solid #e8e1cf;color:#0f1115;">${name}</td></tr>
            <tr><td style="padding:11px 0;border-bottom:1px solid #e8e1cf;font-weight:600;color:#2a2d36;font-size:13px;">Phone</td><td style="padding:11px 0;border-bottom:1px solid #e8e1cf;"><a href="tel:${phone}" style="color:#2556c9;font-weight:600;">${phone}</a></td></tr>
            <tr><td style="padding:11px 0;border-bottom:1px solid #e8e1cf;font-weight:600;color:#2a2d36;font-size:13px;">Email</td><td style="padding:11px 0;border-bottom:1px solid #e8e1cf;color:#0f1115;">${email || '—'}</td></tr>
            <tr><td style="padding:11px 0;border-bottom:1px solid #e8e1cf;font-weight:600;color:#2a2d36;font-size:13px;">City</td><td style="padding:11px 0;border-bottom:1px solid #e8e1cf;color:#0f1115;">${city || '—'}</td></tr>
            <tr><td style="padding:11px 0;border-bottom:1px solid #e8e1cf;font-weight:600;color:#2a2d36;font-size:13px;">Services</td><td style="padding:11px 0;border-bottom:1px solid #e8e1cf;color:#0f1115;">${(services || []).join(', ') || '—'}</td></tr>
            <tr><td style="padding:11px 0;border-bottom:1px solid #e8e1cf;font-weight:600;color:#2a2d36;font-size:13px;">Property</td><td style="padding:11px 0;border-bottom:1px solid #e8e1cf;color:#0f1115;">${propertyType || '—'}</td></tr>
            <tr><td style="padding:11px 0;border-bottom:1px solid #e8e1cf;font-weight:600;color:#2a2d36;font-size:13px;">Timeline</td><td style="padding:11px 0;border-bottom:1px solid #e8e1cf;color:#0f1115;">${timeline || '—'}</td></tr>
            <tr><td style="padding:11px 0;font-weight:600;color:#2a2d36;vertical-align:top;font-size:13px;">Details</td><td style="padding:11px 0;color:#0f1115;">${details || '—'}</td></tr>
          </table>
          <p style="margin:22px 0 0;font-size:12px;color:#8a8e9a;">Sent from standardpowerwashing.com</p>
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
          subject: `New Quote: ${name} — ${(services || []).join(', ') || 'SPW'}`,
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
  res.header('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${host}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
</urlset>`);
});

app.get('/robots.txt', (req, res) => {
  const host = process.env.SITE_URL || 'https://standardpowerwashing.com';
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nSitemap: ${host}/sitemap.xml`);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Standard Power Washing site running on port ${PORT}`);
  if (!process.env.RESEND_API_KEY) {
    console.log('⚠ RESEND_API_KEY not set. Quote emails disabled. Leads will be saved to leads.log');
  }
});
