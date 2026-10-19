/**
 * 展件專屬詳情頁面邏輯 (Exhibit Detail Script)
 * 專為「鏡紙進行式」元智中語 112 級實務製作成果展打造
 */
(function () {
  'use strict';

  const DOM = {
    errorBanner: document.getElementById('detailErrorBanner'),
    errorMessage: document.getElementById('detailErrorMessage'),
    exhibitMain: document.getElementById('exhibitMain'),
    detailBadge: document.getElementById('detailBadge'),
    detailTitle: document.getElementById('detailTitle'),
    detailDesc: document.getElementById('detailDesc'),
    detailGalleryGrid: document.getElementById('detailGalleryGrid'),
    externalSiteBtn: document.getElementById('externalSiteBtn'),
    externalUrlHint: document.getElementById('externalUrlHint'),
    prevExhibitLink: document.getElementById('prevExhibitLink'),
    prevExhibitName: document.getElementById('prevExhibitName'),
    nextExhibitLink: document.getElementById('nextExhibitLink'),
    nextExhibitName: document.getElementById('nextExhibitName'),
  };

  /**
   * Sanitizes string and removes leading number prefix if needed for display.
   */
  function sanitizeText(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>'"&]/g, (match) => {
      const entities = { '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;', '&': '&amp;' };
      return entities[match] || match;
    });
  }

  function cleanTitleDisplay(title) {
    if (!title) return '';
    return title.trim();
  }

  /**
   * Validates if a URL is safe HTTP/HTTPS.
   */
  function isValidHttpUrl(string) {
    if (!string || typeof string !== 'string') return false;
    try {
      const url = new URL(string.trim());
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  /**
   * Extracts target exhibit ID from query string or hash.
   */
  function getRequestedExhibitId() {
    try {
      const params = new URLSearchParams(window.location.search);
      const queryId = params.get('id');
      if (queryId && queryId.trim()) {
        return queryId.trim();
      }
      const hashId = window.location.hash.replace('#', '').trim();
      if (hashId) {
        return hashId;
      }
    } catch (e) {
      console.warn('URL parsing fallback:', e);
    }
    return '001';
  }

  /**
   * Loads the exhibits dataset either from global memory or via fetch.
   */
  async function loadData() {
    // 1. Try pre-loaded dataset from exhibits-data.js (works even on file:// protocol)
    if (window.EXHIBITS_DATA && Array.isArray(window.EXHIBITS_DATA) && window.EXHIBITS_DATA.length > 0) {
      return window.EXHIBITS_DATA;
    }

    // 2. Try fetching exhibits.json
    try {
      const res = await fetch('exhibits.json', { cache: 'no-cache' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch (err) {
      console.warn('Fetch exhibits.json failed:', err);
    }

    throw new Error('無法載入展件資料，請確認資料檔案是否存在。');
  }

  /**
   * Populates the detail page with the matching exhibit.
   */
  function renderExhibitDetail(exhibits, targetId) {
    // Find target exhibit
    let currentIdx = exhibits.findIndex(item => {
      const idMatch = item.id && item.id.toString() === targetId.toString();
      const titleMatch = item.title && item.title.startsWith(targetId);
      return idMatch || titleMatch;
    });

    if (currentIdx === -1) {
      currentIdx = 0; // Default to first item if ID not matched
    }

    const exhibit = exhibits[currentIdx];
    const total = exhibits.length;

    // Update document title
    document.title = `${exhibit.title}｜鏡紙進行式 · 展件詳情`;

    // Badge and Title
    DOM.detailBadge.textContent = `EXHIBIT · ${exhibit.id || String(currentIdx + 1).padStart(3, '0')}`;
    DOM.detailTitle.textContent = cleanTitleDisplay(exhibit.title);

    // Curatorial Description (100–200 words)
    if (exhibit.description && exhibit.description.trim()) {
      DOM.detailDesc.textContent = exhibit.description.trim();
    } else {
      DOM.detailDesc.textContent = '此展件暫無詳細導覽概述。';
    }

    // Visual Gallery (1-2 images)
    DOM.detailGalleryGrid.innerHTML = '';
    const images = Array.isArray(exhibit.images) && exhibit.images.length > 0
      ? exhibit.images
      : ['assets/images/exhibit-001-1.svg'];

    images.forEach((imgSrc, imgIdx) => {
      const figure = document.createElement('figure');
      figure.className = 'gallery-item';

      const img = document.createElement('img');
      img.src = imgSrc;
      img.alt = `${exhibit.title} - 展示視覺圖 ${imgIdx + 1}`;
      img.loading = 'lazy';
      img.className = 'gallery-img';

      const caption = document.createElement('figcaption');
      caption.className = 'gallery-caption';
      caption.textContent = `圖錄典藏 ${imgIdx + 1}：${exhibit.title.split('｜')[0]}`;

      figure.appendChild(img);
      figure.appendChild(caption);
      DOM.detailGalleryGrid.appendChild(figure);
    });

    // Action Launch Button
    const hasValidUrl = isValidHttpUrl(exhibit.url);
    if (hasValidUrl) {
      DOM.externalSiteBtn.href = exhibit.url.trim();
      DOM.externalSiteBtn.classList.remove('disabled');
      DOM.externalSiteBtn.setAttribute('aria-disabled', 'false');

      try {
        const parsedUrl = new URL(exhibit.url.trim());
        DOM.externalUrlHint.textContent = `展站網址：${parsedUrl.origin}`;
      } catch (_) {
        DOM.externalUrlHint.textContent = '';
      }
    } else {
      DOM.externalSiteBtn.href = '#';
      DOM.externalSiteBtn.classList.add('disabled');
      DOM.externalSiteBtn.setAttribute('aria-disabled', 'true');
      DOM.externalSiteBtn.innerHTML = '<span>展位籌備中・即將公開</span>';
      DOM.externalUrlHint.textContent = '此展位正在進行最終數位測試，敬請期待。';
    }

    // Prev / Next Navigation Setup
    const prevIdx = (currentIdx - 1 + total) % total;
    const nextIdx = (currentIdx + 1) % total;

    const prevExhibit = exhibits[prevIdx];
    const nextExhibit = exhibits[nextIdx];

    const prevId = prevExhibit.id || String(prevIdx + 1).padStart(3, '0');
    const nextId = nextExhibit.id || String(nextIdx + 1).padStart(3, '0');

    DOM.prevExhibitLink.href = `exhibit.html?id=${prevId}`;
    DOM.prevExhibitName.textContent = prevExhibit.title;

    DOM.nextExhibitLink.href = `exhibit.html?id=${nextId}`;
    DOM.nextExhibitName.textContent = nextExhibit.title;
  }

  /**
   * Initializes the detail page.
   */
  async function init() {
    try {
      const targetId = getRequestedExhibitId();
      const exhibits = await loadData();
      renderExhibitDetail(exhibits, targetId);
    } catch (err) {
      console.error('[Exhibit Detail Error]', err);
      if (DOM.errorBanner) {
        DOM.errorBanner.hidden = false;
        DOM.errorBanner.style.display = 'flex';
        DOM.errorMessage.textContent = err.message || '載入展件詳情失敗。';
      }
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
