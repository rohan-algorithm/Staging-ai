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
    before: 'assets/hero_empty.jpg',
    after: 'assets/hero_staged.jpg',
    daysOnMarket: '9 Days',
    benchmark: 'vs 46 MLS avg',
    overAsking: '+$22,500',
    roi: '1,148x ROI',
    savings: '$2,800 saved vs physical',
    agentName: 'Sarah Jenkins',
    agentBrokerage: 'Keller Williams Beverly Hills',
    agentQuote: '"We virtually staged the vacant living area on Thursday morning and received 3 written offers over asking by Sunday afternoon. The 15-second speed is unmatched."'
  },
  bedroom: {
    title: 'Primary Master Suite',
    category: 'Vacant Staging · Master Suite',
    badge: 'NAR #2 Value Driver',
    before: 'assets/bedroom_empty.jpg',
    after: 'assets/bedroom_staged.jpg',
    daysOnMarket: '12 Days',
    benchmark: 'vs 42 MLS avg',
    overAsking: '+$18,000',
    roi: '918x ROI',
    savings: '$1,900 saved vs physical',
    agentName: 'David Marcus',
    agentBrokerage: 'Compass Real Estate',
    agentQuote: '"Empty bedrooms always photograph small and clinical. Staging the primary suite made buyers feel like they were checking into a boutique 5-star hotel."'
  },
  dining: {
    title: 'Executive Entertaining Dining Room',
    category: 'Vacant Staging · Dining & Kitchen',
    badge: 'Entertaining Hub',
    before: 'assets/dining_empty.jpg',
    after: 'assets/dining_staged.jpg',
    daysOnMarket: '8 Days',
    benchmark: 'vs 39 MLS avg',
    overAsking: '+$27,000',
    roi: '1,377x ROI',
    savings: '$2,400 saved vs physical',
    agentName: 'Elena Rostova',
    agentBrokerage: 'Sotheby’s International Realty',
    agentQuote: '"Buyers kept asking if an 8-seater dining table would fit with the glass doors. Staging it virtually answered the question instantly — zero doubts left."'
  },
  office: {
    title: 'Executive Work-From-Home Office',
    category: 'Flex Space · Remote Workspace',
    badge: '#1 Trending Zillow Filter',
    before: 'assets/office_empty.jpg',
    after: 'assets/office_staged.jpg',
    daysOnMarket: '11 Days',
    benchmark: 'vs 48 MLS avg',
    overAsking: '+$19,500',
    roi: '994x ROI',
    savings: '$2,100 saved vs physical',
    agentName: 'Marcus Vance',
    agentBrokerage: 'eXp Realty Silicon Valley',
    agentQuote: '"Home office is the #1 search filter for tech professionals here. Staging this extra bedroom as an executive study attracted our cash buyer in 11 days."'
  },
  twilight: {
    title: 'Virtual Twilight / Day-to-Dusk Exterior',
    category: 'Curb Appeal · Exterior Lighting',
    badge: '+400% Listing Clicks',
    before: 'assets/twilight_day.jpg',
    after: 'assets/twilight_dusk.jpg',
    daysOnMarket: '6 Days',
    benchmark: 'vs 51 MLS avg',
    overAsking: '+$31,000',
    roi: '1,581x ROI',
    savings: '$350 saved vs dusk photo',
    agentName: 'Amanda Ruiz',
    agentBrokerage: 'RE/MAX Premier',
    agentQuote: '"Changing our primary MLS hero photo to the Virtual Twilight dusk shot boosted our Zillow views by 412%. We were in escrow by Wednesday."'
  },
  declutter: {
    title: 'Tenant Item Removal & Decluttering',
    category: 'Pre-Listing · Digital Deep Clean',
    badge: 'Zero Eviction Hassle',
    before: 'assets/declutter_before.jpg',
    after: 'assets/declutter_after.jpg',
    daysOnMarket: '14 Days',
    benchmark: 'vs 68 MLS avg',
    overAsking: '+$15,000',
    roi: '765x ROI',
    savings: '$1,500 saved in delays',
    agentName: 'Michael Chang',
    agentBrokerage: 'Coldwell Banker Realty',
    agentQuote: '"The tenants were in the middle of packing and the house was a complete disaster. VirtualStage AI erased every cardboard box and mess in seconds."'
  },
  patio: {
    title: 'Luxury Backyard Living & Fire Pit Patio',
    category: 'Outdoor Living · Resort Lifestyle',
    badge: '+$35k Perceived Equity',
    before: 'assets/patio_empty.jpg',
    after: 'assets/patio_staged.jpg',
    daysOnMarket: '7 Days',
    benchmark: 'vs 44 MLS avg',
    overAsking: '+$35,000',
    roi: '1,785x ROI',
    savings: '$3,200 saved vs outdoor rental',
    agentName: 'Jessica Thornton',
    agentBrokerage: 'The Corcoran Group',
    agentQuote: '"Outdoor living sells the dream. Taking a cold concrete slab and staging it with a fire pit and festoon lighting created an instant bidding war."'
  },
  renovation: {
    title: 'Virtual Remodel & Architectural Renovation',
    category: 'Fixer-Upper · As-Is Renovation Vision',
    badge: 'Avoid $50k+ Price Cuts',
    before: 'assets/reno_before.jpg',
    after: 'assets/reno_after.jpg',
    daysOnMarket: '15 Days',
    benchmark: 'vs 74 MLS avg',
    overAsking: '+$42,000',
    roi: '2,142x ROI',
    savings: '$65,000 saved vs remodel',
    agentName: 'Robert Sterling',
    agentBrokerage: 'Berkshire Hathaway HomeServices',
    agentQuote: '"The seller was about to reduce price by $50,000 because of dated 1980s wood paneling. We included the virtually renovated photo in the listing and sold as-is!"'
  }
};

const stylePresets = {
  modern: {
    title: "Modern Architectural Luxury",
    desc: "Clean geometric lines, low-profile bouclé and Italian leather, matte black metal accents, warm travertine stone surfaces.",
    palette: ["#FFFFFF", "#E2E8F0", "#1E293B", "#B89B72"],
    bestFor: "High-rise condos, contemporary suburban homes, new construction"
  },
  scandinavian: {
    title: "Nordic Minimalist Warmth",
    desc: "Pale European white oak, organic boucle upholstery, sheer natural linen drapery, and handcrafted minimalist ceramic art.",
    palette: ["#FAF8F5", "#E8DFD8", "#64748B", "#8C7A6B"],
    bestFor: "Urban lofts, modern ranches, cozy primary suites"
  },
  farmhouse: {
    title: "Modern Elevated Farmhouse",
    desc: "Reclaimed rustic timber, brushed oil-rubbed bronze fixtures, cozy waffle textiles, and warm hearth stone textures.",
    palette: ["#F5F5F0", "#D6C7B2", "#2B2B2A", "#8A5A36"],
    bestFor: "Suburban family homes, Craftsman residences, country estates"
  },
  coastal: {
    title: "Hamptons & Coastal Chic",
    desc: "Crisp airy whites, light bleached oak, woven natural jute, and subtle nautical indigo and sea-glass accents.",
    palette: ["#FFFFFF", "#EFF6FF", "#93C5FD", "#D4C5B9"],
    bestFor: "Beachside properties, lake houses, bright Florida/California listings"
  },
  luxury: {
    title: "High-End Penthouse Luxury",
    desc: "Polished Calacatta marble, brushed brass chandeliers, bespoke velvet seating, and museum-grade curated contemporary art.",
    palette: ["#111827", "#F8FAFC", "#CA8A04", "#713F12"],
    bestFor: "Luxury multi-million dollar estates, penthouses, executive homes"
  },
  midcentury: {
    title: "Mid-Century Modern Classic",
    desc: "Rich American walnut woodwork, iconic tapered silhouettes, warm amber illumination, and geometric wool accent rugs.",
    palette: ["#4A2E18", "#E69A39", "#2E5244", "#EAE6DF"],
    bestFor: "1950s–1970s architectural homes, retro urban bungalows, creative studios"
  }
};

let currentRoom = 'living';
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

  btn.addEventListener('click', () => {
    const isOpen = drawer.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);
  });

  drawer.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      drawer.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
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

  currentRoom = room;
}

function loadHeroRoom(room) {
  switchHeroRoom(room || 'living', null);
}

// --- GALLERY STYLE PRESET SELECTOR ---
function selectGalleryStyle(style, btnEl) {
  document.querySelectorAll('.style-chip').forEach(c => c.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

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

  // Live update theater slider if currentRoom is living
  if (currentRoom === 'living' && typeof styleImages !== 'undefined' && styleImages.living && styleImages.living[style]) {
    const afterEl = document.getElementById('afterImage');
    if (afterEl) afterEl.style.backgroundImage = `url('${styleImages.living[style]}')`;
  }
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
  scrollToSection('demo');
  const matchingPill = document.querySelector(`.sidebar-pills .pill[data-room="${currentRoom}"]`);
  if (matchingPill) {
    loadSample(currentRoom, matchingPill);
  } else {
    loadSample(currentRoom, null);
  }
}

function downloadActiveGallerySample() {
  const data = roomImages[currentRoom] || roomImages['living'];
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
    coastal: 'assets/hero_coastal.jpg'
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

  // Also update gallery theater slider if living room is active
  if (currentRoom === 'living') {
    const afterEl = document.getElementById('afterImage');
    if (afterEl && styleImages.living && styleImages.living[style]) {
      afterEl.style.backgroundImage = `url('${styleImages.living[style]}')`;
    }
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
function runStagingSimulation() {
  const overlay = document.getElementById('renderOverlay');
  const status = document.getElementById('renderStatus');
  const fill = document.getElementById('progressFill');
  const stageBtn = document.getElementById('stageButton');
  const img = document.getElementById('stagedImageDisplay');
  const resultBox = document.getElementById('resultBox');

  if (!overlay || !status || !fill) return;

  // Disable button
  if (stageBtn) {
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
      setTimeout(() => {
        overlay.classList.remove('active');

        if (isUserPhoto) {
          if (img && userUploadedPhoto) img.src = userUploadedPhoto;
          if (resultBox) resultBox.className = `canvas-image-wrap style-filter-${currentStyle}`;
        } else {
          if (img) img.src = getStagedImageForRoom(currentRoom, currentStyle);
          if (resultBox) resultBox.className = `canvas-image-wrap style-filter-${currentStyle}`;
        }

        isShowingBefore = false;
        const cb = document.getElementById('studioCompareBtn');
        if (cb) cb.classList.remove('active');
        updateStudioStatus();

        if (stageBtn) {
          stageBtn.disabled = false;
          stageBtn.textContent = 'Stage this room';
        }
        showToast(`Staging complete — ${styleCapitalized} preview ready!`, 'success');
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

    // Reset compare state
    isShowingBefore = true;
    const cb = document.getElementById('studioCompareBtn');
    if (cb) cb.classList.remove('active');

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
  // Close all
  document.querySelectorAll('.faq-item').forEach(f => f.classList.remove('open'));
  // Toggle clicked
  if (!wasOpen) item.classList.add('open');
}

// --- PRICING MODAL ---
let selectedTier = 'pro';
const tierPrices = {
  single: { name: 'Single Photo Unlock', price: 2.99 },
  pro:    { name: 'Pro Agent Pack (25 Renders)', price: 49.00 }
};

function openPricingModal(context) {
  selectedTier = (context === 'unlock') ? 'single' : 'pro';
  document.getElementById('checkoutModal').classList.add('active');
  document.body.style.overflow = 'hidden';
  selectModalTier(selectedTier);
}

function closePricingModal() {
  document.getElementById('checkoutModal').classList.remove('active');
  document.body.style.overflow = '';
}

function selectModalTier(tier) {
  selectedTier = tier;
  const singleR = document.getElementById('optSingle');
  const proR = document.getElementById('optPro');
  if (singleR) singleR.checked = (tier === 'single');
  if (proR) proR.checked = (tier === 'pro');

  document.querySelectorAll('.modal-opt').forEach(el => el.classList.remove('selected'));
  const activeInput = tier === 'single' ? singleR : proR;
  if (activeInput) activeInput.closest('.modal-opt')?.classList.add('selected');

  updateModalTotal();
}

function updateModalTotal() {
  const base = tierPrices[selectedTier]?.price || 49.00;
  const bump = document.getElementById('bumpCheckbox')?.checked ? 14.00 : 0;
  const total = base + bump;
  const totalEl = document.getElementById('modalTotalAmount');
  if (totalEl) totalEl.textContent = '$' + total.toFixed(2);
}

function completeDemoOrder() {
  const total = document.getElementById('modalTotalAmount')?.textContent || '$49.00';
  closePricingModal();

  const watermark = document.getElementById('watermark');
  if (watermark) watermark.style.display = 'none';

  showToast(`Order placed — ${total}. 4K renders ready for download.`, 'success', 5000);
}

// --- PERSONA QUICK-SELECTOR ENGINE ---
const personaProfiles = {
  solo: {
    title: "Save $2,500+ and 48 hours per listing",
    text: "Stage entire homes in under 60 seconds from your phone. Eliminate BoxBrownie wait times and keep 100% of your seller's momentum.",
    rec: "Recommended: Virtual Twilight & Living Room",
    room: "twilight"
  },
  fsbo: {
    title: "Sell your home 30 days faster with zero MLS risk",
    text: "Eliminate lowball buyer offers on empty rooms. Guaranteed 100% legal under NAR Standard 12-10 with our built-in compliance watermark.",
    rec: "Recommended: Open-Concept Living Room",
    room: "living"
  },
  luxury: {
    title: "Architectural 4K prestige for multi-million dollar listings",
    text: "Curated with Italian bouclé, European white oak, and Calacatta marble. Passes the discerning architectural digest standard.",
    rec: "Recommended: Primary Master Suite & Dining Room",
    room: "bedroom"
  },
  investor: {
    title: "Erase tenant mess & visualize $50,000+ remodel potential",
    text: "Remove hoarder boxes, tenant clutter, and 1980s wood paneling in 15 seconds. Avoid costly price drops on fixer-uppers.",
    rec: "Recommended: Virtual Remodel & Item Removal",
    room: "renovation"
  },
  team: {
    title: "Automated team compliance, centralized billing & seats",
    text: "Protect your brokerage license with automatic compliance watermarking across all 5 to 50+ agent accounts. Unlimited 4K renders.",
    rec: "Recommended: Executive Home Office & Twilight",
    room: "office"
  }
};

function selectPersona(role, btnEl) {
  document.querySelectorAll('.persona-tab').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

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
  if (modal) modal.style.display = 'flex';
}

function closeBrokerageModal() {
  const modal = document.getElementById('brokerageModal');
  if (modal) modal.style.display = 'none';
}

function setTeamSeats(seats, btnEl) {
  selectedTeamSeats = seats;
  document.querySelectorAll('.team-seat-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
}

function submitBrokerageTrial() {
  const name = document.getElementById('brokerTeamName')?.value.trim();
  const email = document.getElementById('brokerEmail')?.value.trim();

  if (!name || !email) {
    showToast('Please enter your brokerage name and email.', 'error');
    return;
  }

  closeBrokerageModal();
  showToast(`Brokerage trial activated for ${name} (${selectedTeamSeats} seats)! Check ${email} for access.`, 'success', 6000);
}

function checkout(plan) {
  if (plan === 'starter') {
    openPricingModal('unlock');
  } else if (plan === 'pro') {
    openPricingModal('pro');
  } else if (plan === 'broker') {
    openBrokerageModal();
  }
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
}

// --- SMOOTH SCROLL ---
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const drawer = document.getElementById('mobileDrawer');
    if (drawer) drawer.classList.remove('open');
  }
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
  document.body.style.overflow = 'hidden';
  switchLegalTab(tab);
}

function closeLegalModal() {
  const modal = document.getElementById('legalModal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function switchLegalTab(tabKey) {
  document.querySelectorAll('.legal-tab').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabKey);
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
