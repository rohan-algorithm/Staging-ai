/**
 * Roomgenix app server.
 * Users, credits, studio jobs, and purchases live in MongoDB.
 * Listing photos and staged results are stored on Cloudinary.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { ObjectId } = require('mongodb');
const { connect, getDb } = require('./db');
const storage = require('./storage');
const dodo = require('./dodo');
const mail = require('./mail');
const nurture = require('./nurture');

const PORT = parseInt(process.env.PORT || '8080', 10);
const ROOT = path.join(__dirname, '..');
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || '';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
const GA_MEASUREMENT_ID = (process.env.GA_MEASUREMENT_ID || '').trim();
const GA_SNIPPET = /^G-[A-Z0-9]+$/i.test(GA_MEASUREMENT_ID)
  ? `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"></script>
<script>
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', ${JSON.stringify(GA_MEASUREMENT_ID)});
</script>`
  : '';

function pageFile(urlPath) {
  let p = urlPath.split('?')[0];
  try { p = decodeURIComponent(p); } catch { return null; }
  if (p === '/' || p === '') return path.join(ROOT, 'index.html');
  if (p === '/dashboard') return path.join(ROOT, 'dashboard.html');
  if (!p.endsWith('.html') || p.includes('..') || p.includes('\0')) return null;
  const file = path.normalize(path.join(ROOT, p));
  if (file !== path.join(ROOT, path.basename(file))) return null;
  if (!fs.existsSync(file)) return null;
  return file;
}

const SITE = 'https://roomgenix.com';

const PAGE_ROUTES = {
  '/how-to': 'how-to.html',
  '/terms': 'terms.html',
  '/privacy': 'privacy.html',
  '/mls-compliance': 'mls-compliance.html',
  '/refund': 'refund-guarantee.html',
  '/blog': 'blog.html',
  '/for-agents': 'for-agents.html',
  '/virtual-staging-vacant-listings': 'virtual-staging-vacant-listings.html',
  '/virtual-staging-for-photographers': 'virtual-staging-for-photographers.html',
  '/ai-staging-keeps-room-layout': 'ai-staging-keeps-room-layout.html',
  '/virtual-vs-physical-staging-cost': 'virtual-vs-physical-staging-cost.html',
  '/virtual-staging-short-term-rentals': 'virtual-staging-short-term-rentals.html',
  '/blog/stage-vacant-listing-in-minutes': 'blog-stage-vacant-listing-in-minutes.html',
  '/blog/is-virtual-staging-legal': 'blog-is-virtual-staging-legal.html',
  '/virtual-staging-bedroom': 'virtual-staging-bedroom.html',
  '/virtual-staging-home-office': 'virtual-staging-home-office.html',
  '/virtual-staging-dining-room': 'virtual-staging-dining-room.html',
  '/virtual-twilight-real-estate-photos': 'virtual-twilight-real-estate-photos.html',
  '/virtual-staging-declutter': 'virtual-staging-declutter.html',
  '/virtual-staging-scandinavian': 'virtual-staging-scandinavian.html',
  '/virtual-staging-farmhouse': 'virtual-staging-farmhouse.html',
  '/virtual-staging-coastal': 'virtual-staging-coastal.html',
  '/virtual-staging-luxury': 'virtual-staging-luxury.html',
  '/virtual-staging-mid-century-modern': 'virtual-staging-mid-century-modern.html',
  '/virtual-staging-modern': 'virtual-staging-modern.html',
  '/virtual-staging-traditional': 'virtual-staging-traditional.html',
  '/virtual-staging-dallas': 'virtual-staging-dallas.html',
  '/done-for-you': 'done-for-you.html',
  '/about': 'about.html',
  '/pricing': 'pricing.html',
  '/what-is-virtual-staging': 'what-is-virtual-staging.html',
  '/best-ai-virtual-staging-software': 'best-ai-virtual-staging-software.html',
  '/virtual-staging-living-room': 'virtual-staging-living-room.html'
};

const PAGE_ALIASES = {
  '/index.html': '/',
  '/how-to.html': '/how-to',
  '/for-agents.html': '/for-agents',
  '/howto': '/how-to',
  '/terms.html': '/terms',
  '/tos': '/terms',
  '/privacy.html': '/privacy',
  '/mls-compliance.html': '/mls-compliance',
  '/mls': '/mls-compliance',
  '/refund-guarantee.html': '/refund',
  '/refund-guarantee': '/refund',
  '/guarantee': '/refund',
  '/comparison': '/',
  '/dashboard.html': '/dashboard',
  '/signup': '/dashboard?auth=signup',
  '/register': '/dashboard?auth=signup',
  '/login': '/dashboard?auth=login',
  '/signin': '/dashboard?auth=login',
  '/app': '/dashboard',
  '/studio': '/dashboard',
  '/done-for-you.html': '/done-for-you',
  '/virtual-staging-vacant-listings.html': '/virtual-staging-vacant-listings',
  '/virtual-staging-for-photographers.html': '/virtual-staging-for-photographers',
  '/ai-staging-keeps-room-layout.html': '/ai-staging-keeps-room-layout',
  '/virtual-vs-physical-staging-cost.html': '/virtual-vs-physical-staging-cost',
  '/virtual-staging-short-term-rentals.html': '/virtual-staging-short-term-rentals',
  '/blog-stage-vacant-listing-in-minutes.html': '/blog/stage-vacant-listing-in-minutes',
  '/blog-is-virtual-staging-legal.html': '/blog/is-virtual-staging-legal',
  '/blog-virtual-staging-cost-breakdown.html': '/virtual-vs-physical-staging-cost',
  // Merged into the cost comparison page.
  '/blog/virtual-staging-cost-breakdown': '/virtual-vs-physical-staging-cost',
  '/virtual-staging-bedroom.html': '/virtual-staging-bedroom',
  '/virtual-staging-home-office.html': '/virtual-staging-home-office',
  '/virtual-staging-dining-room.html': '/virtual-staging-dining-room',
  '/virtual-twilight-real-estate-photos.html': '/virtual-twilight-real-estate-photos',
  '/virtual-staging-declutter.html': '/virtual-staging-declutter',
  '/virtual-staging-scandinavian.html': '/virtual-staging-scandinavian',
  '/virtual-staging-farmhouse.html': '/virtual-staging-farmhouse',
  '/virtual-staging-coastal.html': '/virtual-staging-coastal',
  '/virtual-staging-luxury.html': '/virtual-staging-luxury',
  '/virtual-staging-mid-century-modern.html': '/virtual-staging-mid-century-modern',
  '/virtual-staging-modern.html': '/virtual-staging-modern',
  '/virtual-staging-traditional.html': '/virtual-staging-traditional',
  '/virtual-staging-dallas.html': '/virtual-staging-dallas'
};

const HOME_SECTIONS = {
  gallery: 'Gallery',
  'how-it-works': 'How it works',
  chatgpt: 'Vs. ChatGPT',
  faq: 'FAQ'
};

const META_PIXEL_ID = (process.env.META_PIXEL_ID || '').trim();
// Landing pages don't load app.js, so they get the Pixel base code from here.
const PIXEL_SNIPPET = /^\d+$/.test(META_PIXEL_ID)
  ? `<!-- Meta Pixel -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', ${JSON.stringify(META_PIXEL_ID)});
fbq('track', 'PageView');
</script>`
  : '';

// HTML stays uncached by default: an edge-cached page never reaches visitTracker.
// Set HTML_EDGE_CACHE_SECONDS (plus a Cloudflare cache rule) to trade visit counts for speed.
const HTML_EDGE_CACHE_SECONDS = Math.max(0, parseInt(process.env.HTML_EDGE_CACHE_SECONDS || '0', 10) || 0);
const PUBLIC_HTML_CACHE = HTML_EDGE_CACHE_SECONDS
  ? `public, max-age=0, s-maxage=${HTML_EDGE_CACHE_SECONDS}, stale-while-revalidate=86400`
  : 'no-cache';

const INDEXNOW_KEY = /^[a-f0-9-]{8,128}$/i.test((process.env.INDEXNOW_KEY || '').trim())
  ? process.env.INDEXNOW_KEY.trim()
  : '';

const SECURITY_TXT = `Contact: mailto:support@roomgenix.com
Expires: 2027-10-28T00:00:00.000Z
Preferred-Languages: en
Canonical: https://roomgenix.com/.well-known/security.txt
`;

function securityHeaders(_req, res, next) {
  res.set({
    'Strict-Transport-Security': 'max-age=31536000',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "frame-ancestors 'self'; base-uri 'self'; object-src 'none'"
  });
  next();
}

// Versioned CSS/JS (?v=) can be cached for a year; images and unversioned files for less.
function staticCacheHeaders(res, file) {
  const versioned = /[?&]v=/.test(res.req && res.req.originalUrl || '');
  if (/\.(css|js)$/i.test(file)) {
    res.set('Cache-Control', versioned ? 'public, max-age=31536000, immutable' : 'public, max-age=3600');
  } else if (/\.(jpe?g|png|webp|avif|svg|ico|mp4|woff2?)$/i.test(file)) {
    res.set('Cache-Control', versioned ? 'public, max-age=31536000, immutable' : 'public, max-age=604800');
  }
}

function sendPage(res, file, options = {}) {
  let html = fs.readFileSync(file, 'utf8');
  if (options.canonical) {
    html = html.replace(
      /<link rel="canonical" href="[^"]*">/,
      `<link rel="canonical" href="${options.canonical}">`
    );
    html = html.replace(
      /<meta property="og:url" content="[^"]*">/,
      `<meta property="og:url" content="${options.canonical}">`
    );
  }
  if (options.title) {
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${options.title}</title>`);
  }
  if (GA_SNIPPET && !html.includes('googletagmanager.com/gtag/js')) {
    html = html.replace('</head>', `${GA_SNIPPET}\n</head>`);
  }
  if (PIXEL_SNIPPET && !html.includes('app.js') && !html.includes('fbevents.js')) {
    html = html.replace('</head>', `${PIXEL_SNIPPET}\n</head>`);
  }
  res.set('Cache-Control', options.cache || PUBLIC_HTML_CACHE);
  res.type('html').send(html);
}

// /foo.html -> /foo for every routed page, so no file is reachable at two URLs.
const HTML_FILE_ROUTES = Object.fromEntries(
  Object.entries(PAGE_ROUTES).map(([route, file]) => [`/${file}`, route])
);

function routePage(req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  let p = req.path;
  try { p = decodeURIComponent(p); } catch { return next(); }
  if (p.includes('..') || p.includes('\0')) return next();
  if (p.length > 1 && p.endsWith('/')) {
    const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    return res.redirect(301, p.slice(0, -1) + query);
  }
  if (PAGE_ALIASES[p] || HTML_FILE_ROUTES[p]) {
    const target = PAGE_ALIASES[p] || HTML_FILE_ROUTES[p];
    const rawQuery = req.url.includes('?') ? req.url.slice(req.url.indexOf('?') + 1) : '';
    const joined = rawQuery ? target + (target.includes('?') ? '&' : '?') + rawQuery : target;
    return res.redirect(301, joined);
  }
  const section = HOME_SECTIONS[p.slice(1)];
  if (section) {
    // Same document as the homepage, so it points search engines at "/".
    return sendPage(res, path.join(ROOT, 'index.html'), {
      canonical: `${SITE}/`,
      title: `${section} — RoomGenixAI`
    });
  }
  if (PAGE_ROUTES[p]) return sendPage(res, path.join(ROOT, PAGE_ROUTES[p]));
  const file = pageFile(p);
  if (!file) return next();
  sendPage(res, file);
}

const CATALOG = {
  single: { name: 'Single Photo', price: 2.99, credits: 1, type: 'pack' },
  listing: { name: 'Single Listing Pass (8 Photos)', price: 19, credits: 8, type: 'pack' },
  pro: { name: 'Pro Agent Pack (25 Images)', price: 49, credits: 25, type: 'pack' },
  agency_pack: { name: 'Agency Bulk Pack (60 Images)', price: 99, credits: 60, type: 'pack' }
};

const SAMPLE = {
  living: ['assets/hero_empty.jpg', 'assets/hero_coastal.jpg'],
  bedroom: ['assets/bedroom_empty.jpg', 'assets/bedroom_scandinavian.jpg'],
  dining: ['assets/dining_empty.jpg', 'assets/dining_staged.jpg'],
  office: ['assets/office_empty.jpg', 'assets/office_staged.jpg'],
  twilight: ['assets/twilight_day.jpg', 'assets/twilight_dusk.jpg'],
  declutter: ['assets/declutter_before.jpg', 'assets/declutter_after.jpg'],
  patio: ['assets/patio_empty.jpg', 'assets/patio_staged.jpg'],
  renovation: ['assets/reno_before.jpg', 'assets/reno_after.jpg']
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: storage.MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      const err = new Error('Upload a JPG, PNG, or WEBP photo.');
      err.status = 400;
      return cb(err);
    }
    cb(null, true);
  }
});

function acceptImage(req, res, next) {
  const type = req.headers['content-type'] || '';
  if (type.includes('multipart/form-data')) {
    return upload.single('image')(req, res, next);
  }
  next();
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    brokerage: user.brokerage || '',
    plan: user.plan,
    credits_balance: user.credits_balance,
    welcome_credits: Number(user.welcome_credits) || 0,
    created_at: user.created_at
  };
}

function publicJob(job) {
  return {
    id: String(job._id),
    room_type: job.room_type,
    style: job.style,
    image_url: storage.stripDisclosure(job.preview_url && job.status !== 'downloaded' ? job.preview_url : job.image_url),
    before_url: job.before_url,
    prompt: job.prompt || '',
    status: job.status,
    watermarked: Boolean(job.watermarked),
    source: job.source || (String(job.image_url || '').includes('assets/') ? 'sample' : ''),
    created_at: job.created_at
  };
}


// First-party visit tracking: one document per human HTML page view, no raw IPs.
const VISIT_BOT_UA = /bot|crawl|spider|slurp|facebookexternalhit|preview|monitor|uptime|pingdom|lighthouse|headless|curl\/|wget|python-requests|go-http-client|node-fetch|axios|okhttp|java\/|libwww|railway|healthcheck|cloudflare-|httpclient/i;
const VISIT_IP_SALT = process.env.VISIT_IP_SALT
  || crypto.createHash('sha256').update('roomgenix-visits:' + (process.env.MONGODB_URI || 'local')).digest('hex');

function visitField(value, max, pattern) {
  const v = String(Array.isArray(value) ? value[0] : (value || '')).trim().slice(0, max);
  return v && (!pattern || pattern.test(v)) ? v : '';
}

function visitReferrer(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const u = new URL(raw);
    return (u.origin + u.pathname).slice(0, 300);
  } catch (_) {
    return '';
  }
}

function visitTracker(getDatabase) {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();
    const p = req.path;
    if (p === '/api/health' || p.startsWith('/api/') || p.startsWith('/uploads') || p === '/unsubscribe') return next();
    const ua = String(req.get('user-agent') || '');
    if (!ua || VISIT_BOT_UA.test(ua)) return next();
    res.on('finish', () => {
      try {
        if (res.statusCode !== 200) return;
        if (!String(res.get('Content-Type') || '').includes('text/html')) return;
        const ip = String(req.get('cf-connecting-ip') || req.ip || '');
        const q = req.query || {};
        getDatabase().collection('visits').insertOne({
          timestamp: new Date(),
          path: p.slice(0, 200),
          referrer: visitReferrer(req.get('referer')),
          utm_source: visitField(q.utm_source, 100),
          utm_medium: visitField(q.utm_medium, 100),
          utm_campaign: visitField(q.utm_campaign, 100),
          ref: visitField(q.ref, 64, /^[\w.-]+$/),
          ip_hash: crypto.createHash('sha256').update(VISIT_IP_SALT + '|' + ip).digest('hex'),
          user_agent: ua.slice(0, 200)
        }).catch(() => {});
      } catch (_) { /* tracking must never affect a response */ }
    });
    next();
  };
}

function clientIpHash(req) {
  const ip = String(req.get('cf-connecting-ip') || req.ip || '');
  return crypto.createHash('sha256').update(VISIT_IP_SALT + '|' + ip).digest('hex');
}

// Free try (account required): 1 per user per 24h, a few per hashed IP (shared networks), plus a global daily cap.
const FREE_TRY_USER_DAILY = 1;
const FREE_TRY_IP_DAILY = 3;
const FREE_TRY_FAIL_DAILY = 6;
const FREE_TRY_STALE_MS = 4 * 60 * 1000;
const FREE_TRY_RENDER_MS = 170 * 1000;
const FREE_TRY_DAILY_CAP = Math.max(0, parseInt(process.env.FREE_TRY_DAILY_CAP || '50', 10) || 0);
const FREE_TRY_ROOMS = ['living', 'bedroom', 'dining', 'office'];
const FREE_TRY_INPUT_EDGE = 2048;
const FREE_TRY_MODEL = 'google/nano-banana-pro';
const FREE_TRY_FULL = {
  living: 'a sofa, a coffee table, a large area rug, one accent armchair, a small side table with a lamp, and one tall indoor plant',
  bedroom: 'a queen bed with layered bedding and pillows, two nightstands with lamps, a large area rug under the bed, and a low dresser',
  dining: 'a dining table with six chairs, a rug under the table, and a low sideboard',
  office: 'a desk, a desk chair, a large area rug, a low bookcase or credenza, a desk lamp, and one indoor plant'
};

function sniffImageMime(buffer) {
  if (!buffer || buffer.length < 12) return '';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return '';
}

function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function db() {
  return getDb();
}

function tokenFrom(req) {
  const header = req.get('authorization') || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return (req.get('x-session-token') || '').trim();
}

function authUser(req) {
  const token = tokenFrom(req);
  if (!token) return null;
  return db().collection('users').findOne({ session_token: token });
}

async function requireUser(req, res) {
  const user = await authUser(req);
  if (!user) {
    res.status(401).json({ status: 'error', message: 'Log in to save this work to your account.' });
    return null;
  }
  return user;
}

function sampleFor(room) {
  return SAMPLE[room] || SAMPLE.living;
}

function userFolder(userId, kind) {
  return `virtualstage/${userId}/${kind || 'uploads'}`;
}

const ROOM_FURNITURE = {
  living: {
    name: 'living room',
    pieces: 'a sofa, a coffee table, and one rug'
  },
  bedroom: {
    name: 'bedroom',
    pieces: 'a bed, two nightstands, and a small rug'
  },
  dining: {
    name: 'dining room',
    pieces: 'a dining table and dining chairs, with a rug under the table'
  },
  office: {
    name: 'home office',
    pieces: 'a desk, a desk chair, and a small rug'
  }
};

const STYLE_LOOK = {
  modern: 'a modern look, with low profiles, light wood, and neutral fabric',
  scandinavian: 'a Scandinavian look, with pale wood, linen, and simple shapes',
  farmhouse: 'a farmhouse look, with warm wood, soft linen, and a woven texture',
  coastal: 'a coastal look, with light fabric, a natural-fiber rug, and a little pale blue',
  luxury: 'a quiet luxury look, with tailored upholstery, a low profile, and a stone or wood table',
  midcentury: 'a mid-century look, with walnut, tapered legs, and a wool rug',
  traditional: 'a traditional look, with a rolled-arm sofa, a wood table, and a patterned rug'
};

function editPrompt(style, room, prompt) {
  const extra = prompt ? ` Also follow this note: ${prompt}` : '';
  const sharp = ' Keep the original photograph sharp. Match its focus, color, and grain. Do not blur, repaint, or soften the room.';
  let instruction;
  if (room === 'twilight') {
    instruction = `Turn this daytime exterior into dusk. Add warm light in the windows that already exist and a deep blue sky. Keep the same house, yard, landscaping, and camera.${extra}`;
  } else if (room === 'declutter') {
    instruction = `Remove boxes, clutter, and laundry from this photo. Keep the real furniture, walls, windows, floors, and camera exactly as they are.${extra}`;
  } else if (room === 'renovation') {
    instruction = `Refresh the wall color and floor finish so the room looks updated. Keep the same walls, windows, doors, ceiling height, and camera.${extra}`;
  } else if (room === 'patio') {
    instruction = `Add a teak sectional, two chairs, a coffee table, and an outdoor rug on this patio. Keep the house, doors, fence, lawn, and daylight exactly the same.${extra}`;
  } else {
    const furniture = ROOM_FURNITURE[room] || {
      name: 'room',
      pieces: 'furniture that belongs in this room'
    };
    const look = STYLE_LOOK[style] || STYLE_LOOK.modern;
    instruction = `Add ${furniture.pieces} to this empty ${furniture.name}. Use ${look}. The only new objects are that furniture. Keep the same walls, windows, doors, floors, ceiling, and camera. Change only the furniture. Match the daylight already in the photo.${extra}`;
  }
  return instruction + sharp;
}

// Free-try staging prompt: fuller, true-to-scale furniture while the photo itself (walls, windows, floor, framing) stays as shot.
function freeTryPrompt(style, room) {
  const furniture = ROOM_FURNITURE[room] || { name: 'room' };
  const pieces = FREE_TRY_FULL[room] || 'furniture that belongs in this room';
  const look = STYLE_LOOK[style] || STYLE_LOOK.modern;
  return `Virtually stage this empty ${furniture.name} for a real estate listing by adding furniture: ${pieces}, in ${look}. This is an exact edit of the photograph. Keep the identical camera position, framing, crop, field of view, and perspective. Leave the walls and their color, the windows, doors, trim, flooring, ceiling, lights, and every existing object exactly as photographed. The furniture must be true to real-world scale and sit on the floor in correct perspective, with soft contact shadows and light that matches the direction, color temperature, and softness of the existing window light. Make the room look fuller but not cluttered, with clear walkways and nothing blocking windows or doors. Photorealistic, sharp, true-to-life materials.`;
}

function dataUri(buffer, mime) {
  const type = mime && String(mime).startsWith('image/') ? String(mime).split(';')[0] : 'image/jpeg';
  return `data:${type};base64,${buffer.toString('base64')}`;
}

function imageForReplicate(req, before) {
  // Large phone/camera photos make the render model reject the request (it caps total pixels at 4MP);
  // send a downscaled, EXIF-corrected JPEG copy whenever the original is hosted on Cloudinary.
  if (before && typeof before.url === 'string' && before.url.includes('res.cloudinary.com')) {
    return storage.limitedUrl(before.url, 2048);
  }
  if (req.file && req.file.buffer) {
    return dataUri(req.file.buffer, req.file.mimetype);
  }
  const url = before.url || '';
  if (url.startsWith('/uploads/')) {
    const name = path.basename(url.split('?')[0]);
    const filePath = path.join(storage.UPLOADS, name);
    if (!fs.existsSync(filePath)) throw new Error('The uploaded photo is no longer on this server.');
    const ext = path.extname(name).toLowerCase();
    const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    return dataUri(fs.readFileSync(filePath), mime);
  }
  if (url.startsWith('https://')) return url;
  throw new Error('The photo has to be a public link or a file on this server.');
}

async function callReplicate(imageInput, style, room, prompt, info, options = {}) {
  const model = options.freeTry ? FREE_TRY_MODEL : 'black-forest-labs/flux-2-max';
  const body = JSON.stringify(options.freeTry ? {
    input: {
      prompt: freeTryPrompt(style, room),
      image_input: [imageInput],
      aspect_ratio: 'match_input_image',
      resolution: '2K',
      output_format: 'jpg'
    }
  } : {
    input: {
      prompt: editPrompt(style, room, prompt),
      input_images: [imageInput],
      aspect_ratio: 'match_input_image',
      resolution: 'match_input_image',
      output_format: 'png',
      output_quality: 100,
      prompt_upsampling: false,
      safety_tolerance: 2
    }
  });
  let start;
  let prediction;
  // Replicate throttles accounts with a low balance (burst of 1); wait and retry instead of failing the render.
  for (let attempt = 0; attempt < 4; attempt++) {
    start = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        Prefer: 'wait'
      },
      signal: AbortSignal.timeout(100000),
      body
    });
    prediction = await start.json();
    if (start.status !== 429 || attempt === 3) break;
    const wait = Math.min(15, Math.max(3, Number(prediction.retry_after) || 8));
    await new Promise(r => setTimeout(r, wait * 1000 + 500));
  }
  if (!start.ok) {
    const detail = prediction.detail || prediction.error || prediction.title;
    throw new Error(typeof detail === 'string' ? detail : 'Render service rejected the photo.');
  }
  const pollUrl = prediction.urls && prediction.urls.get;
  for (let i = 0; i < 45 && prediction.status !== 'succeeded'; i++) {
    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(prediction.error || 'Render failed.');
    }
    if (!pollUrl) break;
    await new Promise(r => setTimeout(r, 2000));
    try {
      const poll = await fetch(pollUrl, { headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` }, signal: AbortSignal.timeout(20000) });
      prediction = await poll.json();
    } catch (_) { /* a single slow or dropped poll must not fail the render; try again */ }
  }
  if (info && typeof info === 'object') {
    info.id = prediction.id || '';
    info.status = prediction.status || '';
    info.metrics = prediction.metrics || null;
  }
  const output = prediction.output;
  if (Array.isArray(output) && output[0]) return output[0];
  if (typeof output === 'string') return output;
  throw new Error('Render finished without an image.');
}

async function seed() {
  if (process.env.NODE_ENV === 'production') return;
  const users = db().collection('users');
  const existing = await users.findOne({ email: 'demo@roomgenix.com' });
  if (existing) return;
  const now = new Date();
  const password_hash = bcrypt.hashSync('demo1234', 10);
  const inserted = await users.insertOne({
    email: 'demo@roomgenix.com',
    password_hash,
    name: 'Sarah Jenkins',
    brokerage: 'Keller Williams Beverly Hills',
    plan: 'starter',
    credits_balance: 12,
    session_token: crypto.randomBytes(32).toString('hex'),
    created_at: now
  });
  const id = inserted.insertedId;
  await db().collection('jobs').insertMany([
    { user_id: id, room_type: 'living', style: 'coastal', prompt: '', before_url: 'assets/hero_empty.jpg', image_url: 'assets/hero_coastal.jpg', status: 'preview', source: 'sample', created_at: now },
    { user_id: id, room_type: 'bedroom', style: 'scandinavian', prompt: '', before_url: 'assets/bedroom_empty.jpg', image_url: 'assets/bedroom_scandinavian.jpg', status: 'preview', source: 'sample', created_at: now }
  ]);
  await db().collection('transactions').insertOne({
    user_id: id, plan: 'starter', amount: 29, credits_added: 10, status: 'completed', stripe_session_id: '', created_at: now
  });
  await db().collection('events').insertOne({
    user_id: id, event_type: 'download', property_address: '', metadata: { room: 'living' }, created_at: now
  });
}

function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

async function resolveBeforeImage(req, user) {
  if (req.file) {
    return storage.uploadBuffer(req.file.buffer, {
      folder: userFolder(user._id, 'before'),
      mime: req.file.mimetype
    });
  }

  const imageUrl = String(req.body.image_url || '').trim();
  if (imageUrl && (imageUrl.startsWith('https://') || imageUrl.startsWith('/uploads/'))) {
    return { url: imageUrl, public_id: '', provider: 'existing' };
  }

  const uploaded = await storage.uploadDataUrl(req.body.image_data || '', {
    folder: userFolder(user._id, 'before')
  });
  if (uploaded) return uploaded;

  if (req.body.source_job_id) {
    try {
      const prior = await db().collection('jobs').findOne({
        _id: new ObjectId(req.body.source_job_id),
        user_id: user._id
      });
      if (prior && prior.before_url) {
        return { url: prior.before_url, public_id: prior.before_public_id || '', provider: 'job' };
      }
    } catch (_) {}
  }

  const [sampleBefore] = sampleFor(String(req.body.room_type || 'living'));
  return { url: sampleBefore, public_id: '', provider: 'sample' };
}

async function main() {
  await connect();
  await seed();
  storage.init();

  async function completeDodoPayment(filter, paymentId) {
    const tx = await db().collection('transactions').findOne(filter);
    if (!tx) return { found: false };
    if (tx.status === 'completed') return { found: true, credited: false };
    const claim = await db().collection('transactions').updateOne(
      { _id: tx._id, status: 'pending' },
      { $set: { status: 'completed', dodo_payment_id: paymentId || tx.dodo_payment_id || '' } }
    );
    if (claim.modifiedCount !== 1) return { found: true, credited: false };
    await db().collection('users').updateOne(
      { _id: tx.user_id },
      { $inc: { credits_balance: tx.credits_added }, $set: { plan: tx.plan } }
    );
    return { found: true, credited: true };
  }

  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(securityHeaders);
  app.post('/api/webhooks/dodo', express.raw({ type: '*/*' }), asyncRoute(async (req, res) => {
    const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
    let event;
    try {
      event = dodo.verifyWebhook(raw, req.headers);
    } catch (err) {
      return res.status(401).json({ status: 'error', message: 'Invalid webhook signature.' });
    }
    if (event.type === 'payment.succeeded') {
      const data = event.data || {};
      const meta = data.metadata || {};
      const paymentId = data.payment_id || '';
      let result = { found: false };
      if (meta.transaction_id && ObjectId.isValid(meta.transaction_id)) {
        result = await completeDodoPayment({ _id: new ObjectId(meta.transaction_id) }, paymentId);
      }
      if (!result.found && data.checkout_session_id) {
        result = await completeDodoPayment({ dodo_session_id: data.checkout_session_id }, paymentId);
      }
      if (!result.found && (meta.transaction_id || data.checkout_session_id)) {
        return res.status(409).json({ status: 'error', message: 'Payment is not matched yet.' });
      }
    }
    res.json({ status: 'success' });
  }));
  app.use(express.json({ limit: '16mb' }));
  app.use(express.urlencoded({ extended: true, limit: '16mb' }));
  app.use((req, res, next) => {
    const blocked = req.path.startsWith('/server')
      || req.path.startsWith('/node_modules')
      || req.path === '/package.json'
      || req.path === '/package-lock.json'
      || req.path === '/.env'
      || req.path === '/.env.example'
      || req.path === '/404.html';
    if (blocked) return res.status(404).end();
    next();
  });
  db().collection('visits').createIndex({ timestamp: -1 }).catch(() => {});
  app.use(visitTracker(db));
  app.use('/uploads', express.static(storage.UPLOADS));
  app.get('/dashboard', (_req, res) => {
    sendPage(res, path.join(ROOT, 'dashboard.html'), { cache: 'no-cache' });
  });
  app.get('/dashboard/', (_req, res) => res.redirect('/dashboard'));
  app.get('/.well-known/security.txt', (_req, res) => {
    res.type('text/plain').send(SECURITY_TXT);
  });
  if (INDEXNOW_KEY) {
    app.get(`/${INDEXNOW_KEY}.txt`, (_req, res) => res.type('text/plain').send(INDEXNOW_KEY));
  }
  app.use(routePage);
  app.use(express.static(ROOT, { index: 'index.html', etag: false, maxAge: 0, setHeaders: staticCacheHeaders }));

  app.get('/unsubscribe', asyncRoute(async (req, res) => {
    const ok = await nurture.unsubscribe(db(), req.query.t);
    res.set('Cache-Control', 'no-store');
    res.type('html').send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Unsubscribe | RoomGenixAI</title><link rel="stylesheet" href="/style.css"></head><body style="font-family:sans-serif;padding:48px;text-align:center"><p>${ok ? 'You are unsubscribed. You will not get these emails again.' : 'That link is not valid. Email support@roomgenix.com and we will remove you.'}</p><p><a href="/">RoomGenix home</a></p></body></html>`);
  }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      mongo: true,
      images: storage.configured() ? 'cloudinary' : 'local',
      render: REPLICATE_API_TOKEN ? 'flux-2-max' : 'off',
      checkout: dodo.configured() ? `dodo-${dodo.mode()}` : (STRIPE_SECRET_KEY ? 'stripe' : 'demo'),
      google: GOOGLE_CLIENT_ID ? 'on' : 'off',
      email: mail.configured() ? 'resend' : 'off'
    });
  });

  app.get('/api/auth/config', (_req, res) => {
    res.json({
      google_client_id: GOOGLE_CLIENT_ID,
      meta_pixel_id: process.env.META_PIXEL_ID || ''
    });
  });

  async function verifyGoogleIdToken(credential) {
    if (!GOOGLE_CLIENT_ID) {
      const err = new Error('Google sign-in is not configured on this server.');
      err.status = 503;
      throw err;
    }
    const token = String(credential || '').trim();
    if (!token || token.length > 4096) {
      const err = new Error('Google did not return a sign-in token.');
      err.status = 400;
      throw err;
    }
    const googleRes = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(token));
    const payload = await googleRes.json().catch(() => ({}));
    const issuer = payload.iss;
    const verified = String(payload.email_verified) === 'true';
    const fresh = !payload.exp || Number(payload.exp) * 1000 > Date.now();
    if (!googleRes.ok || payload.aud !== GOOGLE_CLIENT_ID || !verified || !fresh || (issuer !== 'accounts.google.com' && issuer !== 'https://accounts.google.com')) {
      const err = new Error('Google could not confirm this sign-in. Try again.');
      err.status = 401;
      throw err;
    }
    const email = String(payload.email || '').trim().toLowerCase();
    const sub = String(payload.sub || '');
    if (!email || !sub) {
      const err = new Error('Google did not share an email for this account.');
      err.status = 401;
      throw err;
    }
    return { sub, email, name: String(payload.name || '').trim() };
  }

  app.post('/api/auth/google', asyncRoute(async (req, res) => {
    const profile = await verifyGoogleIdToken(req.body.credential);
    const users = db().collection('users');
    let user = await users.findOne({ google_sub: profile.sub });
    let created = false;
    if (!user) {
      user = await users.findOne({ email: profile.email });
      if (user && user.google_sub && user.google_sub !== profile.sub) {
        return res.status(409).json({ status: 'error', message: 'This email is already linked to a different Google account.' });
      }
    }
    const token = crypto.randomBytes(32).toString('hex');
    if (!user) {
      const name = profile.name || profile.email.split('@')[0];
      const doc = {
        email: profile.email,
        name,
        brokerage: '',
        plan: 'none',
        credits_balance: 3,
        welcome_credits: 3,
        google_sub: profile.sub,
        session_token: token,
        created_at: new Date()
      };
      try {
        const result = await users.insertOne(doc);
        doc._id = result.insertedId;
      } catch (err) {
        if (err.code === 11000) {
          return res.status(409).json({ status: 'error', message: 'An account with this email already exists. Log in with email, then use Google again.' });
        }
        throw err;
      }
      user = doc;
      created = true;
      await db().collection('events').insertOne({
        user_id: user._id, event_type: 'signup', property_address: '', metadata: { plan: 'none', provider: 'google' }, created_at: new Date()
      });
    } else {
      const updates = { session_token: token, google_sub: profile.sub };
      if (!user.name && profile.name) updates.name = profile.name;
      await users.updateOne({ _id: user._id }, { $set: updates });
      Object.assign(user, updates);
    }
    const first = (user.name || 'there').split(' ')[0];
    const userPayload = publicUser(user);
    userPayload.is_new_user = created; // used by client Pixel to fire Lead/CompleteRegistration on first Google sign-in only
    res.json({
      status: 'success',
      message: created ? 'Account created. Three watermarked previews are included. No card.' : `Welcome back, ${first}.`,
      user: userPayload,
      token: user.session_token
    });
  }));

  app.get('/api/auth/me', asyncRoute(async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json({ status: 'success', user: publicUser(user) });
  }));

  app.post('/api/auth/signup', asyncRoute(async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const name = String(req.body.name || '').trim();
    const brokerage = String(req.body.brokerage || '').trim();
    if (!email || !password || !name) {
      return res.status(400).json({ status: 'error', message: 'Name, email, and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ status: 'error', message: 'Use a password of at least 8 characters.' });
    }
    const doc = {
      email,
      password_hash: bcrypt.hashSync(password, 10),
      name,
      brokerage,
      plan: 'none',
      credits_balance: 3,
      welcome_credits: 3,
      session_token: crypto.randomBytes(32).toString('hex'),
      created_at: new Date()
    };
    try {
      const result = await db().collection('users').insertOne(doc);
      doc._id = result.insertedId;
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ status: 'error', message: 'An account with this email already exists.' });
      }
      throw err;
    }
    await db().collection('events').insertOne({
      user_id: doc._id, event_type: 'signup', property_address: '', metadata: { plan: 'none' }, created_at: new Date()
    });
    res.json({
      status: 'success',
      message: 'Account created. Three watermarked previews are included. No card.',
      user: publicUser(doc),
      token: doc.session_token
    });
  }));

  app.post('/api/auth/login', asyncRoute(async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await db().collection('users').findOne({ email });
    const passwordOk = user && user.password_hash && bcrypt.compareSync(password, user.password_hash);
    if (!passwordOk) {
      const message = user && user.google_sub && !user.password_hash
        ? 'This account uses Google. Continue with Google.'
        : 'Email or password does not match.';
      return res.status(401).json({ status: 'error', message });
    }
    const token = crypto.randomBytes(32).toString('hex');
    await db().collection('users').updateOne({ _id: user._id }, { $set: { session_token: token } });
    user.session_token = token;
    res.json({
      status: 'success',
      message: `Welcome back, ${user.name.split(' ')[0]}.`,
      user: publicUser(user),
      token
    });
  }));

  app.post('/api/auth/logout', asyncRoute(async (req, res) => {
    const user = await authUser(req);
    if (user) {
      await db().collection('users').updateOne({ _id: user._id }, { $set: { session_token: '' } });
    }
    res.json({ status: 'success', message: 'Logged out.' });
  }));

  app.get('/api/user/dashboard', asyncRoute(async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const jobs = await db().collection('jobs').find({ user_id: user._id }).sort({ created_at: -1 }).limit(48).toArray();
    const transactions = await db().collection('transactions').find({ user_id: user._id }).sort({ created_at: -1 }).limit(8).toArray();
    const downloads = await db().collection('events').countDocuments({ user_id: user._id, event_type: 'download' });
    res.json({
      status: 'success',
      dashboard: {
        user: publicUser(user),
        stats: {
          total_renders: await db().collection('jobs').countDocuments({ user_id: user._id }),
          credits_balance: user.credits_balance,
          downloads_4k: downloads,
          certs_generated: await db().collection('events').countDocuments({ user_id: user._id, event_type: 'cert_generate' }),
          zillow_snipes: await db().collection('events').countDocuments({ user_id: user._id, event_type: 'zillow_snipe' })
        },
        recent_renders: jobs.map(publicJob),
        recent_transactions: transactions.map(tx => ({
          id: String(tx._id),
          plan: tx.plan,
          amount: tx.amount,
          credits_added: tx.credits_added,
          status: tx.status,
          created_at: tx.created_at
        }))
      }
    });
  }));

  app.get('/api/studio/jobs', asyncRoute(async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const jobs = await db().collection('jobs').find({ user_id: user._id }).sort({ created_at: -1 }).limit(48).toArray();
    res.json({
      status: 'success',
      credits_balance: user.credits_balance,
      user: publicUser(user),
      jobs: jobs.map(publicJob)
    });
  }));

  app.patch('/api/user/profile', asyncRoute(async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const name = String(req.body.name || '').trim();
    const brokerage = String(req.body.brokerage || '').trim();
    if (!name) return res.status(400).json({ status: 'error', message: 'Name is required.' });
    await db().collection('users').updateOne({ _id: user._id }, { $set: { name, brokerage } });
    const fresh = await db().collection('users').findOne({ _id: user._id });
    res.json({ status: 'success', user: publicUser(fresh), message: 'Account details saved.' });
  }));

  app.post('/api/upload', acceptImage, asyncRoute(async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    let stored = null;
    if (req.file) {
      stored = await storage.uploadBuffer(req.file.buffer, {
        folder: userFolder(user._id, 'before'),
        mime: req.file.mimetype
      });
    } else {
      stored = await storage.uploadDataUrl(req.body.image_data || '', {
        folder: userFolder(user._id, 'before')
      });
    }
    if (!stored) {
      return res.status(400).json({ status: 'error', message: 'Choose a photo to upload.' });
    }
    res.json({
      status: 'success',
      url: stored.url,
      public_id: stored.public_id,
      provider: stored.provider,
      message: stored.provider === 'cloudinary' ? 'Photo saved to your library.' : 'Photo saved on this server.'
    });
  }));

  app.post('/api/stage', acceptImage, asyncRoute(async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const requestedJob = String(req.body.job || '');
    const roomType = String(req.body.room_type || 'living');
    const room = requestedJob === 'twilight' || roomType === 'twilight'
      ? 'twilight'
      : requestedJob === 'declutter' || roomType === 'declutter'
        ? 'declutter'
        : roomType;
    const style = String(req.body.style || 'modern');
    const prompt = String(req.body.prompt || '').slice(0, 500);
    const before = await resolveBeforeImage(req, user);
    const beforeUrl = before.url || '';
    const catalog = before.provider === 'sample' || beforeUrl.startsWith('assets/') || beforeUrl.includes('/assets/');
    if (catalog) {
      return res.status(400).json({
        status: 'error',
        message: 'Upload your photo first. The picture on screen is an example.'
      });
    }
    if (!REPLICATE_API_TOKEN) {
      return res.status(503).json({
        status: 'error',
        message: 'Furniture rendering is not connected on this server yet. Your photo was not replaced with an example.'
      });
    }
    let imageInput;
    try {
      imageInput = imageForReplicate(req, before);
    } catch (err) {
      return res.status(400).json({ status: 'error', message: err.message || 'The photo could not be sent.' });
    }
    let spentWelcome = false;
    const welcomeSpend = await db().collection('users').findOneAndUpdate(
      { _id: user._id, credits_balance: { $gte: 1 }, welcome_credits: { $gte: 1 } },
      { $inc: { credits_balance: -1, welcome_credits: -1 } },
      { returnDocument: 'before' }
    );
    const welcomeDoc = welcomeSpend && Object.prototype.hasOwnProperty.call(welcomeSpend, 'value')
      ? welcomeSpend.value
      : welcomeSpend;
    if (welcomeDoc && welcomeDoc._id) {
      spentWelcome = true;
    } else {
      const reserved = await db().collection('users').updateOne(
        { _id: user._id, credits_balance: { $gte: 1 } },
        { $inc: { credits_balance: -1 } }
      );
      if (!reserved.matchedCount) {
        const fresh = await db().collection('users').findOne({ _id: user._id });
        return res.status(402).json({
          status: 'error',
          message: 'Add a credit to generate this photo.',
          credits_balance: fresh ? fresh.credits_balance : 0,
          user: fresh ? publicUser(fresh) : publicUser(user)
        });
      }
    }

    let imageUrl = '';
    let imagePublicId = '';
    let source = 'replicate';
    try {
      const staged = await callReplicate(imageInput, style, room, prompt);
      const persisted = await storage.persistRemote(staged, {
        folder: userFolder(user._id, 'staged'),
        preview: spentWelcome
      });
      imageUrl = persisted.url;
      imagePublicId = persisted.public_id || '';
    } catch (err) {
      const detail = String(err && err.message || '');
      console.error('Render failed:', detail || err);
      const billing = /insufficient credit/i.test(detail);
      // Failures that are ours, not the photo's (throttling, size limits, timeouts), never cost the user a credit.
      const transient = /throttl|rate limit|total pixels|timeout|timed out|aborted|fetch failed|did not finish|without an image/i.test(detail) || err.name === 'TimeoutError' || err.name === 'AbortError';
      if (billing || transient || err.refund) {
        const inc = { credits_balance: 1 };
        if (spentWelcome) inc.welcome_credits = 1;
        await db().collection('users').updateOne({ _id: user._id }, { $inc: inc });
      }
      const fresh = await db().collection('users').findOne({ _id: user._id });
      return res.status(502).json({
        status: 'error',
        message: billing
          ? 'Replicate has no credit left. Add credit in the Replicate billing page, wait a few minutes, then try this photo again.'
          : (transient || err.refund)
            ? 'The render did not finish. Your credit was not used, please try again.'
            : 'The render was started and one credit was used. It did not finish.',
        credits_balance: fresh.credits_balance,
        user: publicUser(fresh)
      });
    }

    const job = {
      user_id: user._id,
      room_type: room,
      style,
      prompt,
      before_url: beforeUrl,
      before_public_id: before.public_id || '',
      image_url: imageUrl,
      image_public_id: imagePublicId,
      status: 'preview',
      credit_spent: true,
      watermarked: spentWelcome,
      source,
      created_at: new Date()
    };
    const result = await db().collection('jobs').insertOne(job);
    await db().collection('events').insertOne({
      user_id: user._id,
      event_type: 'stage_preview',
      property_address: '',
      metadata: { room, style, job_id: String(result.insertedId), source },
      created_at: new Date()
    });
    const fresh = await db().collection('users').findOne({ _id: user._id });
    res.json({
      status: 'success',
      staged_url: storage.stripDisclosure(imageUrl),
      before_url: beforeUrl,
      job_id: String(result.insertedId),
      source,
      credits_balance: fresh.credits_balance,
      user: publicUser(fresh),
      message: spentWelcome
        ? 'Preview saved. It has a RoomGenix watermark. A paid photo does not. Downloading this file again is free.'
        : 'Photo saved. One credit was used. Downloading this file again is free.'
    });
  }));

  app.post('/api/studio/download', asyncRoute(async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    let jobId;
    try { jobId = new ObjectId(req.body.job_id); } catch (_) {
      return res.status(400).json({ status: 'error', message: 'Stage a room before downloading it.' });
    }
    const job = await db().collection('jobs').findOne({ _id: jobId, user_id: user._id });
    if (!job) return res.status(404).json({ status: 'error', message: 'That render is not on this account.' });
    const example = job.source === 'sample' || String(job.image_url || '').includes('assets/');
    if (example) {
      return res.status(400).json({ status: 'error', message: 'This is an example photo. Upload your own before downloading.' });
    }

    if (job.status !== 'downloaded') {
      if (!job.credit_spent && job.requires_paid_credit) {
        // Free-try results unlock only with a purchased credit, never a welcome preview credit.
        const paid = await db().collection('users').updateOne(
          { _id: user._id, $expr: { $gte: [{ $subtract: ['$credits_balance', { $ifNull: ['$welcome_credits', 0] }] }, 1] } },
          { $inc: { credits_balance: -1 } }
        );
        if (!paid.modifiedCount) {
          return res.status(402).json({
            status: 'error',
            message: 'Get the clean high-res file for $2.99. Free preview credits do not unlock it.',
            plan: 'single',
            credits_balance: user.credits_balance,
            user: publicUser(user)
          });
        }
      } else if (!job.credit_spent) {
        if (user.credits_balance < 1) {
          return res.status(402).json({
            status: 'error',
            message: 'Add a credit to download this render.',
            credits_balance: user.credits_balance,
            user: publicUser(user)
          });
        }
        await db().collection('users').updateOne({ _id: user._id }, { $inc: { credits_balance: -1 } });
      }
      await db().collection('jobs').updateOne({ _id: job._id }, { $set: { status: 'downloaded', downloaded_at: new Date(), credit_spent: true } });
      await db().collection('events').insertOne({
        user_id: user._id, event_type: 'download', property_address: '', metadata: { job_id: String(job._id) }, created_at: new Date()
      });
    }
    const fresh = await db().collection('users').findOne({ _id: user._id });
    res.json({
      status: 'success',
      download_url: storage.downloadUrl(job.image_url, `Roomgenix_${job.room_type}_${job.style}`),
      credits_balance: fresh.credits_balance,
      user: publicUser(fresh)
    });
  }));

  const freeTryUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: storage.MAX_BYTES, files: 1, fields: 10, fieldSize: 600 },
    fileFilter: (_req, file, cb) => {
      if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype || '')) {
        const err = new Error('Upload a JPG, PNG, or WEBP photo.');
        err.status = 400;
        return cb(err);
      }
      cb(null, true);
    }
  });

  // Free try (account required): POST starts a render and returns at once; the browser then polls
  // GET /api/free-try/:id. No request is ever held open for the render, so proxy and browser idle
  // timeouts (Cloudflare 100s, Railway, flaky mobile links) can no longer strand the page.
  app.post('/api/free-try', asyncRoute(async (req, res, next) => {
    const user = await authUser(req);
    if (!user) {
      return res.status(401).json({ status: 'error', code: 'login_required', message: 'Sign up or log in to stage your photo free.' });
    }
    req.freeTryUser = user;
    next();
  }), (req, res, next) => {
    freeTryUpload.single('image')(req, res, (err) => {
      if (!err) return next();
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'The photo must be under 10 MB.'
        : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE' ? 'Send one photo.'
        : (err.message || 'Upload failed.');
      res.status(400).json({ status: 'error', message });
    });
  }, asyncRoute(async (req, res) => {
    const user = req.freeTryUser;
    if (!REPLICATE_API_TOKEN || !storage.configured()) {
      return res.status(503).json({ status: 'error', message: 'The free try is not available right now.' });
    }
    const file = req.file;
    if (!file || !file.buffer || !file.buffer.length) {
      return res.status(400).json({ status: 'error', message: 'Choose a room photo to upload.' });
    }
    const mime = sniffImageMime(file.buffer);
    if (!mime) {
      return res.status(400).json({ status: 'error', message: 'That file is not a JPG, PNG, or WEBP photo.' });
    }
    const room = FREE_TRY_ROOMS.includes(String(req.body.room_type || '')) ? String(req.body.room_type) : 'living';
    const style = STYLE_LOOK[String(req.body.style || '')] ? String(req.body.style) : 'modern';
    const attribution = {
      ref: visitField(req.body.ref, 64, /^[\w.-]+$/),
      utm_source: visitField(req.body.utm_source, 100),
      utm_medium: visitField(req.body.utm_medium, 100),
      utm_campaign: visitField(req.body.utm_campaign, 100),
      referrer: visitReferrer(req.body.referrer)
    };
    const ipHash = clientIpHash(req);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const col = db().collection('free_tries');
    // Only finished tries and fresh in-flight ones use up the allowance; failed or stuck ones never do.
    const activeSince = () => ({
      $or: [
        { status: 'done', created_at: { $gte: since } },
        { status: 'pending', created_at: { $gte: new Date(Date.now() - FREE_TRY_STALE_MS) } }
      ]
    });
    const limited = (code, message) => res.status(429).json({ status: 'error', code, message });
    const userMessage = 'You have used your free try for today. Come back tomorrow, or use the 3 free previews that come with your account.';
    const ipMessage = 'Free tries from this network are used up for today. Use the 3 free previews that come with your account.';
    const capMessage = 'Today\'s free tries are used up. Use the 3 free previews that come with your account, or come back tomorrow.';
    if (await col.countDocuments({ user_id: user._id, ...activeSince() }) >= FREE_TRY_USER_DAILY) {
      return limited('user_limit', userMessage);
    }
    if (await col.countDocuments({ ip_hash: ipHash, ...activeSince() }) >= FREE_TRY_IP_DAILY) {
      return limited('ip_limit', ipMessage);
    }
    if (await col.countDocuments({ ip_hash: ipHash, status: 'failed', created_at: { $gte: since } }) >= FREE_TRY_FAIL_DAILY) {
      return limited('ip_limit', 'Too many failed tries from this network today. Please come back tomorrow.');
    }
    if (await col.countDocuments(activeSince()) >= FREE_TRY_DAILY_CAP) {
      return limited('daily_cap', capMessage);
    }
    const claimToken = crypto.randomBytes(24).toString('hex');
    const startedAt = new Date();
    const inserted = await col.insertOne({
      user_id: user._id,
      ip_hash: ipHash,
      status: 'pending',
      room_type: room,
      style,
      ...attribution,
      user_agent: String(req.get('user-agent') || '').slice(0, 200),
      input_bytes: file.buffer.length,
      input_mime: mime,
      claim_token_hash: sha256Hex(claimToken),
      created_at: startedAt
    });
    const tryId = inserted.insertedId;
    // Re-check after the insert so two parallel requests can't both pass.
    const first = await col.find({ user_id: user._id, ...activeSince() }).sort({ created_at: 1, _id: 1 }).limit(1).next();
    if (!first || String(first._id) !== String(tryId)) {
      await col.deleteOne({ _id: tryId });
      return limited('user_limit', userMessage);
    }
    if (await col.countDocuments(activeSince()) > FREE_TRY_DAILY_CAP) {
      await col.deleteOne({ _id: tryId });
      return limited('daily_cap', capMessage);
    }

    res.status(202).json({
      status: 'pending',
      try_id: String(tryId),
      claim_token: claimToken,
      poll_after_ms: 3000,
      message: 'Staging started.'
    });

    // Render in the background. A watchdog marks it failed (never "used") if it runs too long.
    const buffer = file.buffer;
    const render = async () => {
      const before = await storage.uploadBuffer(buffer, { folder: 'virtualstage/free-try/before', mime });
      const input = storage.limitedUrl(before.url, FREE_TRY_INPUT_EDGE, 90);
      const info = {};
      const staged = await callReplicate(input, style, room, '', info, { freeTry: true });
      const clean = await storage.persistRemote(staged, { folder: 'virtualstage/free-try/staged', preview: false });
      const preview = await storage.bakePreview(clean.url, { folder: 'virtualstage/free-try/preview' });
      await col.updateOne({ _id: tryId, status: 'pending' }, {
        $set: {
          status: 'done',
          before_url: storage.limitedUrl(before.url, FREE_TRY_INPUT_EDGE, 90),
          before_public_id: before.public_id || '',
          input_url: input,
          clean_url: clean.url,
          clean_public_id: clean.public_id || '',
          preview_url: preview.url,
          preview_public_id: preview.public_id || '',
          replicate_id: info.id || '',
          replicate_metrics: info.metrics || null,
          duration_ms: Date.now() - startedAt.getTime(),
          finished_at: new Date()
        }
      });
    };
    let timer;
    const watchdog = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Render timed out after ' + Math.round(FREE_TRY_RENDER_MS / 1000) + 's')), FREE_TRY_RENDER_MS);
    });
    Promise.race([render(), watchdog])
      .catch(async (err) => {
        const detail = String(err && err.message || err || '');
        console.error('Free try failed:', detail);
        try {
          await col.updateOne({ _id: tryId, status: 'pending' }, {
            $set: { status: 'failed', error: detail.slice(0, 300), duration_ms: Date.now() - startedAt.getTime(), finished_at: new Date() }
          });
        } catch (dbErr) { console.error('Free try status update failed:', dbErr && dbErr.message); }
      })
      .finally(() => clearTimeout(timer));
  }));

  app.get('/api/free-try/:id', asyncRoute(async (req, res) => {
    let tryId;
    try { tryId = new ObjectId(String(req.params.id || '')); } catch (_) {
      return res.status(404).json({ status: 'error', message: 'That free try was not found.' });
    }
    const token = String(req.get('x-try-token') || req.query.token || '');
    const col = db().collection('free_tries');
    const doc = token ? await col.findOne({ _id: tryId }) : null;
    if (!doc || doc.claim_token_hash !== sha256Hex(token)) {
      return res.status(404).json({ status: 'error', message: 'That free try was not found.' });
    }
    res.set('Cache-Control', 'no-store');
    const failedReply = { status: 'error', failed: true, message: 'The render did not finish. Your free try was not used, so you can try again.' };
    if (doc.status === 'done') {
      return res.json({
        status: 'success',
        try_id: String(doc._id),
        preview_url: doc.preview_url,
        before_url: doc.input_url || doc.before_url,
        room_type: doc.room_type,
        style: doc.style
      });
    }
    if (doc.status === 'failed') return res.json(failedReply);
    if (Date.now() - new Date(doc.created_at).getTime() > FREE_TRY_STALE_MS) {
      await col.updateOne({ _id: tryId, status: 'pending' }, { $set: { status: 'failed', error: 'stale pending (server restarted or timed out)', finished_at: new Date() } });
      return res.json(failedReply);
    }
    res.json({ status: 'pending', elapsed_ms: Date.now() - new Date(doc.created_at).getTime() });
  }));

  app.post('/api/free-try/claim', asyncRoute(async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    let tryId;
    try { tryId = new ObjectId(String(req.body.try_id || '')); } catch (_) {
      return res.status(400).json({ status: 'error', message: 'That free try was not found.' });
    }
    const token = String(req.body.claim_token || '');
    const col = db().collection('free_tries');
    const doc = await col.findOne({ _id: tryId, status: 'done' });
    if (!doc || !token || doc.claim_token_hash !== sha256Hex(token) || (doc.user_id && String(doc.user_id) !== String(user._id))) {
      return res.status(404).json({ status: 'error', message: 'That free try was not found.' });
    }
    if (doc.claimed_by) {
      if (String(doc.claimed_by) === String(user._id) && doc.job_id) {
        return res.json({ status: 'success', job_id: String(doc.job_id), user: publicUser(user) });
      }
      return res.status(409).json({ status: 'error', message: 'That free try is already saved to another account.' });
    }
    const claim = await col.updateOne(
      { _id: tryId, claimed_by: { $exists: false } },
      { $set: { claimed_by: user._id, claimed_at: new Date() } }
    );
    if (!claim.modifiedCount) {
      return res.status(409).json({ status: 'error', message: 'That free try is already saved to an account.' });
    }
    const attribution = {
      ref: doc.ref || '', utm_source: doc.utm_source || '', utm_medium: doc.utm_medium || '',
      utm_campaign: doc.utm_campaign || '', referrer: doc.referrer || ''
    };
    const job = {
      user_id: user._id,
      room_type: doc.room_type,
      style: doc.style,
      prompt: '',
      before_url: doc.input_url || doc.before_url,
      before_public_id: doc.before_public_id || '',
      image_url: doc.clean_url,
      image_public_id: doc.clean_public_id || '',
      preview_url: doc.preview_url,
      status: 'preview',
      credit_spent: false,
      requires_paid_credit: true,
      watermarked: true,
      source: 'free_try',
      free_try_id: tryId,
      attribution,
      created_at: new Date()
    };
    const result = await db().collection('jobs').insertOne(job);
    await col.updateOne({ _id: tryId }, { $set: { job_id: result.insertedId } });
    await db().collection('users').updateOne(
      { _id: user._id, attribution: { $exists: false } },
      { $set: { attribution: { ...attribution, via: 'free_try' } } }
    );
    await db().collection('events').insertOne({
      user_id: user._id, event_type: 'free_try_claim', property_address: '',
      metadata: { free_try_id: String(tryId), job_id: String(result.insertedId), ...attribution }, created_at: new Date()
    });
    res.json({ status: 'success', job_id: String(result.insertedId), user: publicUser(user) });
  }));

  const dfyUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: storage.MAX_BYTES, files: 10, fields: 10, fieldSize: 4000 },
    fileFilter: (_req, file, cb) => {
      if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype || '')) {
        const err = new Error('Upload JPG, PNG, or WEBP photos.');
        err.status = 400;
        return cb(err);
      }
      cb(null, true);
    }
  });
  app.post('/api/done-for-you', (req, res, next) => {
    dfyUpload.array('photos', 10)(req, res, (err) => {
      if (!err) return next();
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'Each photo must be under 10 MB.'
        : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE' ? 'Send up to 10 photos.'
        : (err.message || 'Upload failed.');
      res.status(400).json({ status: 'error', message });
    });
  }, asyncRoute(async (req, res) => {
    const name = String(req.body.name || '').replace(/[\r\n]+/g, ' ').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const note = String(req.body.note || '').trim();
    const files = req.files || [];
    if (!name || name.length > 80) return res.status(400).json({ status: 'error', message: 'Enter your name.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ status: 'error', message: 'Enter a valid email.' });
    if (note.length > 2000) return res.status(400).json({ status: 'error', message: 'Keep the note under 2000 characters.' });
    if (!files.length && !/https?:\/\//i.test(note)) return res.status(400).json({ status: 'error', message: 'Add photos or a link to the listing photos.' });
    const ip = String(req.ip || 'unknown').slice(0, 80);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const col = db().collection('dfy_requests');
    if (await col.countDocuments({ ip, created_at: { $gte: since } }) >= 3) {
      return res.status(429).json({ status: 'error', message: 'Too many requests from this network today. Email support@roomgenix.com.' });
    }
    if (await col.countDocuments({ created_at: { $gte: since } }) >= 30) {
      return res.status(429).json({ status: 'error', message: 'We are at today\'s limit. Email support@roomgenix.com.' });
    }
    const inserted = await col.insertOne({ ip, name, email, note, photos: [], status: 'uploading', created_at: new Date() });
    const urls = [];
    try {
      for (const file of files) {
        const saved = await storage.uploadBuffer(file.buffer, { folder: 'done-for-you', mime: file.mimetype });
        urls.push(saved.url);
      }
    } catch (err) {
      await col.deleteOne({ _id: inserted.insertedId });
      throw err;
    }
    const abs = (u) => (/^https?:/i.test(u) ? u : `${SITE}${u.startsWith('/') ? '' : '/'}${u}`);
    const links = urls.map(abs);
    await col.updateOne({ _id: inserted.insertedId }, { $set: { photos: links, status: 'new' } });
    const safe = (value) => String(value).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
    const ref = String(inserted.insertedId).slice(-6).toUpperCase();
    try {
      await mail.sendEmail({
        to: 'support@roomgenix.com',
        replyTo: email,
        subject: `Done-for-you request ${ref} from ${name} (${links.length} photo${links.length === 1 ? '' : 's'})`.slice(0, 200),
        text: `${name} <${email}>\nRef: ${ref}\n\nNote:\n${note || '(none)'}\n\nPhotos:\n${links.join('\n') || '(none, see note)'}\n\nOffer: $9 a photo, min 3, delivered within 24h, pay after they see them.`,
        html: `<p>${safe(name)} &lt;${safe(email)}&gt;<br>Ref: ${ref}</p><p><b>Note:</b><br>${safe(note || '(none)').replace(/\n/g, '<br>')}</p><p><b>Photos:</b><br>${links.map((u) => `<a href="${safe(u)}">${safe(u)}</a>`).join('<br>') || '(none, see note)'}</p><p>Offer: $9 a photo, min 3, delivered within 24h, pay after they see them.</p>`
      });
    } catch (err) {
      await col.updateOne({ _id: inserted.insertedId }, { $set: { status: 'email_failed' } });
      return res.status(502).json({ status: 'error', message: 'Your photos were saved but we could not notify the team. Email support@roomgenix.com and mention ref ' + ref + '.' });
    }
    mail.sendEmail({
      to: email,
      replyTo: 'support@roomgenix.com',
      subject: `We got your photos (ref ${ref}) — RoomGenix`,
      text: `Hi ${name},\n\nWe received ${links.length ? links.length + ' photo' + (links.length === 1 ? '' : 's') : 'your listing link'}. We'll stage them and email the results within 24 hours. You only pay ($9 a photo, minimum 3) if you want to use them; we'll send a payment link with the results.\n\nReply to this email with any questions.\n\nRohan\nRoomGenix`
    }).catch(() => {});
    res.json({ status: 'success', ref, count: links.length });
  }));

  app.post('/api/contact', asyncRoute(async (req, res) => {
    const name = String(req.body.name || '').replace(/[\r\n]+/g, ' ').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const message = String(req.body.message || '').trim();
    if (!name || name.length > 80) {
      return res.status(400).json({ status: 'error', message: 'Enter your name.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return res.status(400).json({ status: 'error', message: 'Enter a valid email.' });
    }
    if (message.length < 2 || message.length > 2000) {
      return res.status(400).json({ status: 'error', message: 'Write a short message.' });
    }
    const ip = String(req.ip || 'unknown').slice(0, 80);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const log = db().collection('contact_log');
    if (await log.countDocuments({ ip, created_at: { $gte: since } }) >= 5) {
      return res.status(429).json({ status: 'error', message: 'Too many messages from this network. Try again tomorrow.' });
    }
    if (await log.countDocuments({ created_at: { $gte: since } }) >= 100) {
      return res.status(429).json({ status: 'error', message: 'Support is at the daily message limit. Email support@roomgenix.com.' });
    }
    const safe = (value) => String(value).replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
    const inserted = await log.insertOne({ ip, email, created_at: new Date() });
    try {
      await mail.sendEmail({
        to: 'support@roomgenix.com',
        replyTo: email,
        subject: `RoomGenix note from ${name}`.slice(0, 200),
        text: `${name} <${email}>\n\n${message}`,
        html: `<p>${safe(name)} &lt;${safe(email)}&gt;</p><p>${safe(message).replace(/\n/g, '<br>')}</p>`
      });
      await mail.sendEmail({
        to: email,
        subject: 'We got your note — RoomGenix',
        text: `Hi ${name},\n\nWe received your message and will reply within 2 hours during business hours.\n\n— RoomGenix`,
        html: `<p>Hi ${safe(name)},</p><p>We received your message and will reply within 2 hours during business hours.</p><p>— RoomGenix</p>`
      });
    } catch (err) {
      await log.deleteOne({ _id: inserted.insertedId });
      throw err;
    }
    res.json({ status: 'success', message: 'Sent. We reply within 2 hours during business hours.' });
  }));

  app.post('/api/send-email', asyncRoute(async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const sent = await mail.sendForUser(db(), user, req.body || {});
    res.json({ status: 'success', id: sent.id });
  }));

  app.post('/api/send-email/test', asyncRoute(async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const sent = await mail.sendForUser(db(), user, {
      to: user.email,
      subject: 'RoomGenix email is working',
      text: 'This is a test from RoomGenix. Mail from info@roomgenix.com is connected.',
      html: '<p>This is a test from RoomGenix. Mail from info@roomgenix.com is connected.</p>'
    });
    res.json({ status: 'success', id: sent.id, to: user.email });
  }));

  app.post('/api/user/track-event', asyncRoute(async (req, res) => {
    const user = await authUser(req);
    if (!user) return res.json({ status: 'success' });
    await db().collection('events').insertOne({
      user_id: user._id,
      event_type: String(req.body.event_type || 'activity').slice(0, 40),
      property_address: String(req.body.property_address || '').slice(0, 180),
      metadata: req.body.metadata && typeof req.body.metadata === 'object' ? req.body.metadata : {},
      created_at: new Date()
    });
    res.json({ status: 'success' });
  }));

  app.post('/api/create-checkout', asyncRoute(async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const plan = CATALOG[req.body.plan] ? req.body.plan : 'pro';
    const tier = CATALOG[plan];
    const price = tier.price;
    const items = [{ name: tier.name, price, type: tier.type }];

    if (dodo.configured()) {
      const host = req.get('host');
      const proto = req.get('x-forwarded-proto') || req.protocol;
      const base = `${proto}://${host}`;
      const referer = req.get('referer') || '';
      const returnPath = referer.includes('/dashboard') ? '/dashboard?checkout=success' : '/?checkout=success';
      const txId = new ObjectId();
      await db().collection('transactions').insertOne({
        _id: txId,
        user_id: user._id,
        plan,
        amount: price,
        credits_added: tier.credits,
        status: 'pending',
        provider: 'dodo',
        stripe_session_id: '',
        dodo_session_id: '',
        created_at: new Date()
      });
      let session;
      try {
        session = await dodo.createCheckout({
          db: db(),
          catalog: CATALOG,
          user,
          plan,
          price,
          returnUrl: `${base}${returnPath}`,
          transactionId: txId
        });
      } catch (err) {
        await db().collection('transactions').deleteOne({ _id: txId, status: 'pending' });
        throw err;
      }
      await db().collection('transactions').updateOne(
        { _id: txId },
        { $set: { dodo_session_id: session.session_id } }
      );
      return res.json({ status: 'success', mode: 'live', checkout_url: session.checkout_url, plan, total_due: price });
    }

    if (STRIPE_SECRET_KEY) {
      const host = req.get('host');
      const proto = req.get('x-forwarded-proto') || req.protocol;
      const base = `${proto}://${host}`;
      const params = new URLSearchParams();
      params.set('mode', 'payment');
      params.set('success_url', `${base}/index.html?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
      params.set('cancel_url', `${base}/index.html?checkout=cancel#pricing`);
      params.set('client_reference_id', String(user._id));
      params.set('metadata[user_id]', String(user._id));
      params.set('metadata[plan]', plan);
      params.set('metadata[credits]', String(tier.credits));
      items.forEach((item, i) => {
        params.set(`line_items[${i}][quantity]`, '1');
        params.set(`line_items[${i}][price_data][currency]`, 'usd');
        params.set(`line_items[${i}][price_data][unit_amount]`, String(Math.round(item.price * 100)));
        params.set(`line_items[${i}][price_data][product_data][name]`, item.name);
      });
      const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });
      const session = await stripeRes.json();
      if (!stripeRes.ok || !session.url) {
        return res.status(502).json({ status: 'error', message: 'Card checkout could not be opened.' });
      }
      await db().collection('transactions').insertOne({
        user_id: user._id,
        plan,
        amount: price,
        credits_added: tier.credits,
        status: 'pending',
        stripe_session_id: session.id,
        created_at: new Date()
      });
      return res.json({ status: 'success', mode: 'live', checkout_url: session.url, plan, total_due: price });
    }

    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ status: 'error', message: 'Card checkout is not connected yet.' });
    }

    await db().collection('users').updateOne(
      { _id: user._id },
      { $inc: { credits_balance: tier.credits }, $set: { plan } }
    );
    await db().collection('transactions').insertOne({
      user_id: user._id,
      plan,
      amount: price,
      credits_added: tier.credits,
      status: 'completed',
      stripe_session_id: '',
      created_at: new Date()
    });
    const fresh = await db().collection('users').findOne({ _id: user._id });
    res.json({
      status: 'success',
      mode: 'demo',
      plan,
      total_due: price,
      credits_added: tier.credits,
      credits_balance: fresh.credits_balance,
      user: publicUser(fresh),
      message: 'Credits are on this account. A card is charged only when Dodo Payments is connected.'
    });
  }));

  app.post('/api/checkout/confirm', asyncRoute(async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const sessionId = String(req.body.session_id || '');
    if (dodo.configured()) {
      const query = sessionId
        ? { user_id: user._id, dodo_session_id: sessionId }
        : { user_id: user._id, provider: 'dodo' };
      const pending = await db().collection('transactions').findOne(query, { sort: { created_at: -1 } });
      let credited = false;
      if (pending && pending.status === 'pending' && pending.dodo_session_id) {
        const session = await dodo.getSession(pending.dodo_session_id);
        if (session.payment_status === 'succeeded') {
          const result = await completeDodoPayment({ _id: pending._id }, session.payment_id || '');
          credited = result.credited;
        }
      } else if (pending && pending.status === 'completed') {
        credited = true;
      }
      const fresh = await db().collection('users').findOne({ _id: user._id });
      // Return purchase amount (USD) for client-side Pixel Purchase event (first-time credit of a transaction only).
      const purchaseValue = credited && pending ? Number(pending.amount_usd || pending.amount || 0) : 0;
      return res.json({ status: 'success', user: publicUser(fresh), credits_balance: fresh.credits_balance, credited, purchase_value: purchaseValue, plan: pending ? pending.plan : null });
    }
    if (!sessionId || !STRIPE_SECRET_KEY) {
      const fresh = await db().collection('users').findOne({ _id: user._id });
      return res.json({ status: 'success', user: publicUser(fresh) });
    }
    const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` }
    });
    const session = await stripeRes.json();
    if (!stripeRes.ok || session.payment_status !== 'paid' || session.metadata?.user_id !== String(user._id)) {
      return res.status(402).json({ status: 'error', message: 'That payment is not confirmed.' });
    }
    const pending = await db().collection('transactions').findOne({ stripe_session_id: sessionId, status: 'pending' });
    if (pending) {
      await db().collection('transactions').updateOne({ _id: pending._id }, { $set: { status: 'completed' } });
      await db().collection('users').updateOne(
        { _id: user._id },
        { $inc: { credits_balance: pending.credits_added }, $set: { plan: pending.plan } }
      );
    }
    const fresh = await db().collection('users').findOne({ _id: user._id });
    res.json({ status: 'success', user: publicUser(fresh), credits_balance: fresh.credits_balance, credited: true });
  }));

  app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ status: 'error', message: 'Not found.' });
    }
    res.status(404);
    if (req.method === 'GET' && req.accepts('html')) {
      return sendPage(res, path.join(ROOT, '404.html'), { cache: 'no-store' });
    }
    res.end();
  });

  app.use((err, _req, res, _next) => {
    if (err && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ status: 'error', message: 'Photo is larger than 10 MB.' });
    }
    const raw = String(err && err.message || '');
    if (/invalid image|unsupported image|file format/i.test(raw)) {
      return res.status(400).json({ status: 'error', message: 'That file is not a photo we can use. Upload a JPG, PNG, or WEBP.' });
    }
    const status = err.status || 500;
    res.status(status).json({ status: 'error', message: raw || 'Something went wrong.' });
  });

  nurture.start(db);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Roomgenix listening on http://127.0.0.1:${PORT}`);
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
