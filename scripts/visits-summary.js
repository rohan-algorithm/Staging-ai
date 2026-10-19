#!/usr/bin/env node
/**
 * Read-only summary of first-party page visits (collection `visits`) and no-signup free tries (`free_tries`).
 * Usage: node scripts/visits-summary.js
 * Uses MONGODB_URI / MONGODB_DB from .env. Performs aggregate reads only.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { MongoClient } = require('mongodb');

const WINDOWS = [
  { label: 'last 24h', ms: 24 * 60 * 60 * 1000 },
  { label: 'last 7d', ms: 7 * 24 * 60 * 60 * 1000 }
];

function table(title, rows) {
  console.log(`  ${title}`);
  if (!rows.length) { console.log('    (none)'); return; }
  const width = Math.min(60, Math.max(...rows.map((r) => String(r.key).length)));
  rows.forEach((r) => {
    console.log(`    ${String(r.key).slice(0, 60).padEnd(width)}  visits ${String(r.visits).padStart(5)}  unique ${String(r.unique).padStart(5)}`);
  });
}

async function group(col, since, field) {
  const docs = await col.aggregate([
    { $match: { timestamp: { $gte: since } } },
    { $group: { _id: { $ifNull: [`$${field}`, ''] }, visits: { $sum: 1 }, ips: { $addToSet: '$ip_hash' } } },
    { $project: { visits: 1, unique: { $size: '$ips' } } },
    { $sort: { visits: -1, _id: 1 } },
    { $limit: 25 }
  ]).toArray();
  return docs.map((d) => ({ key: d._id === '' ? '(none)' : d._id, visits: d.visits, unique: d.unique }));
}

// No-signup free tries (collection `free_tries`): status counts, claims, and source.
async function freeTries(tries, since) {
  const match = { created_at: { $gte: since } };
  const total = await tries.countDocuments(match);
  const byStatus = await tries.aggregate([
    { $match: match },
    { $group: { _id: '$status', n: { $sum: 1 } } },
    { $sort: { n: -1 } }
  ]).toArray();
  const claimed = await tries.countDocuments({ ...match, claimed_by: { $exists: true } });
  const ips = (await tries.distinct('ip_hash', match)).length;
  console.log(`  free tries: ${total}   unique visitors (hashed IP): ${ips}   saved to an account: ${claimed}`);
  console.log(`    by status: ${byStatus.map((s) => `${s._id || '(none)'} ${s.n}`).join(', ') || '(none)'}`);
  const byRef = await tries.aggregate([
    { $match: match },
    { $group: { _id: { $ifNull: ['$ref', ''] }, n: { $sum: 1 } } },
    { $sort: { n: -1 } },
    { $limit: 15 }
  ]).toArray();
  console.log(`    by ref: ${byRef.map((r) => `${r._id || '(none)'} ${r.n}`).join(', ') || '(none)'}`);
}

(async () => {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set (check .env).');
    process.exit(1);
  }
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  await client.connect();
  const database = client.db(process.env.MONGODB_DB || 'virtualstage');
  const col = database.collection('visits');
  const tries = database.collection('free_tries');
  const now = Date.now();
  console.log(`Visits summary generated ${new Date(now).toISOString()} (UTC)`);
  for (const w of WINDOWS) {
    const since = new Date(now - w.ms);
    const [total] = await col.aggregate([
      { $match: { timestamp: { $gte: since } } },
      { $group: { _id: null, visits: { $sum: 1 }, ips: { $addToSet: '$ip_hash' } } }
    ]).toArray();
    console.log(`\n=== ${w.label} (since ${since.toISOString()}) ===`);
    console.log(`  total visits: ${total ? total.visits : 0}   unique visitors (hashed IP): ${total ? total.ips.length : 0}`);
    table('by ref', await group(col, since, 'ref'));
    table('by utm_source', await group(col, since, 'utm_source'));
    table('by path', await group(col, since, 'path'));
    await freeTries(tries, since);
  }
  await client.close();
})().catch((err) => { console.error('Summary failed:', err.message); process.exit(1); });
