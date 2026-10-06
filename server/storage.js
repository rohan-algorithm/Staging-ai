const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;

const UPLOADS = path.join(__dirname, '..', 'uploads');
const MAX_BYTES = 10 * 1024 * 1024;

function configured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME
    && process.env.CLOUDINARY_API_KEY
    && process.env.CLOUDINARY_API_SECRET
  );
}

function init() {
  if (configured()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
    console.log('Images: Cloudinary');
    return;
  }
  fs.mkdirSync(UPLOADS, { recursive: true });
  console.log('Images: local /uploads (set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).');
}

function assertSize(buffer) {
  if (!buffer || !buffer.length) {
    const err = new Error('Choose a photo to upload.');
    err.status = 400;
    throw err;
  }
  if (buffer.length > MAX_BYTES) {
    const err = new Error('Photo is larger than 10 MB.');
    err.status = 400;
    throw err;
  }
}

function extFromMime(mime) {
  if ((mime || '').includes('png')) return 'png';
  if ((mime || '').includes('webp')) return 'webp';
  return 'jpg';
}

async function uploadBuffer(buffer, { folder, mime, maxBytes } = {}) {
  if (maxBytes) {
    if (!buffer || !buffer.length) {
      const err = new Error('Choose a photo to upload.');
      err.status = 400;
      throw err;
    }
    if (buffer.length > maxBytes) {
      const err = new Error('The staged photo was too large to save.');
      err.status = 400;
      throw err;
    }
  } else {
    assertSize(buffer);
  }
  if (configured()) {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({
        folder: folder || 'virtualstage',
        resource_type: 'image',
        unique_filename: true,
        overwrite: false
      }, (err, uploaded) => (err ? reject(err) : resolve(uploaded)));
      stream.end(buffer);
    });
    return {
      url: result.secure_url,
      public_id: result.public_id,
      provider: 'cloudinary'
    };
  }

  fs.mkdirSync(UPLOADS, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${extFromMime(mime)}`;
  fs.writeFileSync(path.join(UPLOADS, name), buffer);
  return { url: `/uploads/${name}`, public_id: name, provider: 'local' };
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  return {
    buffer: Buffer.from(match[2], 'base64'),
    mime: `image/${match[1]}`
  };
}

async function uploadDataUrl(dataUrl, opts) {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return null;
  return uploadBuffer(parsed.buffer, { ...opts, mime: parsed.mime });
}

async function persistRemote(url, { folder } = {}) {
  if (!url) return null;
  if (url.startsWith('assets/') || url.startsWith('/assets/')) {
    return { url, public_id: '', provider: 'sample' };
  }
  if (configured() && /^https?:\/\//i.test(url) && !url.includes('res.cloudinary.com')) {
    const result = await cloudinary.uploader.upload(url, {
      folder: folder || 'virtualstage',
      resource_type: 'image'
    });
    const savedUrl = (folder || '').includes('staged') ? withDisclosure(result.secure_url) : result.secure_url;
    return { url: savedUrl, public_id: result.public_id, provider: 'cloudinary' };
  }
  if (/^https?:\/\//i.test(url)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Could not save the staged photo.');
    const buffer = Buffer.from(await res.arrayBuffer());
    const mime = (res.headers.get('content-type') || 'image/jpeg').split(';')[0];
    return uploadBuffer(buffer, { folder, mime, maxBytes: 25 * 1024 * 1024 });
  }
  return { url, public_id: '', provider: url.startsWith('/uploads/') ? 'local' : 'remote' };
}

function withDisclosure(url) {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/') || url.includes('l_text:')) {
    return url;
  }
  const layer = 'l_text:Arial_36_bold:Virtually%20staged,co_white,g_south_east,x_28,y_28';
  return url.replace('/upload/', `/upload/${layer}/`);
}

function downloadUrl(url, filename) {
  if (!url) return '';
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    const safe = String(filename || 'virtualstage').replace(/[^a-zA-Z0-9._-]/g, '_');
    return url.replace('/upload/', `/upload/fl_attachment:${safe}/`);
  }
  return url;
}

module.exports = {
  UPLOADS,
  MAX_BYTES,
  configured,
  init,
  uploadBuffer,
  uploadDataUrl,
  persistRemote,
  downloadUrl
};
