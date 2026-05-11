// script.js - poprawiona, odporna wersja
document.addEventListener('DOMContentLoaded', () => {
  // DOM
  const titleEl = document.getElementById('title');
  const descEl = document.getElementById('description');
  const ratingEl = document.getElementById('rating');
  const releaseEl = document.getElementById('release');
  const qualityEl = document.getElementById('quality');
  const heroImg = document.getElementById('heroImage');

  const episodesInfo = document.getElementById('episodesInfo');
  const typeInfo = document.getElementById('typeInfo');
  const genresInfo = document.getElementById('genresInfo');

  const toggleSocialBtn = document.getElementById('toggleSocial');
  const socialWrap = document.getElementById('socialWrap');

  const carouselEl = document.getElementById('carousel');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const carouselIndexEl = document.getElementById('carouselIndex');
  const carouselTotalEl = document.getElementById('carouselTotal');

  // konfiguracja
  const AUTO_INTERVAL_MS = 10000; // 10s
  const RESUME_AFTER_MS = 15000; // 15s
  const jsonCandidates = [
    // preferuj absolutny URL jeśli JSON jest hostowany na GitHub Pages pod tym adresem
    'https://nazwa.github.io/meta-data/titles/data.json',
    'meta-data/titles/data.json',
    'meta-data/data.json',
    '/meta-data/titles/data.json',
    '/meta-data/data.json'
  ];
  const defaultImage = 'meta-data/images/obrazek.jpg';

  // fallback sample (tylko gdy fetch nic nie zwróci)
  const sampleList = [
    {"title":"Tytuł A","release":"2026","image":"meta-data/images/obrazek.jpg","episodes":12,"type":"TV","tags":["fantasy","przygodowe"],"description":"Opis Tytuł A","social":{"likes":"12.3k","views":"98.7k","comments":"1.2k"}},
    {"title":"Tytuł B","release":"2026","image":"meta-data/images/obrazek2.jpg","episodes":24,"type":"TV","tags":["akcja"],"description":"Opis Tytuł B"}
  ];

  // pomocnik: normalizuj URL obrazu do absolutnego
  function normalizeImageUrl(imgPath) {
    if (!imgPath) return defaultImage;
    try {
      // jeśli to już pełny URL (http/https) — zwróć go
      if (/^https?:\/\//i.test(imgPath)) return imgPath;
      // jeśli zaczyna się od slash — traktuj jako absolutne względem hosta
      if (imgPath.startsWith('/')) {
        return location.origin + imgPath;
      }
      // w pozostałych przypadkach traktuj jako względne względem bieżącej lokalizacji
      return new URL(imgPath, location.href).href;
    } catch (e) {
      return defaultImage;
    }
  }

  // fallback obraz
  heroImg.onerror = () => {
    heroImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340"><rect width="100%" height="100%" fill="#0b1220"/><text x="50%" y="50%" fill="#9aa6b2" font-size="20" text-anchor="middle" dominant-baseline="middle">Brak obrazu</text></svg>'
    );
  };
  heroImg.src = normalizeImageUrl(defaultImage);

  // social toggle
  if (socialWrap) socialWrap.classList.add('hidden');
  if (toggleSocialBtn) toggleSocialBtn.addEventListener('click', () => {
    if (!socialWrap) return;
    const hidden = socialWrap.classList.toggle('hidden');
    toggleSocialBtn.textContent = hidden ? 'Pokaż statystyki' : 'Ukryj statystyki';
  });

  // fetch helper: spróbuj listy ścieżek
  async function fetchFirst(list) {
    for (const path of list) {
      try {
        const resp = await fetch(path, { cache: 'no-store' });
        if (!resp.ok) {
          console.warn('fetch', path, 'status', resp.status);
          continue;
        }
        const data = await resp.json();
        return { data, path };
      } catch (e) {
        console.warn('fetch error', path, e.message);
      }
    }
    return null;
  }

  // init: pobierz JSON, przygotuj finalList i zbuduj karuzelę
  (async function init() {
    let titlesDataObj = await fetchFirst(jsonCandidates);
    let titlesData = titlesDataObj ? titlesDataObj.data : null;
    if (!titlesData) {
      // spróbuj alternatywnych lokalnych ścieżek
      const single = await fetchFirst(['meta-data/data.json','/meta-data/data.json']);
      titlesData = single ? single.data : null;
    }
    if (!titlesData) titlesData = sampleList;

    if (titlesData && titlesData.titles && Array.isArray(titlesData.titles)) {
      titlesData = titlesData.titles;
    }

    // filtruj po roku 2026
    const year = '2026';
    const filtered = (Array.isArray(titlesData) ? titlesData : []).filter(t => {
      const r = t.release ? String(t.release) : '';
      return r.includes(year);
    });

    let finalList = filtered.slice(0,10);
    if (finalList.length < 10) {
      const extras = sampleList.filter(s => !finalList.find(f => f.title === s.title));
      finalList = finalList.concat(extras).slice(0,10);
    }

    // zapisz globalnie i ustaw pierwszy element
    window.__carouselData = finalList;
    if (finalList.length > 0) setMainFromItem(finalList[0]);

    buildCarousel(finalList);
  })();

  // KARUZELA + STEROWANIE + AUTO-ADVANCE
  let currentIndex = 0;
  let autoAdvanceTimer = null;
  let resumeTimer = null;

  function buildCarousel(list) {
    if (!carouselEl) return;
    window.__carouselData = Array.isArray(list) ? list.slice() : [];
    carouselEl.innerHTML = '';
    window.__carouselData.forEach((item, idx) => {
      const card = document.createElement('article');
      card.className = 'card';
      const imgSrc = normalizeImageUrl(item.image || defaultImage);
      card.innerHTML = `<img src="${imgSrc}" alt="${escapeHtml(item.title)}" />
                        <h3>${escapeHtml(item.title)}</h3>
                        <div class="small">${escapeHtml(item.type || '—')} • ${item.episodes != null ? item.episodes + ' ep.' : '—'}</div>`;
      card.addEventListener('click', () => {
        // ustaw główny panel i zatrzymaj auto-advance tymczasowo
        setMainFromItem(item);
        stopAutoAdvanceTemporarily();
        currentIndex = idx;
        updateCarouselView();
      });
      carouselEl.appendChild(card);
    });
    if (carouselTotalEl) carouselTotalEl.textContent = String(window.__carouselData.length);
    currentIndex = 0;
    updateCarouselView();
    startAutoAdvance();
  }

  function updateCarouselView() {
    if (!carouselEl || !carouselIndexEl || !carouselTotalEl) return;
    const cards = carouselEl.children;
    const total = cards.length;
    if (total === 0) {
      carouselIndexEl.textContent = '0';
      carouselTotalEl.textContent = '0';
      return;
    }
    // jeśli karty jeszcze nie mają wymiarów (rendering), odczekaj krótko
    const cardRect = cards[0].getBoundingClientRect();
    const gap = 12;
    const cardWidth = Math.round((cardRect.width || 160) + gap);
    if (currentIndex < 0) currentIndex = 0;
    if (currentIndex >= total) currentIndex = total - 1;
    carouselEl.scrollTo({ left: currentIndex * cardWidth, behavior: 'smooth' });
    carouselIndexEl.textContent = String(currentIndex + 1);
    carouselTotalEl.textContent = String(total);
  }

  function getItemAtIndex(idx) {
    if (!window.__carouselData || !Array.isArray(window.__carouselData)) return null;
    return window.__carouselData[idx] || null;
  }

  // strzałki: ustawiają główny panel i przewijają karuzelę
  if (prevBtn) prevBtn.addEventListener('click', () => {
    const total = (window.__carouselData || []).length;
    if (total === 0) return;
    currentIndex = (currentIndex - 1 + total) % total;
    const item = getItemAtIndex(currentIndex);
    if (item) setMainFromItem(item);
    updateCarouselView();
    stopAutoAdvanceTemporarily();
  });
  if (nextBtn) nextBtn.addEventListener('click', () => {
    const total = (window.__carouselData || []).length;
    if (total === 0) return;
    currentIndex = (currentIndex + 1) % total;
    const item = getItemAtIndex(currentIndex);
    if (item) setMainFromItem(item);
    updateCarouselView();
    stopAutoAdvanceTemporarily();
  });

  function startAutoAdvance() {
    stopAutoAdvance();
    autoAdvanceTimer = setInterval(() => {
      const total = (window.__carouselData || []).length;
      if (total === 0) return;
      currentIndex = (currentIndex + 1) % total;
      const item = getItemAtIndex(currentIndex);
      if (item) setMainFromItem(item);
      updateCarouselView();
    }, AUTO_INTERVAL_MS);
  }

  function stopAutoAdvance() {
    if (autoAdvanceTimer) {
      clearInterval(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
    if (resumeTimer) {
      clearTimeout(resumeTimer);
      resumeTimer = null;
    }
  }

  function stopAutoAdvanceTemporarily() {
    stopAutoAdvance();
    resumeTimer = setTimeout(() => {
      startAutoAdvance();
      resumeTimer = null;
    }, RESUME_AFTER_MS);
  }

  // ustawianie głównego panelu
  function setMainFromItem(item) {
    if (!item) return;
    if (titleEl) titleEl.textContent = item.title || titleEl.textContent;
    if (descEl) descEl.textContent = item.description || descEl.textContent;
    if (ratingEl) ratingEl.textContent = item.rating || ratingEl.textContent;
    if (releaseEl) releaseEl.textContent = item.release || releaseEl.textContent;
    if (qualityEl) qualityEl.textContent = item.quality || qualityEl.textContent;
    if (episodesInfo) episodesInfo.textContent = 'Odcinki: ' + (item.episodes != null ? item.episodes : '—');
    if (typeInfo) typeInfo.textContent = 'Typ: ' + (item.type || (item.version || '—'));
    if (genresInfo) genresInfo.textContent = 'Gatunki: ' + (Array.isArray(item.tags) ? item.tags.join(', ') : (item.genres || '—'));
    if (item.image && heroImg) {
      heroImg.src = normalizeImageUrl(item.image);
    }
    if (item.social) {
      const likesEl = document.getElementById('likes');
      const viewsEl = document.getElementById('views');
      const commentsEl = document.getElementById('comments');
      if (likesEl) likesEl.textContent = item.social.likes || likesEl.textContent;
      if (viewsEl) viewsEl.textContent = item.social.views || viewsEl.textContent;
      if (commentsEl) commentsEl.textContent = item.social.comments || commentsEl.textContent;
    }
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]); });
  }

  // dodatkowe przyciski
  document.getElementById('watchBtn')?.addEventListener('click', () => {
    document.querySelector('.list')?.scrollIntoView({ behavior: 'smooth' });
  });
  document.getElementById('trailerBtn')?.addEventListener('click', () => {
    alert('Zwiastun — demo.');
  });
  document.getElementById('searchBtn')?.addEventListener('click', () => {
    const q = document.getElementById('searchInput').value.trim();
    if (!q) return;
    window.location.href = `/search?q=${encodeURIComponent(q)}`;
  });
});
