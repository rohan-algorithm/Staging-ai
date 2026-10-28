#!/usr/bin/env node
/**
 * Submit sitemap URLs to IndexNow (Bing, Yandex, Seznam, Naver share submissions).
 * Usage: node scripts/indexnow.js            (every URL in sitemap.xml)
 *        node scripts/indexnow.js /pricing /about
 * Needs INDEXNOW_KEY in .env, and the live site must already serve /<key>.txt.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');

const SITE = 'https://roomgenix.com';
const KEY = (process.env.INDEXNOW_KEY || '').trim();

async function main() {
  if (!/^[a-f0-9-]{8,128}$/i.test(KEY)) {
    console.error('Set INDEXNOW_KEY (8-128 hex characters) in .env first.');
    process.exit(1);
  }
  const args = process.argv.slice(2);
  const urls = args.length
    ? args.map((p) => (p.startsWith('http') ? p : SITE + p))
    : [...fs.readFileSync(path.join(__dirname, '..', 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => m[1])
      .filter((u) => u.startsWith(SITE) && !u.includes('/assets/'));

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: 'roomgenix.com', key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls })
  });
  console.log(`IndexNow: ${res.status} ${res.statusText} for ${urls.length} URL(s)`);
  if (res.status >= 400) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
