/* ==========================================================================
   Roomgenix – Application Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initHamburger();
  initSlider();
  initUploadZone();
  initModalClickOutside();
  initLegalModal();
  initMLSStamp();
  initScrollReveal();
  initAnimatedCounters();
  initStickyCta();
  loadHeroRoom('living');
  initThumbRibbon();
  initShowcaseCards();
  selectGalleryStyle('modern', null);
  syncStyleChoices();
  updateStudioStatus();
  initAuth().then(() => {
    applyStudioQuery();
    confirmCheckoutReturn();
  });
  initCheckoutRadios();
  initConcierge();
  refreshDownloadButton();
});

// --- SCROLL REVEAL ---
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px'
  });

  reveals.forEach(el => observer.observe(el));
}


// --- SAMPLE IMAGE MAP & METRICS ---
const roomImages = {
  living: {
    title: 'Open-Concept Modern Living Room',
    category: 'Vacant Staging · Living Area',
    badge: 'Open-Concept Living',
    buyerLine: 'An empty living room photographs smaller than it is. Furniture shows a buyer that the sofa fits and that the view is the point of the room.',
    edge: 'One living-room photo is $2.99. A staging visit usually starts around $2,500.',
    before: 'assets/hero_empty.jpg',
    after: 'assets/hero_coastal.jpg',
    daysOnMarket: '9 Days',
    benchmark: 'vs 46 MLS avg',
    overAsking: '+$22,500',
    roi: '1,148x ROI',
    savings: '$2,800 saved vs physical',
    agentName: 'Sarah Jenkins',
    agentBrokerage: 'Keller Williams Beverly Hills',
    agentQuote: 'Photograph the empty room, then stage that same frame. The windows should line up when a buyer drags across the photo.'
  },
  bedroom: {
    title: 'Primary Master Suite',
    category: 'Vacant Staging · Master Suite',
    badge: 'Primary suite',
    buyerLine: 'Buyers rank the primary bedroom just behind the kitchen. A made bed and nightstands make a vacant suite feel like a place to sleep, not a white box.',
    edge: 'BoxBrownie charges about $24 and a day for this same shot. You can restage the suite before the listing appointment ends.',
    before: 'assets/bedroom_empty.jpg',
    after: 'assets/bedroom_scandinavian.jpg',
    daysOnMarket: '12 Days',
    benchmark: 'vs 42 MLS avg',
    overAsking: '+$18,000',
    roi: '918x ROI',
    savings: '$1,900 saved vs physical',
    agentName: 'David Marcus',
    agentBrokerage: 'Compass Real Estate',
    agentQuote: 'A made bed and two nightstands are enough. Buyers are checking whether the suite feels like a place to sleep.'
  },
  dining: {
    title: 'Executive Entertaining Dining Room',
    category: 'Vacant Staging · Dining & Kitchen',
    badge: 'Entertaining hub',
    buyerLine: 'Buyers ask whether a real table fits. Setting eight chairs answers that on the listing, before anyone drives over.',
    edge: 'A physical stager spends a day moving a table in. This photo does that job for under $2.',
    before: 'assets/dining_empty.jpg',
    after: 'assets/dining_staged.jpg',
    daysOnMarket: '8 Days',
    benchmark: 'vs 39 MLS avg',
    overAsking: '+$27,000',
    roi: '1,377x ROI',
    savings: '$2,400 saved vs physical',
    agentName: 'Elena Rostova',
    agentBrokerage: 'Sotheby’s International Realty',
    agentQuote: 'Set the table with the number of chairs that actually fit. That is the question buyers ask before they drive over.'
  },
  office: {
    title: 'Executive Work-From-Home Office',
    category: 'Flex Space · Remote Workspace',
    badge: 'Top buyer filter',
    buyerLine: 'Home office is one of the first filters buyers turn on. Showing the extra room as a desk, not an empty spare, keeps the listing in that search.',
    edge: 'Editors bill this as a separate room and a separate wait. Here it is the same 15-second credit.',
    before: 'assets/office_empty.jpg',
    after: 'assets/office_staged.jpg',
    daysOnMarket: '11 Days',
    benchmark: 'vs 48 MLS avg',
    overAsking: '+$19,500',
    roi: '994x ROI',
    savings: '$2,100 saved vs physical',
    agentName: 'Marcus Vance',
    agentBrokerage: 'eXp Realty Silicon Valley',
    agentQuote: 'If the spare room is the home office, show a desk. An empty room drops out of that search filter.'
  },
  twilight: {
    title: 'Virtual Twilight / Day-to-Dusk Exterior',
    category: 'Curb Appeal · Exterior Lighting',
    badge: 'Stronger hero photo',
    buyerLine: 'A flat noon exterior is easy to scroll past. Warm windows and a dusk sky make the same house the photo people stop on.',
    edge: 'A second twilight photo shoot is often $350. This conversion is a $14 add-on on a photo you already have. Brokerage plans include it.',
    before: 'assets/twilight_day.jpg',
    after: 'assets/twilight_dusk.jpg',
    daysOnMarket: '6 Days',
    benchmark: 'vs 51 MLS avg',
    overAsking: '+$31,000',
    roi: '1,581x ROI',
    savings: '$350 saved vs dusk photo',
    agentName: 'Amanda Ruiz',
    agentBrokerage: 'RE/MAX Premier',
    agentQuote: 'Use this when the exterior was shot at noon. It is the same house, with the light moved to dusk. Say so on the listing.'
  },
  declutter: {
    title: 'Tenant Item Removal & Decluttering',
    category: 'Pre-Listing · Digital Deep Clean',
    badge: 'Occupied listing',
    buyerLine: 'Boxes and laundry tell buyers the house is a project. Removing the mess keeps the real sofa and the real floor, so the listing looks ready without a pack-out.',
    edge: 'Waiting for tenants to move delays the listing. A removal credit lets you photograph now and publish a clean room the same day.',
    before: 'assets/declutter_before.jpg',
    after: 'assets/declutter_after.jpg',
    daysOnMarket: '14 Days',
    benchmark: 'vs 68 MLS avg',
    overAsking: '+$15,000',
    roi: '765x ROI',
    savings: '$1,500 saved in delays',
    agentName: 'Michael Chang',
    agentBrokerage: 'Coldwell Banker Realty',
    agentQuote: 'Remove the boxes and leave the real sofa. Buyers should still recognize the room they walk into.'
  },
  patio: {
    title: 'Outdoor living patio',
    category: 'Outdoor Living · Daylight seating',
    badge: 'Outdoor living',
    buyerLine: 'A bare slab reads as unused yard. A sectional, chairs, and a dining table show the outdoor room a buyer is paying for, in the same daylight as the original photo.',
    edge: 'Outdoor rental staging is one of the most expensive rooms to do physically. This shot is still one image credit.',
    before: 'assets/patio_empty.jpg',
    after: 'assets/patio_staged.jpg?v=2',
    daysOnMarket: '7 Days',
    benchmark: 'vs 44 MLS avg',
    overAsking: '+$35,000',
    roi: '1,785x ROI',
    savings: '$3,200 saved vs outdoor rental',
    agentName: 'Jessica Thornton',
    agentBrokerage: 'The Corcoran Group',
    agentQuote: 'A bare patio reads as unused yard. Daylight seating shows the outdoor room. You do not have to rent furniture that sits in the weather.'
  },
  renovation: {
    title: 'Virtual Remodel & Architectural Renovation',
    category: 'Fixer-Upper · As-Is Renovation Vision',
    badge: 'Renovation vision',
    buyerLine: 'Dated paneling makes buyers price in a remodel. A virtual refresh shows the potential while the listing stays honest that the work is not done yet.',
    edge: 'A real remodel quote can push a seller to cut price. This photo lets them show the vision and keep the as-is number.',
    before: 'assets/reno_before.jpg',
    after: 'assets/reno_after.jpg',
    daysOnMarket: '15 Days',
    benchmark: 'vs 74 MLS avg',
    overAsking: '+$42,000',
    roi: '2,142x ROI',
    savings: '$65,000 saved vs remodel',
    agentName: 'Robert Sterling',
    agentBrokerage: 'Berkshire Hathaway HomeServices',
    agentQuote: 'A virtual refresh shows what the room could become. The listing still needs to say the work is not done.'
  }
};

const stylePresets = {
  modern: {
    title: "Modern",
    desc: "A low sofa, a light wood table, one large rug. Fits new construction and condos with big windows.",
    palette: ["#FFFFFF", "#E2E8F0", "#1E293B", "#B89B72"],
    bestFor: "Condos and new construction"
  },
  scandinavian: {
    title: "Scandinavian",
    desc: "Pale wood, a linen sofa, and not much else. Good when the room is already bright.",
    palette: ["#FAF8F5", "#E8DFD8", "#64748B", "#8C7A6B"],
    bestFor: "Bright rooms and lofts"
  },
  farmhouse: {
    title: "Farmhouse",
    desc: "Wood table, softer textiles, warmer metal. Useful on older suburban houses.",
    palette: ["#F5F5F0", "#D6C7B2", "#2B2B2A", "#8A5A36"],
    bestFor: "Older suburban houses"
  },
  coastal: {
    title: "Coastal",
    desc: "Lighter wood, a pale sofa, and a bit of blue. For houses that already face water or a lot of sky.",
    palette: ["#FFFFFF", "#EFF6FF", "#93C5FD", "#D4C5B9"],
    bestFor: "Houses with a view"
  },
  luxury: {
    title: "Darker living room",
    desc: "A dark sofa, a stone table, brass lamp. For listings where the finish level is already high.",
    palette: ["#111827", "#F8FAFC", "#CA8A04", "#713F12"],
    bestFor: "Higher-finish listings"
  },
  midcentury: {
    title: "Mid-century",
    desc: "Walnut, a tapered sofa, a wool rug. Fits houses from the 1950s through the 1970s.",
    palette: ["#4A2E18", "#E69A39", "#2E5244", "#EAE6DF"],
    bestFor: "Mid-century houses"
  }
};

let currentRoom = 'living';
let studioJob = 'stage';
let galleryRoom = 'living';
let galleryStyle = 'modern';
let currentStyle = 'modern';
let currentSliderPct = 50;
let isDraggingSlider = false;
let galleryViewMode = 'slider';
let isHoldingBefore = false;
let isShowingBefore = false;
let isUserPhoto = false;
let userUploadedPhoto = null;
let userUploadedFile = null;
let uploadedCloudUrl = '';

// --- NAVBAR SCROLL ---
function initNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  const update = () => {
    nav.classList.toggle('scrolled', window.scrollY > 10);
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

// --- HAMBURGER ---
function initHamburger() {
  const btn = document.getElementById('hamburger');
  const drawer = document.getElementById('mobileDrawer');
  if (!btn || !drawer) return;

  const closeDrawer = () => {
    drawer.classList.remove('open');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  };

  btn.addEventListener('click', () => {
    const isOpen = drawer.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', isOpen);
  });

  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      closeDrawer();
    });
  });

  document.addEventListener('click', (e) => {
    if (!drawer.classList.contains('open')) return;
    if (drawer.contains(e.target) || btn.contains(e.target)) return;
    closeDrawer();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });

  drawer.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeDrawer);
  });
}

// --- HERO BEFORE/AFTER SLIDER (POINTER & TOUCH OPTIMIZED) ---
function initSlider() {
  const container = document.getElementById('heroSlider');
  const handle = document.getElementById('sliderHandle');
  if (!container || !handle) return;

  const before = document.getElementById('beforeImage');
  const hint = document.getElementById('sliderHint');

  function updateSlider(pct) {
    pct = Math.max(0, Math.min(100, pct));
    currentSliderPct = pct;
    if (before && galleryViewMode === 'slider') {
      before.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
      before.style.webkitClipPath = `inset(0 ${100 - pct}% 0 0)`;
    }
    if (handle) {
      handle.style.left = pct + '%';
      handle.setAttribute('aria-valuenow', Math.round(pct));
    }
    if (hint && !hint.classList.contains('hidden')) {
      hint.classList.add('hidden');
    }
  }

  function handlePointer(clientX) {
    const rect = container.getBoundingClientRect();
    if (!rect.width) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    updateSlider(pct);
  }

  // Pointer events with pointer capture for buttery 120Hz smooth dragging
  container.addEventListener('pointerdown', (e) => {
    if (galleryViewMode !== 'slider') return;
    isDraggingSlider = true;
    try { container.setPointerCapture(e.pointerId); } catch (_) {}
    handlePointer(e.clientX);
  });

  container.addEventListener('pointermove', (e) => {
    if (isDraggingSlider && galleryViewMode === 'slider') {
      handlePointer(e.clientX);
      if (e.cancelable) e.preventDefault();
    }
  });

  const stopSliderDrag = (e) => {
    if (isDraggingSlider) {
      isDraggingSlider = false;
      try { container.releasePointerCapture(e.pointerId); } catch (_) {}
    }
  };
  container.addEventListener('pointerup', stopSliderDrag);
  container.addEventListener('pointercancel', stopSliderDrag);

  // Fallback mouse & touch listeners
  window.addEventListener('mouseup', () => { isDraggingSlider = false; });
  window.addEventListener('touchend', () => { isDraggingSlider = false; });

  // Keyboard accessibility
  if (handle) {
    handle.addEventListener('keydown', (e) => {
      if (galleryViewMode !== 'slider') return;
      if (e.key === 'ArrowLeft') {
        updateSlider(currentSliderPct - 4);
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        updateSlider(currentSliderPct + 4);
        e.preventDefault();
      }
    });
  }

  // Initial set
  updateSlider(50);
}

// --- GALLERY VIEW MODES (SLIDER / SIDE-BY-SIDE / TOGGLE) ---
function setGalleryViewMode(mode, btnEl) {
  galleryViewMode = mode;
  const container = document.getElementById('heroSlider');
  const handle = document.getElementById('sliderHandle');
  const before = document.getElementById('beforeImage');
  const toggleBtn = document.getElementById('holdCompareBtn');
  const hint = document.getElementById('sliderHint');

  document.querySelectorAll('.gallery-mode-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

  if (container) {
    container.classList.remove('mode-slider', 'mode-side', 'mode-toggle');
    container.classList.add('mode-' + mode);
  }

  if (mode === 'slider') {
    if (before) {
      before.style.clipPath = `inset(0 ${100 - currentSliderPct}% 0 0)`;
      before.style.webkitClipPath = `inset(0 ${100 - currentSliderPct}% 0 0)`;
      before.style.opacity = '1';
    }
    if (handle) handle.style.display = 'flex';
    if (toggleBtn) toggleBtn.style.display = 'none';
  } else if (mode === 'side') {
    if (before) {
      before.style.clipPath = 'none';
      before.style.webkitClipPath = 'none';
      before.style.opacity = '1';
    }
    if (handle) handle.style.display = 'none';
    if (toggleBtn) toggleBtn.style.display = 'none';
    if (hint) hint.classList.add('hidden');
  } else if (mode === 'toggle') {
    if (handle) handle.style.display = 'none';
    if (before) {
      before.style.clipPath = 'none';
      before.style.webkitClipPath = 'none';
      before.style.opacity = '0';
    }
    if (toggleBtn) toggleBtn.style.display = 'inline-flex';
    if (hint) hint.classList.add('hidden');
  }
}

function setHoldState(state) {
  isHoldingBefore = state;
  const before = document.getElementById('beforeImage');
  const label = document.getElementById('holdBtnLabel');
  if (before && galleryViewMode === 'toggle') {
    before.style.opacity = state ? '1' : '0';
  }
  if (label) {
    label.textContent = state ? 'Showing: Original Vacant Room' : 'Hold to View Vacant Room';
  }
}

// --- HERO ROOM SWITCHER ---
function switchHeroRoom(room, btnEl) {
  const data = roomImages[room];
  if (!data) return;

  const afterEl = document.getElementById('afterImage');
  const beforeEl = document.getElementById('beforeImage');
  setGalleryPhoto(beforeEl, data.before, 'Before staging: ' + data.title);
  setGalleryPhoto(afterEl, data.after, 'After staging: ' + data.title);

  // Update tabs
  document.querySelectorAll('.gallery-tab').forEach(t => {
    const isTarget = t.getAttribute('data-room') === room || (btnEl && t === btnEl);
    t.classList.toggle('active', isTarget);
  });

  // Update thumbnail ribbon cards
  document.querySelectorAll('.gallery-thumb-card').forEach(c => {
    c.classList.toggle('active', c.getAttribute('data-room') === room);
  });

  // Update showcase cards active highlight
  document.querySelectorAll('.showcase-card').forEach(sc => {
    sc.classList.toggle('active-in-theater', sc.getAttribute('data-room') === room);
  });

  // Update dynamic metric strip & room details
  const titleEl = document.getElementById('galleryRoomTitle');
  if (titleEl) titleEl.textContent = data.title;

  const catEl = document.getElementById('galleryRoomCat');
  if (catEl) catEl.textContent = data.category;

  const badgeEl = document.getElementById('galleryRoomBadge');
  if (badgeEl) badgeEl.textContent = data.badge;

  const buyerEl = document.getElementById('galleryBuyerLine');
  if (buyerEl && data.buyerLine) buyerEl.textContent = data.buyerLine;

  const edgeEl = document.getElementById('galleryEdge');
  if (edgeEl && data.edge) edgeEl.textContent = data.edge;

  const domEl = document.getElementById('galleryDom');
  if (domEl) domEl.textContent = data.daysOnMarket;

  const benchEl = document.getElementById('galleryDomBench');
  if (benchEl) benchEl.textContent = data.benchmark;

  const overEl = document.getElementById('galleryOverAsk');
  if (overEl) overEl.textContent = data.overAsking;

  const roiEl = document.getElementById('galleryRoi');
  if (roiEl) roiEl.textContent = data.roi;

  const savingsEl = document.getElementById('gallerySavings');
  if (savingsEl) savingsEl.textContent = data.savings;

  const quoteEl = document.getElementById('galleryQuoteText');
  if (quoteEl) quoteEl.textContent = data.agentQuote;

  const nameEl = document.getElementById('galleryAgentName');
  if (nameEl) nameEl.textContent = data.agentName;

  const brokerEl = document.getElementById('galleryAgentBroker');
  if (brokerEl) brokerEl.textContent = data.agentBrokerage;

  galleryRoom = room;
  paintGalleryStyle();
  syncStyleChoices();
}

function loadHeroRoom(room) {
  switchHeroRoom(room || 'living', null);
}

// --- GALLERY STYLE PRESET SELECTOR ---
function uniqueStyles(room) {
  const order = ['modern', 'scandinavian', 'farmhouse', 'coastal', 'luxury', 'midcentury'];
  const byPhoto = new Map();
  for (const style of order) {
    const photo = styleImages[room] && styleImages[room][style];
    if (!photo) continue;
    const named = photo.toLowerCase().includes(style);
    const current = byPhoto.get(photo);
    if (!current || (named && !current.named)) byPhoto.set(photo, { style, named });
  }
  const kept = [...byPhoto.values()].map(item => item.style);
  return kept.length ? kept : ['modern'];
}

function styleKeyFrom(btn) {
  return btn.getAttribute('data-style') || ((btn.getAttribute('onclick') || '').match(/'([a-z]+)'/) || [])[1] || '';
}

function syncStyleChoices() {
  const room = isDashboardPage() ? currentRoom : (galleryRoom || 'living');
  const keep = uniqueStyles(room);
  document.querySelectorAll('.style-option, .style-chip').forEach(btn => {
    const style = styleKeyFrom(btn);
    if (!style) return;
    const show = keep.includes(style);
    btn.hidden = !show;
    if (!show) btn.classList.remove('active');
  });
  if (isDashboardPage()) {
    document.querySelectorAll('.style-option').forEach(btn => { btn.hidden = false; });
    updateStudioStatus();
    updateEditorChrome();
    return;
  }
  if (!keep.includes(galleryStyle)) {
    galleryStyle = keep[0];
    document.querySelectorAll('.style-chip').forEach(el => el.classList.toggle('active', styleKeyFrom(el) === galleryStyle));
    paintGalleryStyle();
    const preset = stylePresets[galleryStyle];
    const titleEl = document.getElementById('stylePresetTitle');
    const descEl = document.getElementById('stylePresetDesc');
    const bestEl = document.getElementById('stylePresetBest');
    if (preset && titleEl) titleEl.textContent = preset.title;
    if (preset && descEl) descEl.textContent = preset.desc;
    if (preset && bestEl) bestEl.textContent = 'Best for: ' + preset.bestFor;
  }
}

function selectGalleryStyle(style, btnEl) {
  const keep = uniqueStyles(galleryRoom || 'living');
  if (!keep.includes(style)) style = keep[0];
  galleryStyle = style;
  document.querySelectorAll('.style-chip').forEach(c => c.classList.remove('active'));
  const chip = btnEl || document.querySelector(`.style-chip[onclick*="'${style}'"]`);
  if (chip) chip.classList.add('active');

  const preset = stylePresets[style];
  if (!preset) return;

  const titleEl = document.getElementById('stylePresetTitle');
  const descEl = document.getElementById('stylePresetDesc');
  const bestEl = document.getElementById('stylePresetBest');
  const paletteEl = document.getElementById('stylePresetPalette');

  if (titleEl) titleEl.textContent = preset.title;
  if (descEl) descEl.textContent = preset.desc;
  if (bestEl) bestEl.textContent = 'Best for: ' + preset.bestFor;
  if (paletteEl && preset.palette) {
    paletteEl.innerHTML = preset.palette.map(c => 
      `<span class="palette-swatch" style="background-color: ${c};" title="${c}"></span>`
    ).join('');
  }

  paintGalleryStyle();
}

function setGalleryPhoto(el, url, alt) {
  if (!el || !url) return;
  if (el.tagName === 'IMG') {
    el.src = url;
    if (alt) el.alt = alt;
  } else {
    el.style.backgroundImage = `url('${url}')`;
  }
}

function paintGalleryStyle() {
  const afterEl = document.getElementById('afterImage');
  if (!afterEl) return;
  const photo = styleImages[galleryRoom] && styleImages[galleryRoom][galleryStyle];
  const fallback = roomImages[galleryRoom]?.after || 'assets/hero_coastal.jpg';
  const title = roomImages[galleryRoom]?.title || 'room';
  setGalleryPhoto(afterEl, photo || fallback, 'After staging: ' + title);
}

// --- SHOWCASE BENTO GRID INITIALIZER (POINTER DRAG OPTIMIZED) ---
function initShowcaseCards() {
  document.querySelectorAll('.showcase-card').forEach(card => {
    const slider = card.querySelector('.showcase-slider');
    const beforeImg = card.querySelector('.showcase-before');
    const handle = card.querySelector('.showcase-handle');
    if (!slider || !beforeImg || !handle) return;

    let isDragging = false;
    function update(clientX) {
      const rect = slider.getBoundingClientRect();
      if (!rect.width) return;
      const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      beforeImg.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
      beforeImg.style.webkitClipPath = `inset(0 ${100 - pct}% 0 0)`;
      handle.style.left = pct + '%';
    }

    slider.addEventListener('pointerdown', (e) => {
      isDragging = true;
      try { slider.setPointerCapture(e.pointerId); } catch (_) {}
      update(e.clientX);
      e.preventDefault();
    });

    slider.addEventListener('pointermove', (e) => {
      if (isDragging) {
        update(e.clientX);
      }
    });

    const stopDrag = (e) => {
      if (isDragging) {
        isDragging = false;
        try { slider.releasePointerCapture(e.pointerId); } catch (_) {}
      }
    };
    slider.addEventListener('pointerup', stopDrag);
    slider.addEventListener('pointercancel', stopDrag);
  });
}

// --- THUMBNAIL RIBBON KEYBOARD ACCESSIBILITY ---
function initThumbRibbon() {
  document.querySelectorAll('.gallery-thumb-card').forEach(card => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const room = card.getAttribute('data-room');
        if (room) switchHeroRoom(room, card);
        e.preventDefault();
      }
    });
  });
}

function inspectRoomInTheater(room) {
  switchHeroRoom(room, null);
  const hero = document.getElementById('heroSlider');
  if (hero) {
    hero.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    scrollToSection('gallery');
  }
}

function goToStudio(room) {
  const job = room === 'twilight' ? 'twilight' : room === 'declutter' ? 'declutter' : 'stage';
  const params = new URLSearchParams();
  params.set('job', job);
  if (['living', 'bedroom', 'dining', 'office'].includes(room)) params.set('room', room);
  window.location.href = '/dashboard?' + params.toString();
}

function stageRoomInStudio(room) {
  goToStudio(room);
}

// --- GALLERY ACTION HANDLERS ---
function stageThisGalleryRoom() {
  goToStudio(galleryRoom);
}

function openStudioRoom(room) {
  goToStudio(room);
}

function downloadActiveGallerySample() {
  const data = roomImages[galleryRoom] || roomImages['living'];
  const a = document.createElement('a');
  a.href = data.after;
  a.download = `Roomgenix_example_${currentRoom}.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast(`Downloaded the example for ${data.title}`);
}

// --- PHOTOREALISTIC DESIGN STYLE IMAGE MAP ---
const styleImages = {
  living: {
    modern: 'assets/hero_coastal.jpg',
    scandinavian: 'assets/hero_scandinavian.jpg',
    farmhouse: 'assets/hero_farmhouse.jpg',
    coastal: 'assets/hero_coastal.jpg',
    luxury: 'assets/hero_coastal.jpg',
    midcentury: 'assets/hero_farmhouse.jpg'
  },
  bedroom: {
    modern: 'assets/bedroom_scandinavian.jpg',
    scandinavian: 'assets/bedroom_scandinavian.jpg',
    farmhouse: 'assets/bedroom_farmhouse.jpg',
    coastal: 'assets/bedroom_scandinavian.jpg',
    luxury: 'assets/bedroom_scandinavian.jpg',
    midcentury: 'assets/bedroom_farmhouse.jpg'
  },
  dining: {
    modern: 'assets/dining_staged.jpg',
    scandinavian: 'assets/dining_staged.jpg',
    farmhouse: 'assets/dining_staged.jpg',
    coastal: 'assets/dining_staged.jpg'
  },
  office: {
    modern: 'assets/office_staged.jpg',
    scandinavian: 'assets/office_staged.jpg',
    farmhouse: 'assets/office_staged.jpg',
    coastal: 'assets/office_staged.jpg'
  },
  twilight: {
    modern: 'assets/twilight_dusk.jpg',
    scandinavian: 'assets/twilight_dusk.jpg',
    farmhouse: 'assets/twilight_dusk.jpg',
    coastal: 'assets/twilight_dusk.jpg'
  },
  declutter: {
    modern: 'assets/declutter_after.jpg',
    scandinavian: 'assets/declutter_after.jpg',
    farmhouse: 'assets/declutter_after.jpg',
    coastal: 'assets/declutter_after.jpg'
  },
  patio: {
    modern: 'assets/patio_staged.jpg?v=2',
    scandinavian: 'assets/patio_staged.jpg?v=2',
    farmhouse: 'assets/patio_staged.jpg?v=2',
    coastal: 'assets/patio_staged.jpg?v=2'
  },
  renovation: {
    modern: 'assets/reno_after.jpg',
    scandinavian: 'assets/reno_after.jpg',
    farmhouse: 'assets/reno_after.jpg',
    coastal: 'assets/reno_after.jpg'
  }
};

function getStagedImageForRoom(room, style) {
  if (styleImages[room] && styleImages[room][style]) {
    return styleImages[room][style];
  }
  if (roomImages[room] && roomImages[room].after) {
    return roomImages[room].after;
  }
  return 'assets/hero_coastal.jpg';
}

// --- STUDIO: SAMPLE LOADER ---
function loadSample(room, btnEl) {
  isUserPhoto = false;
  userUploadedPhoto = null;
  userUploadedFile = null;
  uploadedCloudUrl = '';
  sourceJobId = null;
  preserveStudioImage = false;
  currentRoom = room;

  const img = document.getElementById('stagedImageDisplay');
  const resultBox = document.getElementById('resultBox');

  if (img) {
    img.src = getStagedImageForRoom(room, currentStyle);
  }

  if (resultBox) {
    resultBox.className = `canvas-image-wrap style-filter-${currentStyle}`;
  }

  document.querySelectorAll('.sidebar-pills .pill').forEach(p => {
    const isTarget = p === btnEl || p.getAttribute('data-room') === room;
    p.classList.toggle('active', isTarget);
  });

  // Reset compare state
  isShowingBefore = false;
  const cb = document.getElementById('studioCompareBtn');
  if (cb) cb.classList.remove('active');
  updateStudioStatus();
  updateEditorChrome();
  syncStyleChoices();
}

// --- STUDIO: STYLE SELECTOR ---
function selectStyle(style, btnEl) {
  currentStyle = style;

  document.querySelectorAll('.style-grid .style-option').forEach(o => o.classList.remove('active'));
  if (btnEl) {
    btnEl.classList.add('active');
  } else {
    const matchingBtn = document.querySelector(`.style-grid .style-option[onclick*="'${style}'"]`);
    if (matchingBtn) matchingBtn.classList.add('active');
  }

  const img = document.getElementById('stagedImageDisplay');
  const resultBox = document.getElementById('resultBox');

  if (resultBox && !isDashboardPage()) {
    resultBox.className = `canvas-image-wrap style-filter-${style}`;
  }

  if (preserveStudioImage || (isDashboardPage() && ownsStudioPhoto())) {
    updateStudioStatus();
    updateEditorChrome();
    return;
  }

  if (isUserPhoto) {
    if (img && userUploadedPhoto) img.src = userUploadedPhoto;
    isShowingBefore = false;
    const cb = document.getElementById('studioCompareBtn');
    if (cb) cb.classList.remove('active');
    updateStudioStatus();
    updateEditorChrome();
    showToast(`Applied ${style.charAt(0).toUpperCase() + style.slice(1)} aesthetic to uploaded photo!`);
    return;
  }

  if (img) {
    img.src = getStagedImageForRoom(currentRoom, style);
  }

  isShowingBefore = false;
  const cb = document.getElementById('studioCompareBtn');
  if (cb) cb.classList.remove('active');

  updateStudioStatus();
  updateEditorChrome();
  showToast(`Switched design style to ${style.charAt(0).toUpperCase() + style.slice(1)}!`);
}

// --- STUDIO: COMPARE ---
function toggleStudioCompare() {
  isShowingBefore = !isShowingBefore;
  const img = document.getElementById('stagedImageDisplay');
  const btn = document.getElementById('studioCompareBtn');
  const resultBox = document.getElementById('resultBox');
  if (!img) return;

  if (isUserPhoto) {
    if (isShowingBefore) {
      if (resultBox) resultBox.className = 'canvas-image-wrap style-filter-none';
      if (btn) btn.classList.add('active');
    } else {
      if (resultBox) resultBox.className = `canvas-image-wrap style-filter-${currentStyle}`;
      if (btn) btn.classList.remove('active');
    }
    updateStudioStatus();
    return;
  }

  if (isShowingBefore) {
    img.src = roomImages[currentRoom]?.before || img.src;
    if (resultBox) resultBox.className = 'canvas-image-wrap style-filter-none';
    if (btn) btn.classList.add('active');
  } else {
    img.src = getStagedImageForRoom(currentRoom, currentStyle);
    if (resultBox) resultBox.className = `canvas-image-wrap style-filter-${currentStyle}`;
    if (btn) btn.classList.remove('active');
  }
  updateStudioStatus();
}

// --- STUDIO: STAGING SIMULATION ---
let stageButtonHtml = '';
let currentStudioJob = null;
let sourceJobId = null;
let preserveStudioImage = false;
let accountJobs = [];

function isDashboardPage() {
  return document.body.dataset.page === 'dashboard';
}

function showAccount() {
  const app = document.getElementById('accountApp');
  if (app) app.hidden = false;
  applyStudioQuery();
}

function applyStudioQuery() {
  if (!isDashboardPage()) return;
  const params = new URLSearchParams(window.location.search);
  const job = params.get('job');
  const room = params.get('room');
  if (job === 'declutter' || job === 'twilight') {
    const btn = document.querySelector(`.job-choice[data-job="${job}"]`);
    selectStudioJob(job, btn);
    return;
  }
  if (room && ['living', 'bedroom', 'dining', 'office'].includes(room)) {
    const pill = document.querySelector(`.sidebar-pills .pill[data-room="${room}"]`);
    loadSample(room, pill);
  }
  if (job === 'stage') {
    const btn = document.querySelector('.job-choice[data-job="stage"]');
    document.querySelectorAll('.job-choice').forEach(button => {
      button.classList.toggle('active', button === btn);
    });
    const options = document.getElementById('stageOptions');
    if (options) options.hidden = false;
    syncStyleChoices();
  }
}

function isExampleUrl(url) {
  const value = String(url || '');
  return value.startsWith('assets/') || value.includes('/assets/');
}

function hasOwnPhoto() {
  if (isUserPhoto && userUploadedFile) return true;
  if (isUserPhoto && uploadedCloudUrl && !isExampleUrl(uploadedCloudUrl)) return true;
  if (!sourceJobId) return false;
  const job = accountJobs.find(item => item.id === sourceJobId);
  if (!job) return true;
  return job.source !== 'sample' && !isExampleUrl(job.image_url) && !isExampleUrl(job.before_url);
}

function ownsStudioPhoto() {
  return isUserPhoto || preserveStudioImage || Boolean(userUploadedFile);
}

function selectStudioRoom(room, btnEl) {
  if (isDashboardPage() && ownsStudioPhoto()) {
    currentRoom = room;
    document.querySelectorAll('.sidebar-pills .pill').forEach(p => {
      p.classList.toggle('active', p === btnEl || p.getAttribute('data-room') === room);
    });
    updateStudioStatus();
    updateEditorChrome();
    return;
  }
  loadSample(room, btnEl);
}

function selectStudioJob(job, btnEl) {
  studioJob = job === 'twilight' || job === 'declutter' ? job : 'stage';
  document.querySelectorAll('.job-choice').forEach(button => {
    button.classList.toggle('active', button === btnEl || button.getAttribute('data-job') === studioJob);
  });
  const options = document.getElementById('stageOptions');
  const roomField = document.getElementById('roomOptions');
  const styleField = document.getElementById('styleOptions');
  const showRooms = studioJob !== 'twilight';
  const showStyle = studioJob === 'stage';
  if (options) options.hidden = !showRooms;
  if (roomField) roomField.hidden = !showRooms;
  if (styleField) styleField.hidden = !showStyle;
  if (studioJob === 'twilight') {
    currentRoom = 'twilight';
  } else if (!['living', 'bedroom', 'dining', 'office'].includes(currentRoom)) {
    const pill = document.querySelector('.sidebar-pills .pill[data-room="living"]');
    selectStudioRoom('living', pill);
    return;
  }
  updateStudioStatus();
  updateEditorChrome();
}

function updateEditorChrome() {
  const status = document.getElementById('editorStatus');
  const stageBtn = document.getElementById('stageButton');
  const downloadLabel = document.getElementById('downloadBtnLabel');
  if (!status && !stageBtn) return;
  const styleName = currentStyle ? currentStyle.charAt(0).toUpperCase() + currentStyle.slice(1) : 'Modern';
  const roomName = formatRoomTitle(currentRoom);
  const job = accountJobs.find(item => item.id === currentStudioJob);
  const plainRooms = { living: 'Living room', bedroom: 'Bedroom', dining: 'Dining room', office: 'Office', twilight: 'Twilight', declutter: 'Declutter' };
  if (status) {
    if (isDashboardPage()) {
      const plain = plainRooms[currentRoom] || roomName;
      const jobName = studioJob === 'twilight' ? 'Twilight' : studioJob === 'declutter' ? 'Declutter' : 'Stage';
      const choice = studioJob === 'twilight'
        ? 'Twilight'
        : (studioJob === 'stage' ? `${jobName} · ${plain} · ${styleName}` : `${jobName} · ${plain}`);
      status.textContent = hasOwnPhoto()
        ? choice
        : `${choice}. This picture is an example until you upload your photo.`;
    } else {
      status.textContent = sourceJobId
        ? `${roomName} · ${styleName}. Save a new version, or download the one on screen.`
        : `${roomName} · ${styleName}. Stage it to keep this preview.`;
    }
  }
  if (stageBtn && !stageBtn.disabled) {
    if (isDashboardPage()) {
      stageBtn.textContent = sourceJobId ? 'Save a new version' : 'Make this photo';
    } else {
      stageBtn.textContent = sourceJobId ? 'Save new version' : 'Stage this room';
    }
  }
  if (downloadLabel && isDashboardPage()) {
    downloadLabel.textContent = job && job.status === 'downloaded'
      ? 'Download again'
      : `Download · ${getCredits()} left`;
  }
  document.querySelectorAll('.render-history-card').forEach(card => {
    card.classList.toggle('is-open', card.dataset.id === currentStudioJob);
  });
}

function runStagingSimulation() {
  if (!getAuthToken()) {
    openLoginModal('login');
    showToast('Log in so this render is saved on your account.', 'info');
    return;
  }
  if (!hasOwnPhoto()) {
    showToast('Upload your photo first. The picture on screen is an example.', 'info', 4000);
    return;
  }
  const overlay = document.getElementById('renderOverlay');
  const status = document.getElementById('renderStatus');
  const fill = document.getElementById('progressFill');
  const stageBtn = document.getElementById('stageButton');
  const img = document.getElementById('stagedImageDisplay');
  const resultBox = document.getElementById('resultBox');

  if (!overlay || !status || !fill) return;

  const livePromise = requestLiveStage();

  if (stageBtn) {
    if (!stageButtonHtml) stageButtonHtml = stageBtn.innerHTML;
    stageBtn.disabled = true;
    stageBtn.textContent = 'Processing…';
  }

  overlay.classList.add('active');
  fill.style.width = '0%';

  const roomLabel = isUserPhoto ? 'custom uploaded room' : (roomImages[currentRoom]?.title || 'room');
  const styleCapitalized = currentStyle.charAt(0).toUpperCase() + currentStyle.slice(1);
  const steps = isDashboardPage()
    ? [{ pct: 70, text: 'Saving this version…', delay: 180 }]
    : [
    { pct: 15, text: `Analyzing ${roomLabel} architecture & lighting…`, delay: 450 },
    { pct: 35, text: `Detecting boundaries, wall planes & flooring…`, delay: 650 },
    { pct: 55, text: `Arranging ${styleCapitalized} architectural furniture to scale…`, delay: 750 },
    { pct: 75, text: 'Calibrating ray-traced window illumination & shadows…', delay: 650 },
    { pct: 90, text: 'Rendering 4K HDR MLS-compliant export…', delay: 550 },
    { pct: 100, text: 'Staging Complete', delay: 250 }
  ];

  let i = 0;
  function next() {
    if (i >= steps.length) {
      setTimeout(async () => {
        if (status) status.textContent = 'Adding furniture to this photo…';
        let stageData = null;
        try { stageData = await livePromise; } catch (_) {}

        overlay.classList.remove('active');

        if (stageData && stageData.staged_url && img) {
          img.src = stageData.staged_url;
          currentStudioJob = stageData.job_id;
          sourceJobId = stageData.job_id;
          preserveStudioImage = true;
          isUserPhoto = true;
          if (resultBox) resultBox.className = 'canvas-image-wrap style-filter-none';
          showToast(stageData.message || 'Saved. Download when you want the file.', 'success', 4000);
          if (isDashboardPage()) loadDashboardData();
          else loadStudioHistory();
        }

        isShowingBefore = false;
        const cb = document.getElementById('studioCompareBtn');
        if (cb) cb.classList.remove('active');
        updateStudioStatus();
        updateEditorChrome();

        if (stageBtn) {
          stageBtn.disabled = false;
          stageBtn.innerHTML = stageButtonHtml || 'Stage this room';
        }
      }, 250);
      return;
    }

    status.textContent = steps[i].text;
    fill.style.width = steps[i].pct + '%';
    i++;
    setTimeout(next, steps[i - 1].delay);
  }

  setTimeout(next, 120);
}

// --- UPLOAD ZONE ---
function initUploadZone() {
  const zone = document.getElementById('dropZone');
  const input = document.getElementById('fileInput');
  if (!zone || !input) return;

  zone.addEventListener('click', () => input.click());

  zone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      input.click();
    }
  });

  ['dragenter', 'dragover'].forEach(name => {
    zone.addEventListener(name, (e) => {
      e.preventDefault();
      zone.classList.add('drag-active');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    zone.addEventListener(name, (e) => {
      e.preventDefault();
      zone.classList.remove('drag-active');
    });
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-active');
    const file = e.dataTransfer?.files?.[0];
    if (file) handleUpload(file);
  });

  input.addEventListener('change', () => {
    if (input.files?.[0]) handleUpload(input.files[0]);
  });
}

function handleUpload(file) {
  sourceJobId = null;
  preserveStudioImage = false;
  uploadedCloudUrl = '';
  if (!file.type.startsWith('image/')) {
    showToast('Please upload an image file (JPG, PNG, or WEBP).', 'error');
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showToast('Photo is larger than 10 MB. Choose a smaller file.', 'error');
    return;
  }

  userUploadedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    userUploadedPhoto = e.target.result;
    isUserPhoto = true;

    const img = document.getElementById('stagedImageDisplay');
    const resultBox = document.getElementById('resultBox');

    if (img) img.src = userUploadedPhoto;
    if (resultBox) resultBox.className = 'canvas-image-wrap style-filter-none';

    document.querySelectorAll('.sidebar-pills .pill').forEach(p => p.classList.remove('active'));

    isShowingBefore = false;
    const cb = document.getElementById('studioCompareBtn');
    if (cb) cb.classList.remove('active');
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';

    const tag = document.getElementById('studioStatusTag');
    if (tag) tag.textContent = 'Uploaded Photo • Ready to Stage';

    showToast(`"${file.name}" ready. Stage it to save this room to your account.`, 'success', 4000);
    persistUploadedPhoto(file);
  };
  reader.readAsDataURL(file);
}

async function persistUploadedPhoto(file) {
  if (!getAuthToken() || !file) return;
  const form = new FormData();
  form.append('image', file);
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${getAuthToken()}` },
      body: form
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.url) uploadedCloudUrl = data.url;
  } catch (_) {}
}

// --- MLS STAMP ---
function initMLSStamp() {
  toggleMLSStamp(true);
}

function toggleMLSStamp(isSilent = false) {
  if (isSilent && typeof isSilent === 'object') isSilent = false;
  const cb = document.getElementById('mlsComplianceSwitch');
  const stamp = document.getElementById('mlsStamp');
  const checkLabel = cb ? cb.closest('.mls-check') : null;
  const isChecked = Boolean(cb && cb.checked);

  if (stamp) {
    stamp.classList.toggle('visible', isChecked);
  }
  if (checkLabel) {
    checkLabel.classList.toggle('active', isChecked);
  }

  if (!isSilent) {
    showToast(
      isChecked ? 'Auto-add MLS watermark enabled ("Virtually Staged · NAR 12-10")' : 'MLS watermark disabled',
      isChecked ? 'success' : 'info',
      3000
    );
  }
}

// --- FAQ ---
function toggleFaq(item) {
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(f => {
    f.classList.remove('open');
    const button = f.querySelector('.faq-q');
    if (button) button.setAttribute('aria-expanded', 'false');
  });
  if (!wasOpen) {
    item.classList.add('open');
    const button = item.querySelector('.faq-q');
    if (button) button.setAttribute('aria-expanded', 'true');
  }
}

// --- PRICING PACKS ---
let selectedTier = 'pro';
const tierPrices = {
  single:         { name: 'Single Photo 4K Unlock', price: 2.99, credits: 1, type: 'pack' },
  listing:        { name: 'Single Listing Pass (8 Photos)', price: 19.00, credits: 8, type: 'pack' },
  starter:        { name: 'Starter Pack (10 Images)', price: 29.00, credits: 10, type: 'pack' },
  pro:            { name: 'Pro Agent Pack (25 Images)', price: 49.00, credits: 25, type: 'pack' },
  agency_pack:    { name: 'Agency Bulk Pack (60 Images)', price: 99.00, credits: 60, type: 'pack' }
};

function openPricingModal(context) {
  if (context === 'unlock') selectedTier = 'single';
  else if (context === 'listing') selectedTier = 'listing';
  else if (context === 'starter') selectedTier = 'starter';
  else if (context === 'agency_pack') selectedTier = 'agency_pack';
  else selectedTier = 'pro';

  const modal = document.getElementById('checkoutModal');
  if (modal) modal.classList.add('active');
  lockPageScroll(true);
  selectModalTier(selectedTier);
}

function closePricingModal() {
  const modal = document.getElementById('checkoutModal');
  if (modal) modal.classList.remove('active');
  lockPageScroll(false);
}

function selectModalTier(tier) {
  selectedTier = tierPrices[tier] ? tier : 'pro';
  const singleR = document.getElementById('optSingle');
  const listingR = document.getElementById('optListing');
  const starterR = document.getElementById('optStarter');
  const proR = document.getElementById('optPro');

  if (singleR) singleR.checked = (selectedTier === 'single');
  if (listingR) listingR.checked = (selectedTier === 'listing');
  if (starterR) starterR.checked = (selectedTier === 'starter');
  if (proR) proR.checked = (selectedTier === 'pro');

  document.querySelectorAll('.modal-opt').forEach(el => el.classList.remove('selected'));
  const activeInput = document.querySelector(`input[name="modalOption"][value="${selectedTier}"]`);
  if (activeInput) activeInput.closest('.modal-opt')?.classList.add('selected');

  const planName = document.getElementById('modalPlanName');
  if (planName) planName.value = tierPrices[selectedTier].name;

  const title = document.getElementById('checkoutModalTitle');
  if (title) {
    title.textContent = selectedTier === 'single'
      ? 'Unlock 4K download'
      : tierPrices[selectedTier].name;
  }

  updateModalTotal();
}

function initCheckoutRadios() {
  document.querySelectorAll('input[name="modalOption"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) selectModalTier(radio.value);
    });
  });
}

function updateModalTotal() {
  const base = tierPrices[selectedTier]?.price || 49.00;
  const twilightBump = document.getElementById('bumpCheckbox')?.checked ? 14.00 : 0;
  const certBump = document.getElementById('bumpCertCheckbox')?.checked ? 9.00 : 0;
  const total = base + twilightBump + certBump;
  const totalEl = document.getElementById('modalTotalAmount');
  if (totalEl) totalEl.textContent = '$' + total.toFixed(2);
}

async function completeDemoOrder() {
  if (!getAuthToken()) {
    closePricingModal();
    openLoginModal('login');
    showToast('Log in before buying credits. They stay on the account.', 'info');
    return;
  }
  const total = document.getElementById('modalTotalAmount')?.textContent || '$49.00';
  const include_twilight = Boolean(document.getElementById('bumpCheckbox')?.checked);
  const include_cert = Boolean(document.getElementById('bumpCertCheckbox')?.checked);
  const plan = selectedTier;

  try {
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ plan, include_twilight, include_cert })
    });
    const data = await res.json();
    if (!res.ok || data.status !== 'success') {
      showToast(data.message || 'Checkout could not be completed.', 'error');
      return;
    }
    if (data.mode === 'live' && data.checkout_url) {
      window.location.href = data.checkout_url;
      return;
    }
    if (data.user) setCurrentUser(data.user);
    closePricingModal();
    refreshDownloadButton();
    if (isDashboardPage()) loadDashboardData();
    showToast(data.message || `${total} applied. ${data.credits_added || ''} credits are on this account.`, 'success', 5500);
  } catch (_) {
    showToast('Checkout could not reach the server.', 'error');
  }
}

async function confirmCheckoutReturn() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('checkout') !== 'success') return;
  const sessionId = params.get('session_id');
  if (!getAuthToken()) return;
  try {
    const res = await fetch('/api/checkout/confirm', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ session_id: sessionId || '' })
    });
    const data = await res.json();
    if (res.ok && data.user) {
      setCurrentUser(data.user);
      showToast('Payment received. Credits are on this account.', 'success', 5000);
    }
  } catch (_) {}
}

// --- MLS COMPLIANCE CERTIFICATE ENGINE ---
function openCertModal() {
  const modal = document.getElementById('certModal');
  if (!modal) return;

  const currentAddress = (document.getElementById('sniperAddress')?.value || '1042 Ocean Avenue, Santa Monica, CA');
  const input = document.getElementById('certAddressInput');
  const text = document.getElementById('certAddressText');
  if (input) input.value = currentAddress;
  if (text) text.textContent = currentAddress;

  const stampEl = document.getElementById('certTimestamp');
  if (stampEl) {
    const randId = Math.floor(10000 + Math.random() * 90000);
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    stampEl.textContent = `VS-MLS-2026-${randId} · Certified ${dateStr}`;
  }

  trackUsageEvent('cert_generate', currentAddress, { standard: 'NAR 12-10' });

  modal.classList.add('active');
  lockPageScroll(true);
}

function closeCertModal() {
  const modal = document.getElementById('certModal');
  if (!modal) return;
  modal.classList.remove('active');
  lockPageScroll(false);
}

function printCert() {
  window.print();
}

async function downloadStudioJob(jobId) {
  if (!getAuthToken()) {
    openLoginModal('login');
    return;
  }
  const id = jobId || currentStudioJob;
  if (!id) {
    showToast('Stage a room first. The preview is saved, then a download uses one credit.', 'info');
    return;
  }
  try {
    const res = await fetch('/api/studio/download', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ job_id: id })
    });
    const data = await res.json();
    if (res.status === 402) {
      if (data.user) setCurrentUser(data.user);
      openPricingModal('single');
      showToast(data.message || 'Add a credit to download this render.', 'info');
      return;
    }
    if (!res.ok || !data.download_url) {
      showToast(data.message || 'Download failed.', 'error');
      return;
    }
    if (data.user) setCurrentUser(data.user);
    if (isDashboardPage() || document.getElementById('dashboardModal')?.classList.contains('active')) {
      loadDashboardData();
    }
    const a = document.createElement('a');
    a.href = data.download_url;
    a.download = `Roomgenix_${currentRoom}_${currentStyle}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    loadStudioHistory();
    showToast(`Download started. ${getCredits()} credit${getCredits() === 1 ? '' : 's'} left.`, 'success');
  } catch (_) {
    showToast('Download could not reach the server.', 'error');
  }
}

function requestStudioDownload() {
  downloadStudioJob(currentStudioJob);
}

async function requestLiveStage() {
  const prompt = document.getElementById('customPrompt')?.value.trim() || '';
  const form = new FormData();
  form.append('job', studioJob);
  form.append('room_type', studioJob === 'twilight' ? 'twilight' : studioJob === 'declutter' ? 'declutter' : currentRoom);
  form.append('style', currentStyle);
  form.append('prompt', prompt);
  if (isUserPhoto && userUploadedFile) {
    form.append('image', userUploadedFile);
  } else if (isUserPhoto && uploadedCloudUrl) {
    form.append('image_url', uploadedCloudUrl);
  } else if (sourceJobId) {
    form.append('source_job_id', sourceJobId);
  }
  try {
    const headers = {};
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch('/api/stage', {
      method: 'POST',
      headers,
      body: form
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) openLoginModal('login');
      showToast(data.message || 'Staging could not be saved.', 'error');
      return null;
    }
    if (data.user) setCurrentUser(data.user);
    if (data.before_url) uploadedCloudUrl = data.before_url;
    return data;
  } catch (_) {
    return null;
  }
}

function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function loadStudioHistory() {
  const box = document.getElementById('studioHistory');
  const row = document.getElementById('studioHistoryRow');
  if (!box || !row || !getAuthToken()) {
    if (box) box.hidden = true;
    return;
  }
  try {
    const res = await fetch('/api/studio/jobs', { headers: authHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    if (data.user) setCurrentUser({ ...getCurrentUser(), credits_balance: data.credits_balance });
    else if (typeof data.credits_balance === 'number') {
      const user = getCurrentUser();
      if (user) setCurrentUser({ ...user, credits_balance: data.credits_balance });
    }
    accountJobs = data.jobs;
    if (!data.jobs || !data.jobs.length) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    row.innerHTML = data.jobs.map(job => `
      <button type="button" class="studio-history-card" onclick="editHistoryJob('${job.id}')">
        <img src="${escapeHtml(job.image_url)}" alt="">
        <span>${escapeHtml(formatRoomTitle(job.room_type))}</span>
        <em>${job.status === 'downloaded' ? 'Downloaded' : 'Preview'}</em>
      </button>
    `).join('');
  } catch (_) {}
}

function openStudioJob(id, url) {
  if (accountJobs.some(job => job.id === id)) {
    editHistoryJob(id);
    return;
  }
  currentStudioJob = id;
  sourceJobId = id;
  preserveStudioImage = true;
  const img = document.getElementById('stagedImageDisplay');
  if (img && url) img.src = url;
  const studio = document.getElementById('studio') || document.getElementById('demo');
  if (studio) studio.scrollIntoView({ behavior: 'smooth' });
}

function editHistoryJob(id) {
  const job = accountJobs.find(item => item.id === id);
  if (!job) return;
  const example = job.source === 'sample' || isExampleUrl(job.image_url) || isExampleUrl(job.before_url);
  currentStudioJob = job.id;
  sourceJobId = example ? null : job.id;
  preserveStudioImage = true;
  currentRoom = job.room_type || 'living';
  isUserPhoto = false;
  userUploadedPhoto = null;
  userUploadedFile = null;
  uploadedCloudUrl = example ? '' : (job.before_url || '');
  document.querySelectorAll('.sidebar-pills .pill').forEach(pill => {
    pill.classList.toggle('active', pill.getAttribute('data-room') === currentRoom);
  });
  selectStyle(job.style || 'modern', null);
  const prompt = document.getElementById('customPrompt');
  if (prompt) prompt.value = job.prompt || '';
  const img = document.getElementById('stagedImageDisplay');
  if (img) img.src = job.image_url;
  const studio = document.getElementById('studio') || document.getElementById('demo');
  if (studio) studio.scrollIntoView({ behavior: 'smooth', block: 'start' });
  updateEditorChrome();
}

async function saveProfile(event) {
  if (event) event.preventDefault();
  const name = document.getElementById('profileName')?.value.trim();
  const brokerage = document.getElementById('profileBrokerage')?.value.trim() || '';
  if (!name) {
    showToast('Enter a name for this account.', 'error');
    return;
  }
  try {
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ name, brokerage })
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.message || 'Account details could not be saved.', 'error');
      return;
    }
    if (data.user) setCurrentUser(data.user);
    loadDashboardData();
    showToast(data.message || 'Account details saved.', 'success');
  } catch (_) {
    showToast('Account details could not reach the server.', 'error');
  }
}

// --- PERSONA QUICK-SELECTOR ENGINE ---
const personaProfiles = {
  solo: {
    title: "Stage the vacant rooms before the listing appointment ends",
    text: "Living room and primary suite are the two photos buyers linger on. Do those first. Twilight is the add-on when the exterior was shot at noon.",
    rec: "Start with the living room",
    room: "living"
  },
  fsbo: {
    title: "An empty house is hard to judge from a phone",
    text: "Add a sofa and a bed so the photos show the size. The download carries a virtually-staged note, which most boards require.",
    rec: "Start with the living room",
    room: "living"
  },
  luxury: {
    title: "Match the furniture to the finish already in the house",
    text: "A darker sofa and a stone table read closer to a finished listing than a bright catalog set. The architecture still has to be the real one.",
    rec: "Look at the primary suite",
    room: "bedroom"
  },
  investor: {
    title: "Show the room after the mess, and after a refresh",
    text: "Item removal clears boxes. A virtual remodel shows paint and floors that are not installed yet, so the caption has to say so.",
    rec: "Look at the remodel",
    room: "renovation"
  },
  team: {
    title: "Buy the week of listings in one pack",
    text: "The bulk pack is $99 for 60 photos. Credits stay on the account. Twilight is $14 on top of a photo, not included in the pack.",
    rec: "Look at the office",
    room: "office"
  }
};

function selectPersona(role, btnEl) {
  document.querySelectorAll('.persona-tab').forEach(b => {
    const on = b === btnEl;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });

  const p = personaProfiles[role];
  if (!p) return;

  const titleEl = document.getElementById('personaBenefitTitle');
  const textEl = document.getElementById('personaBenefitText');
  const recEl = document.getElementById('personaRecPill');

  if (titleEl) titleEl.textContent = p.title;
  if (textEl) textEl.textContent = p.text;
  if (recEl) recEl.textContent = p.rec;

  if (p.room) {
    switchHeroRoom(p.room, null);
  }
}

function checkout(plan) {
  if (plan === 'listing') openPricingModal('listing');
  else if (plan === 'starter') openPricingModal('starter');
  else if (plan === 'pro') openPricingModal('pro');
  else if (plan === 'agency_pack') openPricingModal('agency_pack');
  else openPricingModal('pro');
}

// --- MODAL CLICK-OUTSIDE ---
function initModalClickOutside() {
  const backdrop = document.getElementById('checkoutModal');
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closePricingModal();
    });
  }
  const certBackdrop = document.getElementById('certModal');
  if (certBackdrop) {
    certBackdrop.addEventListener('click', (e) => {
      if (e.target === certBackdrop) closeCertModal();
    });
  }
  const loginBackdrop = document.getElementById('loginModal');
  if (loginBackdrop) {
    loginBackdrop.addEventListener('click', (e) => {
      if (e.target === loginBackdrop) closeLoginModal();
    });
  }
  const dashBackdrop = document.getElementById('dashboardModal');
  if (dashBackdrop) {
    dashBackdrop.addEventListener('click', (e) => {
      if (e.target === dashBackdrop) closeDashboardModal();
    });
  }
}

// --- SMOOTH SCROLL ---
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const drawer = document.getElementById('mobileDrawer');
    const burger = document.getElementById('hamburger');
    if (drawer) drawer.classList.remove('open');
    if (burger) {
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    }
  }
}

function lockPageScroll(locked) {
  if (!locked && document.querySelector('.modal-overlay.active')) return;
  document.body.classList.toggle('modal-open', Boolean(locked));
  document.body.style.overflow = locked ? 'hidden' : '';
}

// --- AUTH & USER STATE MANAGEMENT ---
let authMode = 'login';
const capitalize = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

function getAuthToken() {
  return localStorage.getItem('vs_token') || '';
}

function setAuthToken(token) {
  if (token) localStorage.setItem('vs_token', token);
  else localStorage.removeItem('vs_token');
}

function clearAuth() {
  localStorage.removeItem('vs_token');
  localStorage.removeItem('vs_user');
  localStorage.removeItem('vs_session');
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('vs_user');
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function setCurrentUser(user) {
  if (user) {
    localStorage.setItem('vs_user', JSON.stringify(user));
    if (typeof user.credits_balance === 'number') {
      localStorage.setItem('vs_credits', String(user.credits_balance));
    }
  } else {
    clearAuth();
  }
  renderUserStatus();
}

function getCredits() {
  const user = getCurrentUser();
  if (user && typeof user.credits_balance === 'number') {
    return user.credits_balance;
  }
  return 0;
}

function addCredits(amount) {
  const user = getCurrentUser();
  if (user) {
    user.credits_balance = Math.max(0, (user.credits_balance || 0) + amount);
    setCurrentUser(user);
    return user.credits_balance;
  }
  const next = Math.max(0, getCredits() + amount);
  localStorage.setItem('vs_credits', String(next));
  renderUserStatus();
  return next;
}

function refreshDownloadButton() {
  if (isDashboardPage()) {
    updateEditorChrome();
    return;
  }
  const label = document.getElementById('downloadBtnLabel');
  if (!label) return;
  const credits = getCredits();
  label.textContent = credits > 0
    ? `Download 4K · ${credits} credit${credits === 1 ? '' : 's'}`
    : 'Download 4K — $2.99';
}

async function initAuth() {
  const token = getAuthToken();
  if (!token) {
    renderUserStatus();
    if (isDashboardPage()) openLoginModal('login');
    return;
  }
  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success' && data.user) {
        setCurrentUser(data.user);
        if (isDashboardPage()) {
          showAccount();
          loadDashboardData();
        } else {
          loadStudioHistory();
        }
        return;
      }
    }
    clearAuth();
    renderUserStatus();
    if (isDashboardPage()) openLoginModal('login');
  } catch (_) {
    renderUserStatus();
    if (isDashboardPage() && getAuthToken()) showAccount();
  }
}

function renderUserStatus() {
  const user = getCurrentUser();
  const navSlot = document.getElementById('navAuthSlot');

  if (navSlot) {
    if (user) {
      const initials = (user.name || 'User')
        .split(' ')
        .map(w => w[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
      const firstName = (user.name || 'User').split(' ')[0];
      const homeLink = isDashboardPage()
        ? ''
        : ' onclick="window.location.href=\'/dashboard\'"';
      const homeLabel = isDashboardPage() ? escapeHtml(firstName) : 'Open your studio';
      navSlot.innerHTML = `
        <button class="nav-user-badge" id="navUserBadgeBtn" type="button"${homeLink} title="${homeLabel}" aria-label="${homeLabel}">
          <span class="nav-avatar-circle">${initials}</span>
          <span>${escapeHtml(firstName)}</span>
          <span class="nav-credits-chip">
            <svg width="10" height="10" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            ${user.credits_balance}
          </span>
        </button>
      `;
    } else {
      navSlot.innerHTML = `
        <a href="#account" class="nav-login" id="navLoginBtn" onclick="handleNavAuthClick(); return false;">Log in</a>
      `;
    }
  }

  // Update mobile drawer links
  document.querySelectorAll('.drawer-login').forEach(el => {
    if (user) {
      el.textContent = `Dashboard (${user.credits_balance} Credits)`;
      el.onclick = (e) => { e.preventDefault(); window.location.href = '/dashboard'; };
    } else {
      el.textContent = 'Log in';
      el.onclick = (e) => { e.preventDefault(); openLoginModal('login'); };
    }
  });

  refreshDownloadButton();
}

function handleNavAuthClick() {
  if (getCurrentUser()) {
    openDashboardModal();
  } else {
    openLoginModal('login');
  }
}

// --- AUTH MODAL (LOGIN & SIGNUP) ---
function switchAuthTab(tab) {
  authMode = tab;
  const loginTab = document.getElementById('tabAuthLogin');
  const signupTab = document.getElementById('tabAuthSignup');
  const nameGrp = document.getElementById('groupAuthName');
  const brokerGrp = document.getElementById('groupAuthBrokerage');
  const submitBtn = document.getElementById('authSubmitBtn');
  const titleEl = document.getElementById('loginModalTitle');
  const subEl = document.getElementById('loginModalSub');

  if (tab === 'signup') {
    loginTab?.classList.remove('active');
    signupTab?.classList.add('active');
    if (nameGrp) nameGrp.style.display = 'block';
    if (brokerGrp) brokerGrp.style.display = 'block';
    if (submitBtn) submitBtn.textContent = 'Create Free Account (3 Credits) →';
    if (titleEl) titleEl.textContent = 'Create your account';
    if (subEl) subEl.textContent = 'Get 3 free 4K staging credits immediately. No credit card required.';
    document.getElementById('authName')?.setAttribute('required', 'required');
  } else {
    loginTab?.classList.add('active');
    signupTab?.classList.remove('active');
    if (nameGrp) nameGrp.style.display = 'none';
    if (brokerGrp) brokerGrp.style.display = 'none';
    if (submitBtn) submitBtn.textContent = 'Log In';
    if (titleEl) titleEl.textContent = 'Welcome back';
    if (subEl) subEl.textContent = 'Log in to access your staged photos, 4K downloads, and account credits.';
    document.getElementById('authName')?.removeAttribute('required');
  }
}

function openLoginModal(tab = 'login') {
  const modal = document.getElementById('loginModal');
  if (!modal) return;
  switchAuthTab(tab);
  modal.classList.add('active');
  lockPageScroll(true);
}

function closeLoginModal() {
  if (isDashboardPage() && !getAuthToken()) {
    window.location.href = '/';
    return;
  }
  const modal = document.getElementById('loginModal');
  if (!modal) return;
  modal.classList.remove('active');
  lockPageScroll(false);
}

function fillDemoCredentials() {
  switchAuthTab('login');
  const emailInput = document.getElementById('authEmail');
  const pwdInput = document.getElementById('authPassword');
  if (emailInput) emailInput.value = 'demo@roomgenix.com';
  if (pwdInput) pwdInput.value = 'demo1234';
  const form = document.getElementById('authForm');
  if (form) {
    handleAuthSubmit(new Event('submit', { cancelable: true }));
  }
}

async function handleAuthSubmit(event) {
  if (event && event.preventDefault) event.preventDefault();
  const email = document.getElementById('authEmail')?.value.trim();
  const password = document.getElementById('authPassword')?.value.trim();
  const name = document.getElementById('authName')?.value.trim();
  const brokerage = document.getElementById('authBrokerage')?.value.trim() || '';
  const submitBtn = document.getElementById('authSubmitBtn');

  if (!email || !password) {
    showToast('Please enter your email and password.', 'error');
    return;
  }

  const endpoint = authMode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
  const payload = { email, password };
  if (authMode === 'signup') {
    if (!name) {
      showToast('Please enter your full name.', 'error');
      return;
    }
    payload.name = name;
    payload.brokerage = brokerage;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.dataset.origText = submitBtn.textContent;
    submitBtn.textContent = 'Authenticating...';
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || data.status !== 'success') {
      showToast(data.message || 'Authentication failed. Please check your credentials.', 'error', 4500);
      return;
    }

    setAuthToken(data.token);
    setCurrentUser(data.user);
    closeLoginModal();
    if (isDashboardPage()) {
      showAccount();
      loadDashboardData();
      showToast(data.message || `Welcome, ${data.user.name}!`, 'success', 5000);
      return;
    }
    window.location.href = '/dashboard';
  } catch (err) {
    showToast('Network error during authentication. Please retry.', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = submitBtn.dataset.origText || (authMode === 'signup' ? 'Create Free Account' : 'Log In');
    }
  }
}

async function handleLogout() {
  const token = getAuthToken();
  if (token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (_) {}
  }
  clearAuth();
  setCurrentUser(null);
  currentStudioJob = null;
  sourceJobId = null;
  const history = document.getElementById('studioHistory');
  if (history) history.hidden = true;
  closeDashboardModal();
  if (isDashboardPage()) {
    window.location.href = '/';
    return;
  }
  showToast('You have been logged out.', 'info');
}

// --- USER DASHBOARD ENGINE ---
function openDashboardModal() {
  const user = getCurrentUser();
  if (!user) {
    openLoginModal('login');
    return;
  }
  if (!isDashboardPage()) {
    window.location.href = '/dashboard';
    return;
  }
  const modal = document.getElementById('dashboardModal');
  if (!modal) return;
  modal.classList.add('active');
  lockPageScroll(true);
  loadDashboardData();
}

function closeDashboardModal() {
  const modal = document.getElementById('dashboardModal');
  if (!modal) return;
  modal.classList.remove('active');
  lockPageScroll(false);
}

function previewRender(url) {
  if (!url) return;
  window.open(url, '_blank');
}

async function loadDashboardData() {
  const token = getAuthToken();
  if (!token) return;
  try {
    const res = await fetch('/api/user/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      if (res.status === 401) {
        clearAuth();
        closeDashboardModal();
        openLoginModal('login');
      }
      return;
    }
    const json = await res.json();
    const data = json.dashboard;
    if (!data) return;

    if (data.user) {
      setCurrentUser(data.user);
    }
    accountJobs = data.recent_renders || [];
    const planTitle = document.getElementById('dashPlanTitle');
    if (planTitle && data.user) planTitle.textContent = formatPlanName(data.user.plan);
    const profileName = document.getElementById('profileName');
    const profileBrokerage = document.getElementById('profileBrokerage');
    if (profileName && data.user) profileName.value = data.user.name || '';
    if (profileBrokerage && data.user) profileBrokerage.value = data.user.brokerage || '';

    // Avatar & Identity
    const initials = (data.user.name || 'User')
      .split(' ')
      .map(w => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    const avatarEl = document.getElementById('dashAvatar');
    if (avatarEl) avatarEl.textContent = initials;

    const nameEl = document.getElementById('dashUserName');
    if (nameEl) {
      nameEl.textContent = data.user.name || 'Your account';
    }

    const brokEl = document.getElementById('dashUserBrokerage');
    if (brokEl) {
      if (document.getElementById('profileName')) {
        brokEl.textContent = data.user.brokerage || 'Independent agent';
        const emailOnly = document.getElementById('dashUserEmail');
        if (emailOnly) emailOnly.textContent = data.user.email || '';
      } else {
        brokEl.innerHTML = `${escapeHtml(data.user.brokerage || 'Independent Agent')} · <span id="dashUserEmail">${escapeHtml(data.user.email)}</span>`;
      }
    }

    // Balance
    const creditsEl = document.getElementById('dashCreditsNum');
    if (creditsEl) creditsEl.textContent = data.stats.credits_balance;

    // KPIs
    const kpiRooms = document.getElementById('kpiRoomsStaged');
    if (kpiRooms) kpiRooms.textContent = data.stats.total_renders;

    const kpiDl = document.getElementById('kpiDownloads');
    if (kpiDl) kpiDl.textContent = data.stats.downloads_4k;

    const kpiCert = document.getElementById('kpiCerts');
    if (kpiCert) kpiCert.textContent = data.stats.certs_generated;

    const kpiSnipe = document.getElementById('kpiZillowSnipes');
    if (kpiSnipe) kpiSnipe.textContent = data.stats.zillow_snipes;

    // Renders Gallery
    const galleryEl = document.getElementById('dashRendersGallery');
    if (galleryEl) {
      if (data.recent_renders && data.recent_renders.length > 0) {
        galleryEl.innerHTML = data.recent_renders.map(r => `
          <div class="render-history-card ${r.id === currentStudioJob ? 'is-open' : ''}" data-id="${escapeHtml(r.id)}" onclick="editHistoryJob('${escapeHtml(r.id)}')">
            <img src="${escapeHtml(r.image_url)}" alt="${escapeHtml(r.room_type)} staged" loading="lazy" />
            <div class="render-card-body">
              <div class="render-card-title">${formatRoomTitle(r.room_type)}</div>
              <div class="render-card-meta">${(r.source === 'sample' || String(r.image_url || '').includes('assets/')) ? 'Example' : `${capitalize(r.style)} · ${r.status === 'downloaded' ? 'Downloaded' : 'Preview'}`}</div>
              <div class="render-card-actions">
                <button class="btn btn-primary btn-xs" type="button" onclick="event.stopPropagation(); downloadStudioJob('${escapeHtml(r.id)}')">Download</button>
              </div>
            </div>
          </div>
        `).join('');
      } else {
        galleryEl.innerHTML = `
          <div style="grid-column: 1/-1; padding: 36px 20px; text-align: center; color: #64748b; background: #fff; border-radius: var(--r); border: 1px dashed var(--border);">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 8px; opacity: 0.5;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <p style="font-weight: 700; margin-bottom: 4px; color: var(--text);">No staged listings yet</p>
            <p style="font-size: 13px;">Stage your first room photo above to automatically track it in this gallery.</p>
          </div>
        `;
      }
    }

    // Transactions Table
    const txBody = document.getElementById('dashTransactionsBody');
    if (txBody) {
      if (data.recent_transactions && data.recent_transactions.length > 0) {
        txBody.innerHTML = data.recent_transactions.map(t => `
          <tr>
            <td>${formatDate(t.created_at)}</td>
            <td style="font-weight: 600;">${formatPlanName(t.plan)}</td>
            <td><span class="badge badge-success">+${t.credits_added} Credits</span></td>
            <td style="font-weight: 700;">$${parseFloat(t.amount).toFixed(2)}</td>
            <td><span style="color: #10b981; font-weight: 700; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;">Completed</span></td>
          </tr>
        `).join('');
      } else {
        txBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; color: #94a3b8; padding: 24px;">No billing transactions yet. Upgrade a plan to add credits.</td>
          </tr>
        `;
      }
    }

    trackUsageEvent('view_dashboard');
    updateEditorChrome();
  } catch (err) {
    console.error('Error loading dashboard data:', err);
  }
}

// --- USAGE ANALYTICS TRACKING ---
async function trackUsageEvent(eventType, propertyAddress = '', metadata = {}) {
  const token = getAuthToken();
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    await fetch('/api/user/track-event', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        event_type: eventType,
        property_address: propertyAddress,
        metadata: metadata
      })
    });
  } catch (_) {}
}

// --- HELPERS ---
function formatPlanName(plan) {
  const plans = {
    free_trial: 'Free Trial (3 Credits)',
    single: 'Single Photo Unlock',
    listing: 'Single Listing Pass',
    starter: 'Starter Pack',
    pro: 'Pro Agent Pack',
    agency_pack: 'Agency Bulk Pack',
    active_monthly: 'Active Agent ($39/mo)',
    power_monthly: 'Power Producer ($79/mo)',
    broker_monthly: 'Brokerage Team',
    broker: 'Brokerage Team'
  };
  return plans[plan] || 'Member';
}

function formatRoomTitle(room) {
  const titles = {
    living: 'Open Living Room',
    bedroom: 'Primary Suite',
    dining: 'Entertaining Dining',
    office: 'Executive Office',
    patio: 'Outdoor Living Patio',
    twilight: 'Virtual Twilight Dusk',
    declutter: 'Item Removal & Declutter',
    renovation: 'Virtual Remodel'
  };
  return titles[room] || (room ? room.charAt(0).toUpperCase() + room.slice(1) : 'Listing');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const clean = dateStr.replace(' ', 'T');
    const d = new Date(clean);
    if (isNaN(d.getTime())) return dateStr.split(' ')[0] || dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (_) {
    return dateStr.split(' ')[0] || dateStr;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function initConcierge() {
  const pill = document.getElementById('floatingConcierge');
  if (!pill) return;
  pill.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLegalModal('mls');
    }
  });
}

// --- TOAST ---
function showToast(message, type = 'success', duration = 3500) {
  const existing = document.getElementById('vsToast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'vsToast';
  toast.className = `vs-toast vs-toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('vs-toast--visible'));
  });

  setTimeout(() => {
    toast.classList.remove('vs-toast--visible');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

// --- LEGAL MODAL ---
const legalPageUrls = {
  mls: 'mls-compliance.html',
  terms: 'terms.html',
  privacy: 'privacy.html',
  refund: 'refund-guarantee.html'
};

function openLegalModal(tab = 'mls') {
  const modal = document.getElementById('legalModal');
  if (!modal) return;
  modal.classList.add('active');
  lockPageScroll(true);
  switchLegalTab(tab);
}

function closeLegalModal() {
  const modal = document.getElementById('legalModal');
  if (!modal) return;
  modal.classList.remove('active');
  lockPageScroll(false);
}

function switchLegalTab(tabKey) {
  document.querySelectorAll('.legal-tab').forEach(btn => {
    const on = btn.getAttribute('data-tab') === tabKey;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
  });

  document.querySelectorAll('.legal-tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === `tabPane_${tabKey}`);
  });

  const extLink = document.getElementById('legalStandaloneLink');
  if (extLink && legalPageUrls[tabKey]) {
    extLink.href = legalPageUrls[tabKey];
  }

  const scrollArea = document.querySelector('.legal-scroll');
  if (scrollArea) scrollArea.scrollTop = 0;
}

function initLegalModal() {
  const modal = document.getElementById('legalModal');
  if (!modal) return;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeLegalModal();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLegalModal();
      closePricingModal();
      closeLoginModal();
      closeDashboardModal();
    }
  });

  // Deep linking
  const hash = window.location.hash.toLowerCase();
  if (hash === '#mls-guide' || hash === '#mls') openLegalModal('mls');
  else if (hash === '#terms' || hash === '#tos') openLegalModal('terms');
  else if (hash === '#privacy') openLegalModal('privacy');
  else if (hash === '#refund' || hash === '#guarantee') openLegalModal('refund');
}

// --- STUDIO STATUS SYNC ---
function updateStudioStatus() {
  const tag = document.getElementById('studioStatusTag');
  if (!tag) return;
  const styleCapitalized = currentStyle.charAt(0).toUpperCase() + currentStyle.slice(1);
  const roomNames = {
    living: 'Living Room',
    bedroom: 'Bedroom',
    dining: 'Dining Room',
    office: 'Home Office',
    twilight: 'Virtual Twilight',
    declutter: 'Declutter Clean',
    patio: 'Outdoor Patio',
    renovation: 'Virtual Remodel'
  };

  const plainRooms = { living: 'Living room', bedroom: 'Bedroom', dining: 'Dining room', office: 'Office', twilight: 'Twilight', declutter: 'Declutter', patio: 'Patio', renovation: 'Remodel' };
  if (isDashboardPage()) {
    const plain = plainRooms[currentRoom] || 'Photo';
    const jobName = studioJob === 'twilight' ? 'Twilight' : studioJob === 'declutter' ? 'Declutter' : styleCapitalized;
    tag.textContent = studioJob === 'stage'
      ? `${plain} · ${jobName}`
      : (studioJob === 'twilight' ? 'Twilight' : `Declutter · ${plain}`);
    return;
  }

  if (isUserPhoto) {
    if (isShowingBefore) {
      tag.textContent = 'Uploaded Photo • Original (Before)';
    } else {
      tag.textContent = `Uploaded Photo • Staged (${styleCapitalized})`;
    }
  } else {
    const roomName = roomNames[currentRoom] || 'Room';
    if (isShowingBefore) {
      tag.textContent = `Original (Before) • ${roomName}`;
    } else {
      tag.textContent = `Staged • ${roomName} (${styleCapitalized})`;
    }
  }
}

// --- ANIMATED STAT COUNTERS ---
function initAnimatedCounters() {
  const counters = document.querySelectorAll('.metric-val[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const end = parseFloat(el.getAttribute('data-count'));
      const prefix = el.getAttribute('data-prefix') || '';
      const suffix = el.getAttribute('data-suffix') || '';
      const duration = 1400;
      const start = performance.now();
      const isDecimal = String(end).includes('.');

      function tick(now) {
        const elapsed = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - elapsed, 3);
        const value = end * eased;
        el.textContent = prefix + (isDecimal ? value.toFixed(2) : Math.round(value)) + suffix;
        if (elapsed < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

// --- STICKY BOTTOM CTA ---
function initStickyCta() {
  const cta = document.getElementById('stickyCta');
  if (!cta) return;
  const pricing = document.getElementById('pricing');

  const check = () => {
    const pricingTop = pricing ? pricing.getBoundingClientRect().top : Infinity;
    const shouldHide = pricingTop < window.innerHeight * 0.35;
    cta.style.transform = shouldHide ? 'translateY(120%)' : 'translateY(0)';
    cta.style.transition = 'transform .35s cubic-bezier(.215,.61,.355,1)';
  };

  window.addEventListener('scroll', check, { passive: true });
  check();
}
