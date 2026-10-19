/**
 * Lightweight Exhibition Portal - Curated 12-Exhibit Showcase
 * Architecture: Pure Vanilla JS (Zero Build Tools)
 * Security: Strict URL Scheme Validation & Safe DOM Node Creation
 */

(() => {
  'use strict';

  // Configuration & State
  const CONFIG = {
    dataUrl: 'exhibits.json',
    allowedProtocols: ['http:', 'https:'],
    scrollBehavior: 'smooth'
  };

  const state = {
    exhibits: [],
    filteredExhibits: [],
    isLoading: true,
    lastHighlightedCard: null
  };

  // DOM Elements
  const DOM = {
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    randomBtn: document.getElementById('randomBtn'),
    counterText: document.getElementById('counterText'),
    exhibitGrid: document.getElementById('exhibitGrid'),
    emptyState: document.getElementById('emptyState'),
    resetSearchBtn: document.getElementById('resetSearchBtn'),
    errorBanner: document.getElementById('errorBanner'),
    errorMessage: document.getElementById('errorMessage'),
    retryBtn: document.getElementById('retryBtn')
  };

  // SVG Graphic Templates for Deterministic Abstract Cards
  const ABSTRACT_GRAPHICS = [
    // 0: Concentric Circles / Ripples
    `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="50" cy="50" r="45"/><circle cx="50" cy="50" r="32"/><circle cx="50" cy="50" r="18"/><circle cx="50" cy="50" r="6"/></svg>`,
    // 1: Polygon Diamond / Lattice
    `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="50,5 95,50 50,95 5,50"/><polygon points="50,22 78,50 50,78 22,50"/><circle cx="50" cy="50" r="8"/></svg>`,
    // 2: Sine Waves / Soundscapes
    `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 25 Q 27 5, 50 25 T 95 25"/><path d="M5 50 Q 27 30, 50 50 T 95 50"/><path d="M5 75 Q 27 55, 50 75 T 95 75"/></svg>`,
    // 3: Overlapping Hexagons / Geometry
    `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="50,10 85,30 85,70 50,90 15,70 15,30"/><polygon points="50,25 72,38 72,62 50,75 28,62 28,38"/></svg>`,
    // 4: Radiating Star / Astrolabe
    `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2"><circle cx="50" cy="50" r="42"/><line x1="50" y1="5" x2="50" y2="95"/><line x1="5" y1="50" x2="95" y2="50"/><line x1="18" y1="18" x2="82" y2="82"/><line x1="18" y1="82" x2="82" y2="18"/></svg>`,
    // 5: Fibonacci Spiral / Helix
    `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M50 50 A 5 5 0 0 1 55 50 A 10 10 0 0 1 45 50 A 20 20 0 0 1 65 50 A 32 32 0 0 1 33 50 A 44 44 0 0 1 77 50"/></svg>`
  ];

  /* --------------------------------------------------------------------------
     Security & Validation Layer
     -------------------------------------------------------------------------- */

  /**
   * Strictly validates that the provided string is a valid HTTP/HTTPS URL.
   * Rejects javascript:, data:, file:, relative, or malformed inputs.
   * @param {string} rawUrl 
   * @returns {boolean}
   */
  function isValidHttpUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return false;
    const trimmed = rawUrl.trim();
    if (!trimmed) return false;

    try {
      const parsed = new URL(trimmed);
      return CONFIG.allowedProtocols.includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Sanitizes string input for safe rendering.
   * @param {string} str 
   * @returns {string}
   */
  function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim();
  }

  /* --------------------------------------------------------------------------
     Deterministic Visual Identity Hashing
     -------------------------------------------------------------------------- */

  /**
   * DJB2 String Hash Implementation
   * Generates a stable 32-bit positive integer from string input.
   * @param {string} str 
   * @returns {number}
   */
  function hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // 12 Bespoke Oriental Inks & Mirror-Paper Duotones
  const ORIENTAL_INK_PALETTES = [
    { hue1: 212, hue2: 198, angle: 135 }, // 玄青水鏡 (Deep Ink & Water Mirror)
    { hue1: 348, hue2: 12,  angle: 145 }, // 朱砂丹印 (Cinnabar & Red Seal)
    { hue1: 158, hue2: 178, angle: 125 }, // 竹青墨韻 (Bamboo Green & Ink)
    { hue1: 36,  hue2: 24,  angle: 155 }, // 藤黃古紙 (Rattan Gold & Washi)
    { hue1: 268, hue2: 295, angle: 130 }, // 紫檀鏡影 (Rosewood Mirror)
    { hue1: 188, hue2: 208, angle: 140 }, // 天青冰裂 (Celadon Glaze)
    { hue1: 16,  hue2: 38,  angle: 150 }, // 岱赭簡牘 (Ocher Bamboo Slips)
    { hue1: 232, hue2: 255, angle: 120 }, // 蒼石墨光 (Slate Ink Sheen)
    { hue1: 142, hue2: 168, angle: 160 }, // 碧潭微瀾 (Jade Ripple)
    { hue1: 332, hue2: 358, angle: 135 }, // 胭脂落紙 (Rouge on Paper)
    { hue1: 42,  hue2: 65,  angle: 145 }, // 金箔折光 (Gold Leaf Refraction)
    { hue1: 205, hue2: 225, angle: 125 }  // 月白水光 (Moonlit White & Mirror)
  ];

  /**
   * Derives visual identity tokens from a project title using Oriental Ink harmonies.
   * @param {string} title 
   * @param {number} index 
   */
  function getVisualIdentity(title, index) {
    const hash = hashString(title + (index + 1));
    const palette = ORIENTAL_INK_PALETTES[hash % ORIENTAL_INK_PALETTES.length];
    const graphicIndex = (hash + index) % ABSTRACT_GRAPHICS.length;
    const formattedIndex = String(index + 1).padStart(2, '0');

    return {
      hue1: palette.hue1,
      hue2: palette.hue2,
      angle: `${palette.angle}deg`,
      graphic: ABSTRACT_GRAPHICS[graphicIndex],
      formattedIndex
    };
  }

  /* --------------------------------------------------------------------------
     DOM Node Construction (Safe, zero-XSS)
     -------------------------------------------------------------------------- */

  /**
   * Builds an exhibit card element using explicit DOM manipulation.
   * @param {Object} exhibit 
   * @param {number} displayIndex 
   * @returns {HTMLElement}
   */
  function createExhibitCard(exhibit, displayIndex) {
    const cleanTitle = sanitizeString(exhibit.title);
    const hasValidUrl = isValidHttpUrl(exhibit.url);
    const visual = getVisualIdentity(cleanTitle, displayIndex);

    // Main Card Container
    const card = document.createElement('article');
    card.className = 'exhibit-card';
    card.setAttribute('data-id', displayIndex);
    card.setAttribute('data-title', cleanTitle.toLowerCase());
    
    // Set custom CSS variables for deterministic styling
    card.style.setProperty('--card-hue-1', visual.hue1);
    card.style.setProperty('--card-hue-2', visual.hue2);
    card.style.setProperty('--card-angle', visual.angle);

    // 1. Visual Banner (Header)
    const banner = document.createElement('div');
    banner.className = 'card-visual-banner';
    banner.setAttribute('aria-hidden', 'true');

    const mesh = document.createElement('div');
    mesh.className = 'card-pattern-mesh';
    banner.appendChild(mesh);

    const graphicWrap = document.createElement('div');
    graphicWrap.className = 'card-abstract-graphic';
    graphicWrap.innerHTML = visual.graphic; // Static internal SVG templates only
    banner.appendChild(graphicWrap);

    const badgeRow = document.createElement('div');
    badgeRow.className = 'card-badge-row';

    const indexTag = document.createElement('span');
    indexTag.className = 'card-index-tag';
    indexTag.textContent = `#${visual.formattedIndex}`;

    const catDot = document.createElement('span');
    catDot.className = 'card-category-indicator';

    badgeRow.appendChild(indexTag);
    badgeRow.appendChild(catDot);
    banner.appendChild(badgeRow);

    card.appendChild(banner);

    // 2. Card Content
    const content = document.createElement('div');
    content.className = 'card-content';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'card-title-wrap';

    const titleEl = document.createElement('h2');
    titleEl.className = 'card-title';
    titleEl.textContent = cleanTitle;
    titleWrap.appendChild(titleEl);

    content.appendChild(titleWrap);

    // 3. Card Action Button / Link
    const actionWrap = document.createElement('div');
    actionWrap.className = 'card-action-wrap';

    if (hasValidUrl) {
      const link = document.createElement('a');
      link.className = 'card-btn card-btn-active';
      link.href = exhibit.url.trim();
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', `造訪展品：${cleanTitle}（新視窗開啟）`);

      const btnText = document.createElement('span');
      btnText.textContent = '開鏡觀覽';

      // Safe SVG Arrow Icon
      link.innerHTML = `
        <svg class="card-btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="7" y1="17" x2="17" y2="7"></line>
          <polyline points="7 7 17 7 17 17"></polyline>
        </svg>
      `;
      link.prepend(btnText);
      actionWrap.appendChild(link);
    } else {
      // Disabled button for placeholder exhibits (e.g. 003)
      const disabledBtn = document.createElement('div');
      disabledBtn.className = 'card-btn card-btn-disabled';
      disabledBtn.setAttribute('aria-disabled', 'true');

      const statusPill = document.createElement('span');
      statusPill.className = 'card-status-pill';
      statusPill.textContent = '展位籌備中';

      const statusText = document.createElement('span');
      statusText.textContent = '即將公開';

      disabledBtn.appendChild(statusPill);
      disabledBtn.appendChild(statusText);
      actionWrap.appendChild(disabledBtn);
    }

    content.appendChild(actionWrap);
    card.appendChild(content);

    return card;
  }

  /* --------------------------------------------------------------------------
     State Management & Rendering
     -------------------------------------------------------------------------- */

  /**
   * Renders the current filtered exhibits into the grid.
   */
  function renderExhibits() {
    DOM.exhibitGrid.innerHTML = '';
    const items = state.filteredExhibits;

    if (items.length === 0) {
      DOM.exhibitGrid.style.display = 'none';
      DOM.emptyState.hidden = false;
    } else {
      DOM.exhibitGrid.style.display = 'grid';
      DOM.emptyState.hidden = true;

      const fragment = document.createDocumentFragment();
      items.forEach((item, idx) => {
        const cardEl = createExhibitCard(item, state.exhibits.indexOf(item));
        fragment.appendChild(cardEl);
      });

      DOM.exhibitGrid.appendChild(fragment);
    }

    updateCounter();
  }

  /**
   * Updates the dynamic counter badge.
   */
  function updateCounter() {
    const total = state.exhibits.length;
    const current = state.filteredExhibits.length;
    DOM.counterText.textContent = `Showing ${current} of ${total} exhibits`;
  }

  /**
   * Filters the exhibits collection based on search query.
   * @param {string} query 
   */
  function filterExhibits(query) {
    const q = query.trim().toLowerCase();

    if (!q) {
      state.filteredExhibits = [...state.exhibits];
      DOM.clearSearchBtn.hidden = true;
    } else {
      DOM.clearSearchBtn.hidden = false;
      state.filteredExhibits = state.exhibits.filter(item => {
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        return titleMatch;
      });
    }

    renderExhibits();
  }

  /**
   * Highlights and scrolls to a random visible exhibit.
   */
  function surpriseMe() {
    const cards = DOM.exhibitGrid.querySelectorAll('.exhibit-card');
    if (!cards || cards.length === 0) return;

    // Remove previous spotlight class if any
    if (state.lastHighlightedCard) {
      state.lastHighlightedCard.classList.remove('spotlight-active');
    }

    // Select random card
    const randomIndex = Math.floor(Math.random() * cards.length);
    const targetCard = cards[randomIndex];

    // Scroll into view
    targetCard.scrollIntoView({
      behavior: CONFIG.scrollBehavior,
      block: 'center'
    });

    // Add animation
    targetCard.classList.add('spotlight-active');
    state.lastHighlightedCard = targetCard;

    // Focus link or card for accessibility
    const actionLink = targetCard.querySelector('.card-btn-active');
    if (actionLink) {
      setTimeout(() => actionLink.focus({ preventScroll: true }), 400);
    }

    // Clean up animation class on completion
    targetCard.addEventListener('animationend', () => {
      targetCard.classList.remove('spotlight-active');
    }, { once: true });
  }

  /**
   * Displays an error alert banner with a user-friendly message.
   * @param {string} message 
   */
  function showError(message) {
    DOM.errorMessage.textContent = message || '無法載入展覽資料，請確認網路連線或稍後再試。';
    DOM.errorBanner.hidden = false;
    DOM.errorBanner.classList.add('show');
    DOM.errorBanner.style.setProperty('display', 'flex', 'important');
    DOM.counterText.textContent = '載入失敗';
  }

  /**
   * Clears the error alert banner.
   */
  function hideError() {
    DOM.errorBanner.hidden = true;
    DOM.errorBanner.classList.remove('show');
    DOM.errorBanner.style.setProperty('display', 'none', 'important');
  }

  /**
   * Handles successfully loaded exhibits dataset.
   * @param {Array} data 
   */
  function handleLoadedData(data) {
    if (!Array.isArray(data)) {
      throw new Error('展覽資料格式無效 (需為陣列)');
    }

    state.exhibits = data;
    state.filteredExhibits = [...data];
    state.isLoading = false;

    // Apply any existing search value
    if (DOM.searchInput.value) {
      filterExhibits(DOM.searchInput.value);
    } else {
      renderExhibits();
    }
  }

  /**
   * Asynchronously fetches exhibits.json with embedded fallback for direct file:// execution.
   */
  async function fetchExhibits() {
    hideError();
    state.isLoading = true;
    DOM.counterText.textContent = '連線策展庫...';

    // 1. Try fetching external exhibits.json (standard behavior for http://, https://)
    try {
      if (window.location.protocol === 'file:') {
        // Direct local file opening: modern browsers block fetch() by CORS policy
        throw new Error('FILE_PROTOCOL_CORS');
      }

      const response = await fetch(CONFIG.dataUrl, {
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`伺服器回應異常 (HTTP ${response.status})`);
      }

      const data = await response.json();
      handleLoadedData(data);
      return;
    } catch (err) {
      console.warn('[ExhibitionPortal] Fetch failed or blocked by local environment, activating embedded fallback dataset...', err);

      // 2. Fallback to embedded script tag dataset if available (allows direct double-click file:// opening)
      const fallbackEl = document.getElementById('embeddedExhibits');
      if (fallbackEl && fallbackEl.textContent.trim()) {
        try {
          const fallbackData = JSON.parse(fallbackEl.textContent.trim());
          if (Array.isArray(fallbackData) && fallbackData.length > 0) {
            hideError();
            handleLoadedData(fallbackData);
            return;
          }
        } catch (parseErr) {
          console.error('[ExhibitionPortal] Embedded fallback parse failed:', parseErr);
        }
      }

      console.error('[ExhibitionPortal Error]', err);
      state.isLoading = false;

      let friendlyMsg = `載入展覽資料失敗：${err.message}`;
      if (window.location.protocol === 'file:' || err.name === 'TypeError') {
        friendlyMsg = '瀏覽器本機安全性限制：直接雙擊 HTML 檔案時，瀏覽器安全性原則會封鎖非同步 fetch 請求。請使用本地靜態伺服器（例如：python -m http.server 8000）開啟。';
      }
      showError(friendlyMsg);
    }
  }

  /* --------------------------------------------------------------------------
     Event Listeners & Initialization
     -------------------------------------------------------------------------- */

  function bindEvents() {
    // Instant search input
    DOM.searchInput.addEventListener('input', (e) => {
      filterExhibits(e.target.value);
    });

    // Clear search button
    DOM.clearSearchBtn.addEventListener('click', () => {
      DOM.searchInput.value = '';
      DOM.searchInput.focus();
      filterExhibits('');
    });

    // Reset button in empty state
    DOM.resetSearchBtn.addEventListener('click', () => {
      DOM.searchInput.value = '';
      DOM.searchInput.focus();
      filterExhibits('');
    });

    // Escape key in search input clears filter
    DOM.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && DOM.searchInput.value) {
        DOM.searchInput.value = '';
        filterExhibits('');
      }
    });

    // "Surprise Me" button
    DOM.randomBtn.addEventListener('click', surpriseMe);

    // Retry fetch button in error banner
    DOM.retryBtn.addEventListener('click', () => {
      fetchExhibits();
    });
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    fetchExhibits();
  });

})();
