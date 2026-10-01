/* ==========================================================================
   VirtualStage AI – Application Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initHamburger();
  initSlider();
  initUploadZone();
  initModalClickOutside();
  initLegalModal();
  initMLSStamp();
  initRoiCalculator();
  initScrollReveal();
  initAnimatedCounters();
  initStickyCta();
  loadHeroRoom('living');
  initThumbRibbon();
  initShowcaseCards();
  selectGalleryStyle('modern', null);
  updateStudioStatus();
  initAccount();
  initCheckoutRadios();
  initConcierge();
  refreshDownloadButton();
  const pendingCredits = parseInt(sessionStorage.getItem('vs_pending_credits') || '0', 10);
  if (new URLSearchParams(window.location.search).get('checkout') === 'success' && pendingCredits > 0) {
    addCredits(pendingCredits);
    sessionStorage.removeItem('vs_pending_credits');
    showToast('Payment received. Credits are ready to download.', 'success', 5000);
  }
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
    edge: 'One living-room photo at $1.96 replaces a staging visit that usually starts around $2,500.',
    before: 'assets/hero_empty.jpg',
    after: 'assets/hero_staged.jpg',
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
    after: 'assets/bedroom_staged.jpg',
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
    title: 'Luxury Backyard Living & Fire Pit Patio',
    category: 'Outdoor Living · Resort Lifestyle',
    badge: 'Outdoor living',
    buyerLine: 'A bare slab reads as unused yard. A fire pit and seating show the outdoor room buyers pay for, without renting furniture that sits in the rain.',
    edge: 'Outdoor rental staging is one of the most expensive rooms to do physically. This shot is still one image credit.',
    before: 'assets/patio_empty.jpg',
    after: 'assets/patio_staged.jpg',
    daysOnMarket: '7 Days',
    benchmark: 'vs 44 MLS avg',
    overAsking: '+$35,000',
    roi: '1,785x ROI',
    savings: '$3,200 saved vs outdoor rental',
    agentName: 'Jessica Thornton',
    agentBrokerage: 'The Corcoran Group',
    agentQuote: 'A bare patio reads as unused yard. Seating shows the outdoor room. You do not have to rent furniture that sits in the weather.'
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
  if (!container) return;

  const before = document.getElementById('beforeImage');
  const handle = document.getElementById('sliderHandle');
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
    e.preventDefault();
  });

  container.addEventListener('pointermove', (e) => {
    if (isDraggingSlider && galleryViewMode === 'slider') {
      handlePointer(e.clientX);
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
  if (afterEl) afterEl.style.backgroundImage = `url('${data.after}')`;
  if (beforeEl) beforeEl.style.backgroundImage = `url('${data.before}')`;

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
}

function loadHeroRoom(room) {
  switchHeroRoom(room || 'living', null);
}

// --- GALLERY STYLE PRESET SELECTOR ---
function selectGalleryStyle(style, btnEl) {
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

function paintGalleryStyle() {
  const afterEl = document.getElementById('afterImage');
  if (!afterEl) return;
  const photo = styleImages[galleryRoom] && styleImages[galleryRoom][galleryStyle];
  const fallback = roomImages[galleryRoom]?.after || 'assets/hero_staged.jpg';
  afterEl.style.backgroundImage = `url('${photo || fallback}')`;
  afterEl.classList.remove('style-lux', 'style-mid');
  if (!photo && galleryStyle === 'luxury') afterEl.classList.add('style-lux');
  if (!photo && galleryStyle === 'midcentury') afterEl.classList.add('style-mid');
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

function stageRoomInStudio(room) {
  scrollToSection('demo');
  loadSample(room, null);
}

// --- GALLERY ACTION HANDLERS ---
function stageThisGalleryRoom() {
  openStudioRoom(galleryRoom);
}

function openStudioRoom(room) {
  scrollToSection('demo');
  const matchingPill = document.querySelector(`.sidebar-pills .pill[data-room="${room}"]`);
  loadSample(room, matchingPill || null);
}

function downloadActiveGallerySample() {
  const data = roomImages[galleryRoom] || roomImages['living'];
  const a = document.createElement('a');
  a.href = data.after;
  a.download = `VirtualStageAI_${currentRoom}_MLS_Compliant.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast(`Downloaded MLS sample for ${data.title}`);
}

// --- PHOTOREALISTIC DESIGN STYLE IMAGE MAP ---
const styleImages = {
  living: {
    modern: 'assets/hero_staged.jpg',
    scandinavian: 'assets/hero_scandinavian.jpg',
    farmhouse: 'assets/hero_farmhouse.jpg',
    coastal: 'assets/hero_coastal.jpg',
    luxury: 'assets/hero_luxury.jpg',
    midcentury: 'assets/hero_midcentury.jpg'
  },
  bedroom: {
    modern: 'assets/bedroom_staged.jpg',
    scandinavian: 'assets/bedroom_scandinavian.jpg',
    farmhouse: 'assets/bedroom_farmhouse.jpg',
    coastal: 'assets/bedroom_staged.jpg'
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
    modern: 'assets/patio_staged.jpg',
    scandinavian: 'assets/patio_staged.jpg',
    farmhouse: 'assets/patio_staged.jpg',
    coastal: 'assets/patio_staged.jpg'
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
  return 'assets/hero_staged.jpg';
}

// --- STUDIO: SAMPLE LOADER ---
function loadSample(room, btnEl) {
  isUserPhoto = false;
  userUploadedPhoto = null;
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

  if (resultBox) {
    resultBox.className = `canvas-image-wrap style-filter-${style}`;
  }

  if (isUserPhoto) {
    if (img && userUploadedPhoto) {
      img.src = userUploadedPhoto;
    }
    isShowingBefore = false;
    const cb = document.getElementById('studioCompareBtn');
    if (cb) cb.classList.remove('active');
    updateStudioStatus();
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

function runStagingSimulation() {
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
  const steps = [
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
        let stagedUrl = null;
        try { stagedUrl = await livePromise; } catch (_) {}

        overlay.classList.remove('active');

        if (stagedUrl && img) {
          img.src = stagedUrl;
          if (resultBox) resultBox.className = 'canvas-image-wrap style-filter-none';
          showToast(`Staging complete — ${styleCapitalized} render ready.`, 'success');
        } else if (isUserPhoto) {
          if (img && userUploadedPhoto) img.src = userUploadedPhoto;
          if (resultBox) resultBox.className = `canvas-image-wrap style-filter-${currentStyle}`;
          showToast(`Style preview ready. Furniture rendering needs a Replicate token — your photo is shown with the ${styleCapitalized} treatment.`, 'info', 5000);
        } else {
          if (img) img.src = getStagedImageForRoom(currentRoom, currentStyle);
          if (resultBox) resultBox.className = `canvas-image-wrap style-filter-${currentStyle}`;
          showToast(`${styleCapitalized} sample ready.`, 'success');
        }

        isShowingBefore = false;
        const cb = document.getElementById('studioCompareBtn');
        if (cb) cb.classList.remove('active');
        updateStudioStatus();

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
  if (!file.type.startsWith('image/')) {
    showToast('Please upload an image file (JPG, PNG, or WEBP).', 'error');
    return;
  }

  if (file.size > 35 * 1024 * 1024) {
    showToast('File size exceeds 35 MB limit. Please choose a smaller photo.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    userUploadedPhoto = e.target.result;
    isUserPhoto = true;

    const img = document.getElementById('stagedImageDisplay');
    const resultBox = document.getElementById('resultBox');

    if (img) img.src = userUploadedPhoto;
    if (resultBox) resultBox.className = 'canvas-image-wrap style-filter-none';

    // Deselect room pills
    document.querySelectorAll('.sidebar-pills .pill').forEach(p => p.classList.remove('active'));

    isShowingBefore = false;
    const cb = document.getElementById('studioCompareBtn');
    if (cb) cb.classList.remove('active');
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';

    const tag = document.getElementById('studioStatusTag');
    if (tag) tag.textContent = 'Uploaded Photo • Ready to Stage';

    showToast(`"${file.name}" uploaded successfully! Select a style and click "Stage this room".`, 'success', 4000);
  };
  reader.readAsDataURL(file);
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
      isChecked ? '✓ Auto-add MLS watermark enabled ("Virtually Staged · NAR 12-10")' : 'MLS watermark disabled',
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

// --- PRICING MODAL ---
let selectedTier = 'pro';
const tierPrices = {
  single:  { name: 'Single Photo Unlock', price: 2.99, credits: 1 },
  starter: { name: 'Starter Pack (10 Renders)', price: 29.00, credits: 10 },
  pro:     { name: 'Pro Agent Pack (25 Renders)', price: 49.00, credits: 25 }
};

function openPricingModal(context) {
  if (context === 'unlock') selectedTier = 'single';
  else if (context === 'starter') selectedTier = 'starter';
  else selectedTier = 'pro';
  document.getElementById('checkoutModal').classList.add('active');
  lockPageScroll(true);
  selectModalTier(selectedTier);
}

function closePricingModal() {
  document.getElementById('checkoutModal').classList.remove('active');
  lockPageScroll(false);
}

function selectModalTier(tier) {
  selectedTier = tierPrices[tier] ? tier : 'pro';
  const singleR = document.getElementById('optSingle');
  const starterR = document.getElementById('optStarter');
  const proR = document.getElementById('optPro');
  if (singleR) singleR.checked = (selectedTier === 'single');
  if (starterR) starterR.checked = (selectedTier === 'starter');
  if (proR) proR.checked = (selectedTier === 'pro');

  document.querySelectorAll('.modal-opt').forEach(el => el.classList.remove('selected'));
  const activeInput = selectedTier === 'single' ? singleR : selectedTier === 'starter' ? starterR : proR;
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
  const bump = document.getElementById('bumpCheckbox')?.checked ? 14.00 : 0;
  const total = base + bump;
  const totalEl = document.getElementById('modalTotalAmount');
  if (totalEl) totalEl.textContent = '$' + total.toFixed(2);
}

async function completeDemoOrder() {
  const total = document.getElementById('modalTotalAmount')?.textContent || '$49.00';
  const bump = Boolean(document.getElementById('bumpCheckbox')?.checked);
  const plan = selectedTier;
  const credits = tierPrices[plan]?.credits || 1;

  let liveUrl = '';
  try {
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, include_twilight: bump })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.mode === 'live' && data.checkout_url) liveUrl = data.checkout_url;
    }
  } catch (_) {}

  if (liveUrl) {
    sessionStorage.setItem('vs_pending_credits', String(credits));
    window.location.href = liveUrl;
    return;
  }

  addCredits(credits);
  closePricingModal();

  const watermark = document.getElementById('watermark');
  if (watermark) watermark.style.display = 'none';
  refreshDownloadButton();

  showToast(`${total} demo order saved on this browser — ${credits} credit${credits === 1 ? '' : 's'} added. Connect Stripe to charge a card.`, 'success', 5500);
}

function requestStudioDownload() {
  const credits = getCredits();
  if (credits < 1) {
    openPricingModal('unlock');
    showToast('Add a credit to download this render.', 'info');
    return;
  }
  const img = document.getElementById('stagedImageDisplay');
  if (!img?.src) return;
  const a = document.createElement('a');
  a.href = img.src;
  a.download = `VirtualStageAI_${currentRoom}_${currentStyle}.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  addCredits(-1);
  refreshDownloadButton();
  showToast(`Download started. ${getCredits()} credit${getCredits() === 1 ? '' : 's'} left.`, 'success');
}

async function requestLiveStage() {
  const prompt = document.getElementById('customPrompt')?.value.trim() || '';
  const payload = {
    room_type: currentRoom,
    style: currentStyle,
    prompt
  };
  if (isUserPhoto && userUploadedPhoto && userUploadedPhoto.length < 1500000) {
    payload.image_data = userUploadedPhoto;
  }
  try {
    const res = await fetch('/api/stage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.staged_url || null;
  } catch (_) {
    return null;
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
    title: "One bill, up to five people",
    text: "The brokerage plan is $99 a month, twilight included. Each download can carry the same disclosure stamp.",
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

// --- BROKERAGE MODAL ENGINE ---
let selectedTeamSeats = 5;

function openBrokerageModal() {
  const modal = document.getElementById('brokerageModal');
  if (!modal) return;
  modal.classList.add('active');
  lockPageScroll(true);
}

function closeBrokerageModal() {
  const modal = document.getElementById('brokerageModal');
  if (!modal) return;
  modal.classList.remove('active');
  lockPageScroll(false);
}

function setTeamSeats(seats, btnEl) {
  selectedTeamSeats = seats;
  document.querySelectorAll('.team-seat-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
}

function submitBrokerageTrial() {
  const name = document.getElementById('brokerTeamName')?.value.trim();
  const email = document.getElementById('brokerEmail')?.value.trim();

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('Enter your brokerage name and a valid email.', 'error');
    return;
  }

  closeBrokerageModal();
  showToast(`Brokerage trial activated for ${name} (${selectedTeamSeats} seats)! Check ${email} for access.`, 'success', 6000);
}

function checkout(plan) {
  if (plan === 'starter') openPricingModal('starter');
  else if (plan === 'pro') openPricingModal('pro');
  else if (plan === 'broker') openBrokerageModal();
}

// --- MODAL CLICK-OUTSIDE ---
function initModalClickOutside() {
  const backdrop = document.getElementById('checkoutModal');
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closePricingModal();
    });
  }
  const brokerBackdrop = document.getElementById('brokerageModal');
  if (brokerBackdrop) {
    brokerBackdrop.addEventListener('click', (e) => {
      if (e.target === brokerBackdrop) closeBrokerageModal();
    });
  }
  const loginBackdrop = document.getElementById('loginModal');
  if (loginBackdrop) {
    loginBackdrop.addEventListener('click', (e) => {
      if (e.target === loginBackdrop) closeLoginModal();
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

function getCredits() {
  return parseInt(localStorage.getItem('vs_credits') || '0', 10) || 0;
}

function addCredits(amount) {
  const next = Math.max(0, getCredits() + amount);
  localStorage.setItem('vs_credits', String(next));
  renderAccount();
  return next;
}

function refreshDownloadButton() {
  const label = document.getElementById('downloadBtnLabel');
  if (!label) return;
  const credits = getCredits();
  label.textContent = credits > 0
    ? `Download 4K · ${credits} credit${credits === 1 ? '' : 's'}`
    : 'Download 4K — $2.99';
}

function getSession() {
  try { return JSON.parse(localStorage.getItem('vs_session') || 'null'); }
  catch (_) { return null; }
}

function initAccount() {
  renderAccount();
}

function renderAccount() {
  const session = getSession();
  document.querySelectorAll('.nav-login, .drawer-login').forEach(el => {
    el.textContent = session ? (session.name || 'Account') : 'Log in';
  });
  const creditsEl = document.getElementById('accountCredits');
  if (creditsEl) {
    const credits = getCredits();
    creditsEl.textContent = `${credits} credit${credits === 1 ? '' : 's'} saved on this browser`;
  }
}

function openLoginModal() {
  const modal = document.getElementById('loginModal');
  if (!modal) return;
  const session = getSession();
  const form = document.getElementById('loginForm');
  const panel = document.getElementById('accountPanel');
  const title = document.getElementById('loginModalTitle');
  if (form) form.hidden = Boolean(session);
  if (panel) panel.hidden = !session;
  if (title) title.textContent = session ? 'Your account' : 'Log in';
  renderAccount();
  modal.classList.add('active');
  lockPageScroll(true);
}

function closeLoginModal() {
  const modal = document.getElementById('loginModal');
  if (!modal) return;
  modal.classList.remove('active');
  lockPageScroll(false);
}

function submitLogin() {
  const name = document.getElementById('loginName')?.value.trim();
  const email = document.getElementById('loginEmail')?.value.trim();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) {
    showToast('Enter your name and a valid email.', 'error');
    return;
  }
  localStorage.setItem('vs_session', JSON.stringify({ name, email }));
  closeLoginModal();
  renderAccount();
  showToast(`Welcome, ${name}.`, 'success');
}

function logout() {
  localStorage.removeItem('vs_session');
  closeLoginModal();
  renderAccount();
  showToast('Logged out on this browser.', 'info');
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
      closeBrokerageModal();
      closeLoginModal();
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

// --- ROI SAVINGS CALCULATOR ---
function initRoiCalculator() {
  const listingsSlider = document.getElementById('roiListingsSlider');
  const roomsSlider = document.getElementById('roiRoomsSlider');
  const listingsVal = document.getElementById('roiListingsVal');
  const roomsVal = document.getElementById('roiRoomsVal');
  const netSavingsEl = document.getElementById('roiNetSavings');
  const physicalCostEl = document.getElementById('roiPhysicalCost');
  const virtualCostEl = document.getElementById('roiVirtualCost');
  const daysSavedEl = document.getElementById('roiDaysSaved');

  if (!listingsSlider || !roomsSlider) return;

  function calculate() {
    const listings = parseInt(listingsSlider.value, 10);
    const rooms = parseInt(roomsSlider.value, 10);

    if (listingsVal) listingsVal.textContent = `${listings} Listing${listings > 1 ? 's' : ''}`;
    if (roomsVal) roomsVal.textContent = `${rooms} Room${rooms > 1 ? 's' : ''}`;

    const totalPhotos = listings * rooms;
    const physicalCost = listings * 2500;
    const virtualCost = totalPhotos * 1.96;
    const netSavings = physicalCost - virtualCost;
    const daysSaved = listings * 5;

    if (netSavingsEl) netSavingsEl.textContent = '$' + Math.round(netSavings).toLocaleString();
    if (physicalCostEl) physicalCostEl.textContent = '$' + physicalCost.toLocaleString();
    if (virtualCostEl) virtualCostEl.textContent = '$' + virtualCost.toFixed(2);
    if (daysSavedEl) daysSavedEl.textContent = `${daysSaved} Days`;
  }

  listingsSlider.addEventListener('input', calculate);
  roomsSlider.addEventListener('input', calculate);
  calculate();
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

  // Hide when user is already in or past the demo section
  const demo = document.getElementById('demo');
  const pricing = document.getElementById('pricing');

  const check = () => {
    if (!demo) return;
    const demoTop = demo.getBoundingClientRect().top;
    const pricingBottom = pricing ? pricing.getBoundingClientRect().bottom : Infinity;
    // Show sticky CTA only when demo is not yet visible and pricing is below viewport
    const shouldHide = demoTop < window.innerHeight || pricingBottom < 0;
    cta.style.transform = shouldHide ? 'translateY(120%)' : 'translateY(0)';
    cta.style.transition = 'transform .35s cubic-bezier(.215,.61,.355,1)';
  };

  window.addEventListener('scroll', check, { passive: true });
  check();
}
