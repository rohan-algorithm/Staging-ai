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

const PORT = parseInt(process.env.PORT || '8080', 10);
const ROOT = path.join(__dirname, '..');
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || '';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';

const CATALOG = {
  single: { name: 'Single Photo', price: 2.99, credits: 1, type: 'pack' },
  listing: { name: 'Single Listing Pass (8 Photos)', price: 19, credits: 8, type: 'pack' },
  starter: { name: 'Starter Pack (10 Images)', price: 29, credits: 10, type: 'pack' },
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
    created_at: user.created_at
  };
}

function publicJob(job) {
  return {
    id: String(job._id),
    room_type: job.room_type,
    style: job.style,
    image_url: job.image_url,
    before_url: job.before_url,
    prompt: job.prompt || '',
    status: job.status,
    source: job.source || (String(job.image_url || '').includes('assets/') ? 'sample' : ''),
    created_at: job.created_at
  };
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

const FURNITURE = {
  modern: 'a low sofa, a light wood table, and one neutral rug',
  scandinavian: 'a pale wood bed or sofa, linen upholstery, and a simple rug',
  farmhouse: 'a wood table, soft linen seating, and a woven rug',
  coastal: 'a light sofa, a natural-fiber rug, and a little pale blue',
  luxury: 'tailored upholstery, a low table, and a quiet rug',
  midcentury: 'low wood-leg seating and a single rug'
};

function editPrompt(style, room, prompt) {
  const extra = prompt ? ` Also follow this note: ${prompt}` : '';
  if (room === 'twilight') {
    return `Turn this daytime exterior into dusk. Add warm light in the windows that already exist and a deep blue sky. Keep the same house, yard, landscaping, and camera.${extra}`;
  }
  if (room === 'declutter') {
    return `Remove boxes, clutter, and laundry from this photo. Keep the real furniture, walls, windows, floors, and camera exactly as they are.${extra}`;
  }
  if (room === 'renovation') {
    return `Refresh the wall color and floor finish so the room looks updated. Keep the same windows, doors, ceiling height, and camera. Do not move walls.${extra}`;
  }
  if (room === 'patio') {
    return `Add a teak sectional, two chairs, a coffee table, and an outdoor rug on this patio. Keep the house, doors, fence, lawn, and daylight exactly the same. No fire and no string lights.${extra}`;
  }
  const furniture = FURNITURE[style] || FURNITURE.modern;
  const roomName = {
    living: 'living room',
    bedroom: 'bedroom',
    dining: 'dining room',
    office: 'home office'
  }[room] || 'room';
  return `Add ${furniture} to this empty ${roomName}. Keep the same walls, windows, doors, floors, ceiling, and camera. Change only the furniture. Match the daylight already in the photo.${extra}`;
}

function dataUri(buffer, mime) {
  const type = mime && String(mime).startsWith('image/') ? String(mime).split(';')[0] : 'image/jpeg';
  return `data:${type};base64,${buffer.toString('base64')}`;
}

function imageForReplicate(req, before) {
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

async function callReplicate(imageInput, style, room, prompt) {
  const start = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-dev/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
      Prefer: 'wait'
    },
    body: JSON.stringify({
      input: {
        prompt: editPrompt(style, room, prompt),
        input_image: imageInput,
        aspect_ratio: 'match_input_image',
        output_format: 'jpg',
        output_quality: 90,
        guidance: 2.5,
        num_inference_steps: 28
      }
    })
  });
  let prediction = await start.json();
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
    const poll = await fetch(pollUrl, { headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` } });
    prediction = await poll.json();
  }
  const output = prediction.output;
  if (Array.isArray(output) && output[0]) return output[0];
  if (typeof output === 'string') return output;
  throw new Error('Render finished without an image.');
}

async function seed() {
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

  const app = express();
  app.use(express.json({ limit: '16mb' }));
  app.use(express.urlencoded({ extended: true, limit: '16mb' }));
  app.use((req, res, next) => {
    const blocked = req.path.startsWith('/server')
      || req.path.startsWith('/node_modules')
      || req.path === '/package.json'
      || req.path === '/package-lock.json'
      || req.path === '/.env'
      || req.path === '/.env.example';
    if (blocked) return res.status(404).end();
    next();
  });
  app.use('/uploads', express.static(storage.UPLOADS));
  app.get('/dashboard', (_req, res) => {
    res.sendFile(path.join(ROOT, 'dashboard.html'));
  });
  app.get('/dashboard/', (_req, res) => res.redirect('/dashboard'));
  app.use(express.static(ROOT, { index: 'index.html', etag: false, maxAge: 0 }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      mongo: true,
      images: storage.configured() ? 'cloudinary' : 'local',
      render: REPLICATE_API_TOKEN ? 'kontext-dev' : 'off',
      checkout: STRIPE_SECRET_KEY ? 'stripe' : 'demo'
    });
  });

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
      plan: 'free_trial',
      credits_balance: 3,
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
      user_id: doc._id, event_type: 'signup', property_address: '', metadata: { plan: 'free_trial' }, created_at: new Date()
    });
    res.json({
      status: 'success',
      message: `Account created. 3 preview credits are on ${name.split(' ')[0]}'s account.`,
      user: publicUser(doc),
      token: doc.session_token
    });
  }));

  app.post('/api/auth/login', asyncRoute(async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await db().collection('users').findOne({ email });
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ status: 'error', message: 'Email or password does not match.' });
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

    let imageUrl = '';
    let imagePublicId = '';
    let source = 'replicate';
    try {
      const staged = await callReplicate(imageForReplicate(req, before), style, room, prompt);
      const persisted = await storage.persistRemote(staged, { folder: userFolder(user._id, 'staged') });
      imageUrl = persisted.url;
      imagePublicId = persisted.public_id || '';
    } catch (err) {
      const detail = String(err && err.message || '');
      console.error('Render failed:', detail || err);
      const billing = /insufficient credit/i.test(detail);
      return res.status(502).json({
        status: 'error',
        message: billing
          ? 'Replicate has no credit left. Add credit in the Replicate billing page, wait a few minutes, then try this photo again.'
          : 'The render did not finish. Your photo was not replaced with an example.'
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
      staged_url: imageUrl,
      before_url: beforeUrl,
      job_id: String(result.insertedId),
      source,
      credits_balance: fresh.credits_balance,
      user: publicUser(fresh),
      message: source === 'replicate'
        ? 'Preview saved to your studio. A download uses one credit.'
        : 'Preview saved to your studio. A live furniture render needs a Replicate token. A download uses one credit.'
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
      if (user.credits_balance < 1) {
        return res.status(402).json({
          status: 'error',
          message: 'Add a credit to download this render.',
          credits_balance: user.credits_balance,
          user: publicUser(user)
        });
      }
      await db().collection('users').updateOne({ _id: user._id }, { $inc: { credits_balance: -1 } });
      await db().collection('jobs').updateOne({ _id: job._id }, { $set: { status: 'downloaded', downloaded_at: new Date() } });
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
    let price = tier.price;
    const items = [{ name: tier.name, price, type: tier.type }];
    if (req.body.include_twilight) {
      price += 14;
      items.push({ name: 'Day-to-dusk', price: 14, type: 'addon' });
    }
    price = Math.round(price * 100) / 100;

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
      message: 'Credits are on this account. A card is charged only when a Stripe key is connected.'
    });
  }));

  app.post('/api/checkout/confirm', asyncRoute(async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const sessionId = String(req.body.session_id || '');
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
    res.json({ status: 'success', user: publicUser(fresh), credits_balance: fresh.credits_balance });
  }));

  app.use((err, _req, res, _next) => {
    if (err && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ status: 'error', message: 'Photo is larger than 10 MB.' });
    }
    const status = err.status || 500;
    res.status(status).json({ status: 'error', message: err.message || 'Something went wrong.' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Roomgenix listening on http://127.0.0.1:${PORT}`);
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
