/* RoomGenix: "Try it free" on the homepage (free account required), plus the $2.99 clean-file hand-off.
   The render is started with one short request, then polled, so no request is held open for the render.
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

  var PENDING_KEY = 'rg_free_try_pending';
  var POLL_MS = 3000;
  var DEADLINE_MS = 120 * 1000;      // show an error + retry after about 2 minutes
  var RESUME_MS = 60 * 1000;         // extra wait when the visitor taps Try again on a slow render
  var state = { root: null, form: null, button: null, retry: null, file: null, room: 'living', style: 'modern', running: false, tryId: '', claimToken: '' };

  function fetchTimeout(url, opts, ms) {
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, ms) : null;
    if (ctl) opts.signal = ctl.signal;
    return fetch(url, opts).then(
      function (r) { if (timer) clearTimeout(timer); return r; },
      function (e) { if (timer) clearTimeout(timer); throw e; }
    );
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function authOnly() {
    var h = {};
    if (token()) h.Authorization = 'Bearer ' + token();
    return h;
  }

  function busy(on) {
    if (state.button) state.button.disabled = !!on;
    if (state.retry) state.retry.hidden = true;
    state.running = !!on;
  }
  function fail(message, kind, canRetry) {
    setStatus(state.root, message, kind || 'error');
    if (state.retry) state.retry.hidden = !canRetry;
    state.running = false;
    if (state.button) state.button.disabled = false;
  }

  // Polls until the render is done, failed, or the deadline passes. Network blips just retry.
  async function pollTry(tryId, claimToken, limitMs) {
    var started = Date.now();
    var misses = 0;
    while (Date.now() - started < limitMs) {
      var secs = Math.round((Date.now() - started) / 1000);
      setStatus(state.root, 'Staging your photo (' + secs + 's). This takes about a minute, keep this tab open.', 'busy');
      await sleep(POLL_MS);
      try {
        var res = await fetchTimeout('/api/free-try/' + encodeURIComponent(tryId), { headers: { 'X-Try-Token': claimToken, 'Cache-Control': 'no-cache' }, cache: 'no-store' }, 15000);
        var data = await res.json().catch(function () { return {}; });
        misses = 0;
        if (res.status === 404) return { state: 'failed', message: 'That try expired. Please try again.' };
        if (data.status === 'success' && data.preview_url) return { state: 'done', data: data };
        if (data.status === 'error') return { state: 'failed', message: data.message };
      } catch (_) {
        misses++;
        if (misses >= 6 && Date.now() - started > 30000) {
          setStatus(state.root, 'Connection looks unstable. Still checking your photo...', 'busy');
        }
      }
    }
    return { state: 'timeout' };
  }

  function finishDone(data) {
    var saved = { try_id: data.try_id || state.tryId, claim_token: state.claimToken, preview_url: data.preview_url, before_url: data.before_url, at: Date.now() };
    writeJson(TRY_KEY, saved);
    localStorage.removeItem(JOB_KEY);
    localStorage.removeItem(PENDING_KEY);
    setStatus(state.root, '', '');
    busy(false);
    showResult(state.root, saved);
  }

  async function watch(limitMs) {
    var out = await pollTry(state.tryId, state.claimToken, limitMs);
    if (out.state === 'done') return finishDone(out.data);
    if (out.state === 'failed') {
      localStorage.removeItem(PENDING_KEY);
      state.tryId = ''; state.claimToken = '';
      return fail(out.message || 'The render did not finish. Your free try was not used, so you can try again.', 'error', true);
    }
    // Timeout: the render may still finish, so Try again checks it once more before starting over.
    fail('This is taking longer than expected. Your free try has not been used up. Tap Try again.', 'error', true);
  }

  async function startTry() {
    var f = state.file;
    if (!f) return fail('Choose a room photo first.', 'error', false);
    if (!token()) return needLogin();
    var fd = new FormData();
    fd.append('image', f);
    fd.append('room_type', state.room);
    fd.append('style', state.style);
    var a = attribution();
    ATTR_FIELDS.concat(['referrer']).forEach(function (k) { if (a[k]) fd.append(k, a[k]); });
    busy(true);
    setStatus(state.root, 'Uploading your photo...', 'busy');
    var res, data;
    try {
      res = await fetchTimeout('/api/free-try', { method: 'POST', headers: authOnly(), body: fd }, 90000);
      data = await res.json().catch(function () { return {}; });
    } catch (_) {
      return fail('Could not upload your photo. Check your connection and tap Try again.', 'error', true);
    }
    if (res.status === 401) { busy(false); return needLogin(true); }
    if (res.status === 429) return fail(data.message || 'You have used your free try for today.', 'limit', false);
    if (!res.ok || !data.try_id) return fail(data.message || 'Something went wrong. Tap Try again.', 'error', true);
    state.tryId = data.try_id;
    state.claimToken = data.claim_token;
    writeJson(PENDING_KEY, { try_id: data.try_id, claim_token: data.claim_token, at: Date.now() });
    await watch(DEADLINE_MS);
  }

  // Logged out: open the signup modal; the chosen file and settings stay in memory and the try
  // starts right after sign-in, without leaving the page.
  function needLogin(expired) {
    setStatus(state.root, expired ? 'Please log in again to stage your photo.' : 'Create your free account (10 seconds) and we will stage this photo right away.', 'info');
    if (typeof window.openLoginModal === 'function') {
      window.openLoginModal('signup');
      var sub = document.getElementById('loginModalSub');
      if (sub) sub.textContent = 'Sign up in 10 seconds and your free staging starts right away.';
    } else {
      var q = attrQuery();
      window.location.href = '/dashboard?auth=signup' + (q ? '&' + q : '');
    }
  }

  function onAuthed() {
    if (!state.file || state.running || !state.root) return false;
    setTimeout(startTry, 50);
    return true;
  }

  function retryTry() {
    if (state.running) return;
    if (state.tryId) { busy(true); watch(RESUME_MS); return; }
    startTry();
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
    state.root = root; state.form = form; state.button = button;
    state.retry = root.querySelector('[data-ft-retry]');
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
    if (state.retry) state.retry.addEventListener('click', retryTry);
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (state.running) return;
      var f = input && input.files && input.files[0];
      if (!f) { setStatus(root, 'Choose a room photo first.', 'error'); return; }
      if (TYPES.indexOf(f.type) === -1) { setStatus(root, 'Use a JPG, PNG, or WEBP photo.', 'error'); return; }
      if (f.size > MAX_BYTES) { setStatus(root, 'The photo must be under 10 MB.', 'error'); return; }
      state.file = f;
      state.room = form.elements.room_type.value;
      state.style = form.elements.style.value;
      state.tryId = ''; state.claimToken = '';
      if (state.retry) state.retry.hidden = true;
      if (!token()) { needLogin(); return; }
      startTry();
    });
    // A reload mid-render resumes watching the same try instead of losing it.
    var pend = readJson(PENDING_KEY);
    if (pend && pend.try_id && pend.claim_token && Date.now() - (pend.at || 0) < 4 * 60 * 1000) {
      state.tryId = pend.try_id; state.claimToken = pend.claim_token;
      busy(true);
      watch(DEADLINE_MS);
    } else {
      localStorage.removeItem(PENDING_KEY);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    attribution();
    initForm();
    finishAfterCheckout();
    resumeIntent();
  });
  window.RoomGenixFreeTry = { getClean: getClean, onAuthed: onAuthed };
})();
