/**
 * Transactional email through Resend.
 * The From address is fixed. Callers cannot choose a sender.
 * RESEND_API_KEY stays on the server.
 */
const { Resend } = require('resend');

const FROM = 'RoomGenix <info@roomgenix.com>';
const USER_DAILY_LIMIT = 20;
const GLOBAL_DAILY_LIMIT = 200;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_BODY = 100000;

let client;

function configured() {
  return Boolean((process.env.RESEND_API_KEY || '').trim());
}

function resend() {
  const key = (process.env.RESEND_API_KEY || '').trim();
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

function fail(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function messageFrom(body) {
  const payload = body && typeof body === 'object' ? body : {};
  if (Object.prototype.hasOwnProperty.call(payload, 'from')) {
    throw fail('The sender address cannot be changed.', 400);
  }
  const to = String(payload.to || '').trim().toLowerCase();
  if (!isEmail(to)) throw fail('Enter a valid recipient email.', 400);
  const subject = String(payload.subject || '').trim();
  if (!subject) throw fail('A subject is required.', 400);
  if (subject.length > 200) throw fail('Subject is too long.', 400);
  const html = payload.html == null ? '' : String(payload.html);
  const text = payload.text == null ? '' : String(payload.text);
  if (!html.trim() && !text.trim()) throw fail('Add a message.', 400);
  if (html.length > MAX_BODY || text.length > MAX_BODY) throw fail('That message is too long.', 400);
  return { to, subject, html, text };
}

async function enforceLimit(database, userId) {
  const since = new Date(Date.now() - DAY_MS);
  const log = database.collection('email_log');
  const userCount = await log.countDocuments({ user_id: userId, created_at: { $gte: since } });
  if (userCount >= USER_DAILY_LIMIT) {
    throw fail('You have reached the daily email limit.', 429);
  }
  const globalCount = await log.countDocuments({ created_at: { $gte: since } });
  if (globalCount >= GLOBAL_DAILY_LIMIT) {
    throw fail('Email limit reached. Try again tomorrow.', 429);
  }
}

async function sendEmail({ to, subject, html, text }) {
  const message = messageFrom({ to, subject, html, text });
  const api = resend();
  if (!api) throw fail('Email is not connected yet.', 503);

  const payload = {
    from: FROM,
    to: [message.to],
    subject: message.subject
  };
  if (message.html.trim()) payload.html = message.html;
  if (message.text.trim()) payload.text = message.text;

  let result;
  try {
    result = await api.emails.send(payload);
  } catch (err) {
    console.error('email send failed', err && err.name ? err.name : 'error');
    throw fail('Email could not be sent.', 502);
  }
  if (!result || result.error) {
    const statusCode = result && result.error && result.error.statusCode;
    console.error('email send failed', statusCode || 'error');
    throw fail('Email could not be sent.', 502);
  }
  return { id: (result.data && result.data.id) || '' };
}

async function sendForUser(database, user, body) {
  const message = messageFrom(body);
  await enforceLimit(database, user._id);
  const inserted = await database.collection('email_log').insertOne({
    user_id: user._id,
    to: message.to,
    status: 'pending',
    created_at: new Date()
  });
  try {
    const sent = await sendEmail(message);
    await database.collection('email_log').updateOne(
      { _id: inserted.insertedId },
      { $set: { status: 'sent', resend_id: sent.id } }
    );
    return sent;
  } catch (err) {
    await database.collection('email_log').deleteOne({ _id: inserted.insertedId });
    throw err;
  }
}

module.exports = {
  FROM,
  configured,
  sendEmail,
  sendForUser
};
