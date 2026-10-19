/* RoomGenix: "Try it free, no signup" on the homepage, plus the $2.99 clean-file hand-off.
   Relies on globals from app.js (getAuthToken, authHeaders, showToast) when they exist. */
(function () {
  'use strict';
  var TRY_KEY = 'rg_free_try';
  var JOB_KEY = 'rg_free_try_job';
  var INTENT_KEY = 'rg_free_try_intent';
  var ATTR_KEY = 'rg_attr';
  var ATTR_FIELDS = ['ref', 'utm_source', 'utm_medium', 'utm_campaign'];
  var MAX_BYTES = 10 * 1024 * 1024;
  var TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  function readJson(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; }
  }
  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }
  function toast(message, type, ms) {
    if (typeof window.showToast === 'function') window.showToast(message, type || 'info', ms || 5000);
    else window.alert(message);
  }
  function token() {
    return typeof window.getAuthToken === 'function' ? window.getAuthToken() : (localStorage.getItem('vs_token') || '');
  }
  function headers() {
    if (typeof window.authHeaders === 'function') return window.authHeaders();
    var h = { 'Content-Type': 'application/json' };
    if (token()) h.Authorization = 'Bearer ' + token();
    return h;
  }

  // First-touch attribution: kept until a new ref/utm arrives.
  function attribution() {
    var saved = readJson(ATTR_KEY) || {};
    var params = new URLSearchParams(window.location.search);
    var hasNew = ATTR_FIELDS.some(function (k) { return params.get(k); });
    if (hasNew) {
      saved = {};
      ATTR_FIELDS.forEach(function (k) { if (params.get(k)) saved[k] = params.get(k).slice(0, 100); });
      if (document.referrer && document.referrer.indexOf(window.location.origin) !== 0) saved.referrer = document.referrer;
      writeJson(ATTR_KEY, saved);
    } else if (!saved.referrer && document.referrer && document.referrer.indexOf(window.location.origin) !== 0) {
      saved.referrer = document.referrer;
      writeJson(ATTR_KEY, saved);
    }
    return saved;
  }
  function attrQuery() {
    var a = attribution();
    var q = new URLSearchParams();
    ATTR_FIELDS.forEach(function (k) { if (a[k]) q.set(k, a[k]); });
    return q.toString();
  }

  function saveDownload(url) {
    var a = document.createElement('a');
    a.href = url;
    a.rel = 'noopener';
    a.download = 'RoomGenix_staged.jpg';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function tryDownload(jobId) {
    var res = await fetch('/api/studio/download', { method: 'POST', headers: headers(), body: JSON.stringify({ job_id: jobId }) });
    var data = await res.json().catch(function () { return {}; });
    if (data.user && typeof window.setCurrentUser === 'function') window.setCurrentUser(data.user);
    if (res.ok && data.download_url) {
      saveDownload(data.download_url);
      localStorage.removeItem(JOB_KEY);
      toast('Your clean high-res file is downloading. It is also in your dashboard.', 'success', 6000);
      return 'downloaded';
    }
    return res.status === 402 ? 'needs_credit' : 'error:' + (data.message || 'Download failed.');
  }

  async function startCheckout() {
    var res = await fetch('/api/create-checkout', { method: 'POST', headers: headers(), body: JSON.stringify({ plan: 'single' }) });
    var data = await res.json().catch(function () { return {}; });
    if (res.ok && data.checkout_url) { window.location.href = data.checkout_url; return true; }
    toast(data.message || 'Checkout could not be opened. Email support@roomgenix.com.', 'error', 6000);
    return false;
  }

  // Saves the free try to the signed-in account, then downloads with a paid credit or opens the $2.99 checkout.
  async function claimAndBuy() {
    var t = readJson(TRY_KEY);
    var jobId = localStorage.getItem(JOB_KEY);
    if (!jobId && t) {
      var res = await fetch('/api/free-try/claim', {
        method: 'POST', headers: headers(), body: JSON.stringify({ try_id: t.try_id, claim_token: t.claim_token })
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok || !data.job_id) {
        if (res.status === 404 || res.status === 409) localStorage.removeItem(TRY_KEY);
        localStorage.removeItem(INTENT_KEY);
        toast(data.message || 'That free try could not be saved.', 'error', 6000);
        return;
      }
      jobId = data.job_id;
      localStorage.setItem(JOB_KEY, jobId);
      localStorage.removeItem(TRY_KEY);
    }
    localStorage.removeItem(INTENT_KEY);
    if (!jobId) return;
    var outcome = await tryDownload(jobId);
    if (outcome === 'needs_credit') await startCheckout();
    else if (outcome.indexOf('error:') === 0) toast(outcome.slice(6), 'error');
  }

  function getClean() {
    if (!readJson(TRY_KEY) && !localStorage.getItem(JOB_KEY)) {
      toast('Stage a photo first.', 'info');
      return;
    }
    localStorage.setItem(INTENT_KEY, String(Date.now()));
    if (!token()) {
      var q = attrQuery();
      window.location.href = '/dashboard?auth=signup&claim=free-try' + (q ? '&' + q : '');
      return;
    }
    claimAndBuy();
  }

  // After the Dodo return: confirm the payment, then download the clean file.
  async function finishAfterCheckout() {
    var params = new URLSearchParams(window.location.search);
    var jobId = localStorage.getItem(JOB_KEY);
    if (params.get('checkout') !== 'success' || !jobId || !token()) return;
    for (var i = 0; i < 6; i++) {
      try {
        await fetch('/api/checkout/confirm', { method: 'POST', headers: headers(), body: JSON.stringify({ session_id: params.get('session_id') || '' }) });
      } catch (_) {}
      var outcome = await tryDownload(jobId);
      if (outcome === 'downloaded') return;
      if (outcome !== 'needs_credit') { toast(outcome.slice(6), 'error'); return; }
      await new Promise(function (r) { setTimeout(r, 3000); });
    }
    toast('Payment is still processing. Your clean file will be in your dashboard renders in a minute.', 'info', 8000);
  }

  // After signup/login on the dashboard: wait for the session token, then continue the purchase.
  function resumeIntent() {
    var intent = Number(localStorage.getItem(INTENT_KEY) || 0);
    if (!intent || Date.now() - intent > 6 * 60 * 60 * 1000) { localStorage.removeItem(INTENT_KEY); return; }
    if (!readJson(TRY_KEY) && !localStorage.getItem(JOB_KEY)) { localStorage.removeItem(INTENT_KEY); return; }
    if (new URLSearchParams(window.location.search).get('checkout') === 'success') return;
    if (!token()) toast('Create a free account (or log in) to get your clean file for $2.99. Your staged photo is saved.', 'info', 7000);
    var started = Date.now();
    var timer = setInterval(function () {
      if (token()) { clearInterval(timer); claimAndBuy(); }
      else if (Date.now() - started > 30 * 60 * 1000) clearInterval(timer);
    }, 1000);
  }

  function showResult(root, data) {
    var result = root.querySelector('[data-ft-result]');
    var before = root.querySelector('[data-ft-before]');
    var after = root.querySelector('[data-ft-after]');
    if (before) before.src = data.before_url || '';
    if (after) after.src = data.preview_url;
    if (result) result.hidden = false;
    result && result.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function setStatus(root, text, kind) {
    var el = root.querySelector('[data-ft-status]');
    if (!el) return;
    el.textContent = text || '';
    el.dataset.kind = kind || '';
    el.hidden = !text;
  }

  function initForm() {
    var root = document.getElementById('try-free');
    if (!root) return;
    var form = root.querySelector('form');
    var input = root.querySelector('input[type="file"]');
    var button = root.querySelector('[data-ft-submit]');
    var nameEl = root.querySelector('[data-ft-filename]');
    var cta = root.querySelector('[data-ft-cta]');
    var signupLink = root.querySelector('[data-ft-signup]');
    if (signupLink) {
      var q = attrQuery();
      signupLink.href = '/dashboard?auth=signup' + (q ? '&' + q : '');
    }
    var previous = readJson(TRY_KEY);
    if (previous && previous.preview_url && Date.now() - (previous.at || 0) < 7 * 24 * 60 * 60 * 1000) {
      showResult(root, previous);
    }
    if (input) input.addEventListener('change', function () {
      var f = input.files && input.files[0];
      if (nameEl) nameEl.textContent = f ? f.name : 'No photo chosen';
    });
    if (cta) cta.addEventListener('click', getClean);
    if (!form) return;
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var f = input && input.files && input.files[0];
      if (!f) { setStatus(root, 'Choose a room photo first.', 'error'); return; }
      if (TYPES.indexOf(f.type) === -1) { setStatus(root, 'Use a JPG, PNG, or WEBP photo.', 'error'); return; }
      if (f.size > MAX_BYTES) { setStatus(root, 'The photo must be under 10 MB.', 'error'); return; }
      var fd = new FormData();
      fd.append('image', f);
      fd.append('room_type', form.elements.room_type.value);
      fd.append('style', form.elements.style.value);
      var a = attribution();
      ATTR_FIELDS.concat(['referrer']).forEach(function (k) { if (a[k]) fd.append(k, a[k]); });
      button.disabled = true;
      setStatus(root, 'Staging your photo. This takes about a minute, keep this tab open.', 'busy');
      try {
        var res = await fetch('/api/free-try', { method: 'POST', body: fd });
        var data = await res.json().catch(function () { return {}; });
        if (!res.ok || data.status !== 'success') {
          setStatus(root, data.message || 'Something went wrong. Try again.', res.status === 429 ? 'limit' : 'error');
          return;
        }
        writeJson(TRY_KEY, { try_id: data.try_id, claim_token: data.claim_token, preview_url: data.preview_url, before_url: data.before_url, at: Date.now() });
        localStorage.removeItem(JOB_KEY);
        setStatus(root, '', '');
        showResult(root, data);
      } catch (_) {
        setStatus(root, 'Could not reach the server. Check your connection and try again.', 'error');
      } finally {
        button.disabled = false;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    attribution();
    initForm();
    finishAfterCheckout();
    resumeIntent();
  });
  window.RoomGenixFreeTry = { getClean: getClean };
})();
