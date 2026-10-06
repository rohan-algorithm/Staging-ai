/**
 * Dodo Payments hosted checkout.
 * https://docs.dodopayments.com/api-reference/checkout-sessions/create
 */
const crypto = require('crypto');

const API_KEY = process.env.DODO_PAYMENTS_API_KEY || '';
const WEBHOOK_KEY = process.env.DODO_PAYMENTS_WEBHOOK_KEY || '';
const MODE = process.env.DODO_PAYMENTS_ENVIRONMENT
  || (process.env.NODE_ENV === 'production' ? 'live_mode' : 'test_mode');

const BASE = MODE === 'live_mode'
  ? 'https://live.dodopayments.com'
  : 'https://test.dodopayments.com';

const PRODUCT_ENV = {
  single: 'DODO_PRODUCT_SINGLE',
  listing: 'DODO_PRODUCT_LISTING',
  starter: 'DODO_PRODUCT_STARTER',
  pro: 'DODO_PRODUCT_PRO',
  agency_pack: 'DODO_PRODUCT_AGENCY'
};

function configured() {
  return Boolean(API_KEY);
}

function mode() {
  return MODE === 'live_mode' ? 'live' : 'test';
}

async function dodo(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    let message = data.message || data.error || 'Dodo Payments could not complete that request.';
    if (/live payments not enabled/i.test(String(message))) {
      message = 'Dodo is still reviewing this account. Card checkout opens after that review.';
    }
    const err = new Error(message);
    err.status = 502;
    throw err;
  }
  return data;
}

function cents(dollars) {
  return Math.round(Number(dollars) * 100);
}

async function createProduct(spec) {
  const product = await dodo('/products', {
    method: 'POST',
    body: JSON.stringify({
      name: spec.name,
      description: spec.description,
      tax_category: 'saas',
      metadata: { pack: spec.key },
      price: {
        type: 'one_time_price',
        currency: 'USD',
        price: spec.cents,
        discount: 0,
        purchasing_power_parity: false,
        tax_inclusive: true
      }
    })
  });
  const id = product.product_id || product.id;
  if (!id) throw new Error('Dodo Payments did not return a product id.');
  return id;
}

async function ensureProducts(db, catalog) {
  const specs = Object.entries(catalog).map(([key, tier]) => ({
    key,
    name: `RoomGenixAI ${tier.name}`,
    description: `${tier.credits} photo credit${tier.credits === 1 ? '' : 's'} on RoomGenixAI.`,
    cents: cents(tier.price)
  }));

  const catalogId = `dodo_catalog_${mode()}`;
  const saved = await db.collection('settings').findOne({ _id: catalogId });
  const products = { ...(saved && saved.products) };

  for (const spec of specs) {
    const fromEnv = process.env[PRODUCT_ENV[spec.key]] || '';
    if (fromEnv) {
      products[spec.key] = { id: fromEnv, cents: spec.cents };
      continue;
    }
    if (products[spec.key] && products[spec.key].id && products[spec.key].cents === spec.cents) continue;
    const id = await createProduct(spec);
    products[spec.key] = { id, cents: spec.cents };
  }

  await db.collection('settings').updateOne(
    { _id: catalogId },
    { $set: { products, mode: mode(), updated_at: new Date() } },
    { upsert: true }
  );
  return products;
}

async function createCheckout({ db, catalog, user, plan, price, returnUrl, transactionId }) {
  const products = await ensureProducts(db, catalog);
  const pack = products[plan];
  if (!pack || !pack.id) throw new Error('That credit pack is not available for checkout.');
  const productCart = [{ product_id: pack.id, quantity: 1 }];

  const session = await dodo('/checkouts', {
    method: 'POST',
    body: JSON.stringify({
      product_cart: productCart,
      customer: { email: user.email, name: user.name || undefined },
      return_url: returnUrl,
      metadata: {
        user_id: String(user._id),
        plan,
        credits: String(catalog[plan].credits),
        transaction_id: String(transactionId),
        amount: String(price)
      }
    })
  });

  if (!session.checkout_url || !session.session_id) {
    throw new Error('Card checkout could not be opened.');
  }
  return session;
}

async function getSession(sessionId) {
  return dodo(`/checkouts/${encodeURIComponent(sessionId)}`);
}

function webhookSecretBytes() {
  let secret = WEBHOOK_KEY.trim();
  if (secret.startsWith('whsec_')) secret = secret.slice(6);
  const decoded = Buffer.from(secret, 'base64');
  if (decoded.length) return decoded;
  return Buffer.from(WEBHOOK_KEY);
}

function verifyWebhook(rawBody, headers) {
  if (!WEBHOOK_KEY) {
    const err = new Error('Webhook secret is not configured.');
    err.status = 401;
    throw err;
  }
  const id = headers['webhook-id'];
  const timestamp = headers['webhook-timestamp'];
  const signature = headers['webhook-signature'];
  if (!id || !timestamp || !signature) {
    const err = new Error('Missing webhook signature.');
    err.status = 401;
    throw err;
  }
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) {
    const err = new Error('Webhook timestamp is outside the allowed window.');
    err.status = 401;
    throw err;
  }
  const signed = `${id}.${timestamp}.${rawBody}`;
  const expected = crypto.createHmac('sha256', webhookSecretBytes()).update(signed).digest('base64');
  const candidates = String(signature).split(' ').map(part => part.split(',')[1]).filter(Boolean);
  const match = candidates.some(value => {
    const a = Buffer.from(value);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
  if (!match) {
    const err = new Error('Webhook signature does not match.');
    err.status = 401;
    throw err;
  }
  return JSON.parse(rawBody);
}

module.exports = {
  configured,
  mode,
  createCheckout,
  getSession,
  verifyWebhook
};
