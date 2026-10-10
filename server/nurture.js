/**
 * Signup nurture emails (plain text).
 *  - 24h: users with no completed purchase -> "Your preview is still there".
 *  - 48h: all new users -> short founder note, replies go to support@.
 * Only users created after the feature first started (settings.nurture_start).
 * Idempotent: each send is claimed atomically with a per-user flag before sending.
 * Capped at DAILY_CAP sends per rolling 24h. Honors users.unsubscribed.
 */
const crypto = require('crypto');
const mail = require('./mail');

const HOUR = 60 * 60 * 1000;
const DAILY_CAP = 20;
const INTERVAL_MS = 15 * 60 * 1000;
const SITE = 'https://roomgenix.com';

function unsubLine(token) {
  return `\n\n--\nDon't want these emails? Unsubscribe: ${SITE}/unsubscribe?t=${token}`;
}

const STEPS = [
  {
    flag: 'nurture_24h_sent',
    afterMs: 24 * HOUR,
    requireNoPurchase: true,
    subject: 'Your preview is still there',
    text: () => `Hi,

The photos you started on RoomGenix are still in your studio:
${SITE}/dashboard

When you're ready for clean, unwatermarked files, it's $2.99 a photo, or $19 for 8 (one listing). Bigger packs are $49 for 25 and $99 for 60. No subscription, and credits don't expire.

Pricing: ${SITE}/pricing

RoomGenix`
  },
  {
    flag: 'nurture_48h_sent',
    afterMs: 48 * HOUR,
    requireNoPurchase: false,
    subject: 'Quick question from RoomGenix',
    replyTo: 'support@roomgenix.com',
    text: () => `Hey,

This is an automated email, but if you reply it comes straight to me. What were you hoping to stage, and did RoomGenix do the job?

Rohan
Founder, RoomGenix`
  }
];

async function startTime(db) {
  const now = new Date();
  await db.collection('settings').updateOne(
    { _id: 'nurture_start' },
    { $setOnInsert: { at: now } },
    { upsert: true }
  );
  const doc = await db.collection('settings').findOne({ _id: 'nurture_start' });
  return doc.at;
}

async function sentToday(db) {
  return db.collection('nurture_log').countDocuments({ created_at: { $gte: new Date(Date.now() - 24 * HOUR) } });
}

async function runOnce(db) {
  if (!mail.configured()) return;
  const start = await startTime(db);
  let budget = DAILY_CAP - (await sentToday(db));
  for (const step of STEPS) {
    if (budget <= 0) return;
    const cutoff = new Date(Date.now() - step.afterMs);
    const candidates = await db.collection('users').find({
      created_at: { $gte: start, $lte: cutoff },
      [step.flag]: { $exists: false },
      unsubscribed: { $ne: true },
      email: { $type: 'string' }
    }).sort({ created_at: 1 }).limit(budget).toArray();
    for (const user of candidates) {
      if (budget <= 0) return;
      if (step.requireNoPurchase) {
        const paid = await db.collection('transactions').findOne({ user_id: user._id, status: 'completed' });
        if (paid) {
          await db.collection('users').updateOne({ _id: user._id, [step.flag]: { $exists: false } }, { $set: { [step.flag]: 'skipped_paid' } });
          continue;
        }
      }
      const token = user.unsub_token || crypto.randomBytes(16).toString('hex');
      const claim = await db.collection('users').updateOne(
        { _id: user._id, [step.flag]: { $exists: false }, unsubscribed: { $ne: true } },
        { $set: { [step.flag]: 'pending', unsub_token: token } }
      );
      if (claim.modifiedCount !== 1) continue;
      budget -= 1;
      try {
        const sent = await mail.sendEmail({
          to: user.email,
          subject: step.subject,
          text: step.text(user) + unsubLine(token),
          replyTo: step.replyTo
        });
        await db.collection('users').updateOne({ _id: user._id }, { $set: { [step.flag]: new Date() } });
        await db.collection('nurture_log').insertOne({ user_id: user._id, step: step.flag, resend_id: sent.id, created_at: new Date() });
      } catch (err) {
        // Release the claim so a later run can retry; stop this run (likely a provider limit).
        await db.collection('users').updateOne({ _id: user._id, [step.flag]: 'pending' }, { $unset: { [step.flag]: '' } });
        console.error('nurture send failed', step.flag, err && err.message);
        return;
      }
    }
  }
}

let running = false;
function start(getDb) {
  if (process.env.NURTURE_DISABLED === '1') return;
  const tick = async () => {
    if (running) return;
    running = true;
    try { await runOnce(getDb()); } catch (err) { console.error('nurture run failed', err && err.message); }
    finally { running = false; }
  };
  setTimeout(tick, 60 * 1000);
  setInterval(tick, INTERVAL_MS).unref();
}

async function unsubscribe(db, token) {
  if (!/^[a-f0-9]{32}$/.test(String(token || ''))) return false;
  const r = await db.collection('users').updateOne({ unsub_token: token }, { $set: { unsubscribed: true, unsubscribed_at: new Date() } });
  return r.matchedCount === 1;
}

module.exports = { start, runOnce, unsubscribe, DAILY_CAP };
