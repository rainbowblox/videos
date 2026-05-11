// script.js - wersja debug z alertami (usuń alerty po naprawie)
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
    'https://nazwa.github.io/meta-data/titles/data.json',
    'meta-data/titles/data.json',
    'meta-data/data.json',
    '/meta-data/titles/data.json',
    '/meta-data/data.json'
  ];
  const defaultImage = 'meta-data/images/obrazek.jpg';

  // fallback sample
  const sampleList = [
    {"title":"Tytuł A","release":"2026","image":"meta-data/images/obrazek.jpg","episodes":12,"type":"TV","tags":["fantasy","przygodowe"],"description":"Opis Tytuł A","social":{"likes":"12.3k","views":"98.7k","comments":"1.2k"}},
    {"title":"Tytuł B","release":"2026","image":"meta-data/images/obrazek2.jpg","episodes":24,"type":"TV","tags":["akcja"],"description":"Opis Tytuł B"}
  ];

  // normalizacja URL obrazu
  function normalizeImageUrl(imgPath) {
    if (!imgPath) return defaultImage;
    try {
      if (/^https?:\/\//i.test(imgPath)) return imgPath;
      if (imgPath.startsWith('/')) return location.origin + imgPath;
      return new URL(imgPath, location.href).href;
    } catch (e) {
      return defaultImage;
    }
  }

  // fallback obraz
  heroImg.onerror = () => {
    console.log('heroImg.onerror: obraz nie załadowany, ustawiam placeholder');
    heroImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340"><rect width="100%" height="100%" fill="#0b1220"/><text x="50%" y="50%" fill="#9aa6b2" font-size="20" text-anchor="middle" dominant-baseline="middle">Brak obrazu</text></svg>'
    );
  };
  heroImg.src = normalizeImageUrl(defaultImage);
  console.log('Ustawiono heroImg.src na: ' + heroImg.src);

  // social toggle
  if (socialWrap) socialWrap.classList.add('hidden');
  if (toggleSocialBtn) toggleSocialBtn.addEventListener('click', () => {
    if (!socialWrap) { console.log('toggleSocial: brak socialWrap'); return; }
    const hidden = socialWrap.classList.toggle('hidden');
    toggleSocialBtn.textContent = hidden ? 'Pokaż statystyki' : 'Ukryj statystyki';
    console.log('toggleSocial clicked, hidden=' + hidden);
  });

  // fetch helper z alertami
  async function fetchFirst(list) {
    for (const path of list) {
      try {
        console.log('fetchFirst: próbuję ' + path);
        const resp = await fetch(path, { cache: 'no-store' });
        console.log('fetchFirst: status ' + path + ' → ' + resp.status);
        const text = await resp.text();
        console.log('fetchFirst: odpowiedź (pierwsze 300 znaków):\n' + (text ? text.slice(0,300) : '[pusta]'));
        if (!resp.ok) {
          console.log('fetchFirst: HTTP nie OK dla ' + path + ' (' + resp.status + ')');
          continue;
        }
        try {
          const data = JSON.parse(text);
          console.log('fetchFirst: JSON sparsowany z ' + path);
          return { data, path };
        } catch (parseErr) {
          console.log('fetchFirst: błąd parsowania JSON z ' + path + ' → ' + parseErr.message);
          continue;
        }
      } catch (e) {
        console.log('fetchFirst: błąd sieci przy ' + path + ' → ' + e.message);
      }
    }
    console.log('fetchFirst: nie znaleziono poprawnego JSON w listach');
    return null;
  }

  // INIT
  (async function init() {
    console.log('init: start');
    let titlesDataObj = await fetchFirst(jsonCandidates);
    let titlesData = titlesDataObj ? titlesDataObj.data : null;
    if (!titlesData) {
      console.log('init: nie znaleziono głównego JSON, próbuję alternatyw');
      const single = await fetchFirst(['meta-data/data.json','/meta-data/data.json']);
      titlesData = single ? single.data : null;
    }
    if (!titlesData) {
      console.log('init: używam sampleList fallback');
      titlesData = sampleList;
    } else {
      console.log('init: załadowano dane z ' + (titlesDataObj ? titlesDataObj.path : 'unknown'));
    }

    if (titlesData && titlesData.titles && Array.isArray(titlesData.titles)) {
      titlesData = titlesData.titles;
      console.log('init: rozpakowano pole titles, długość: ' + titlesData.length);
    }

    const year = '2026';
    const filtered = (Array.isArray(titlesData) ? titlesData : []).filter(t => {
      const r = t.release ? String(t.release) : '';
      return r.includes(year);
    });
    console.log('init: po filtrze roku 2026 znaleziono: ' + filtered.length);

    let finalList = filtered.slice(0,10);
    if (finalList.length < 10) {
      const extras = sampleList.filter(s => !finalList.find(f => f.title === s.title));
      finalList = finalList.concat(extras).slice(0,10);
      console.log('init: dopełniono finalList do 10 elementów, finalList.length=' + finalList.length);
    }

    window.__carouselData = finalList;
    console.log('init: zapisano window.__carouselData, długość=' + (window.__carouselData || []).length);

    if (finalList.length > 0) {
      setMainFromItem(finalList[0]);
      console.log('init: ustawiono pierwszy element jako main');
    } else {
      alert('init: finalList jest pusty');
    }

    buildCarousel(finalList);
    console.log('init: buildCarousel wywołane');
  })();

  // KARUZELA + STEROWANIE + AUTO-ADVANCE
  let currentIndex = 0;
  let autoAdvanceTimer = null;
  let resumeTimer = null;

  function buildCarousel(list) {
    console.log('buildCarousel: start, list.length=' + (list ? list.length : 0));
    if (!carouselEl) { console.log('buildCarousel: brak elementu #carousel'); return; }
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
        console.log('card click: idx=' + idx + ' title=' + item.title);
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
    console.log('buildCarousel: zakończono, currentIndex=' + currentIndex);
  }

  function updateCarouselView() {
    if (!carouselEl || !carouselIndexEl || !carouselTotalEl) { console.log('updateCarouselView: brak wymaganych elementów DOM'); return; }
    const cards = carouselEl.children;
    const total = cards.length;
    if (total === 0) {
      carouselIndexEl.textContent = '0';
      carouselTotalEl.textContent = '0';
      console.log('updateCarouselView: brak kart w karuzeli');
      return;
    }
    const cardRect = cards[0].getBoundingClientRect();
    const gap = 12;
    const cardWidth = Math.round((cardRect.width || 160) + gap);
    if (currentIndex < 0) currentIndex = 0;
    if (currentIndex >= total) currentIndex = total - 1;
    carouselEl.scrollTo({ left: currentIndex * cardWidth, behavior: 'smooth' });
    carouselIndexEl.textContent = String(currentIndex + 1);
    carouselTotalEl.textContent = String(total);
    console.log('updateCarouselView: przewinięto do index=' + currentIndex + ' (cardWidth=' + cardWidth + ')');
  }

  function getItemAtIndex(idx) {
    if (!window.__carouselData || !Array.isArray(window.__carouselData)) { console.log('getItemAtIndex: brak window.__carouselData'); return null; }
    const item = window.__carouselData[idx] || null;
   console.log('getItemAtIndex: idx=' + idx + ' -> ' + (item ? item.title : 'null'));
    return item;
  }

  if (prevBtn) prevBtn.addEventListener('click', () => {
    console.log('prevBtn clicked');
    const total = (window.__carouselData || []).length;
    if (total === 0) { console.log('prevBtn: brak elementów'); return; }
    currentIndex = (currentIndex - 1 + total) % total;
    const item = getItemAtIndex(currentIndex);
    if (item) {
      console.log('prevBtn: ustawiam main na ' + item.title);
      setMainFromItem(item);
    }
    updateCarouselView();
    stopAutoAdvanceTemporarily();
  });
  if (nextBtn) nextBtn.addEventListener('click', () => {
    alert('nextBtn clicked');
    const total = (window.__carouselData || []).length;
    if (total === 0) { alert('nextBtn: brak elementów'); return; }
    currentIndex = (currentIndex + 1) % total;
    const item = getItemAtIndex(currentIndex);
    if (item) {
      alert('nextBtn: ustawiam main na ' + item.title);
      setMainFromItem(item);
    }
    updateCarouselView();
    stopAutoAdvanceTemporarily();
  });

  function startAutoAdvance() {
    alert('startAutoAdvance: uruchamiam auto-advance co ' + AUTO_INTERVAL_MS + 'ms');
    stopAutoAdvance();
    autoAdvanceTimer = setInterval(() => {
      const total = (window.__carouselData || []).length;
      if (total === 0) { alert('autoAdvance: brak elementów'); return; }
      currentIndex = (currentIndex + 1) % total;
      const item = getItemAtIndex(currentIndex);
      if (item) {
        alert('autoAdvance: ustawiam main na ' + item.title + ' (index=' + currentIndex + ')');
        setMainFromItem(item);
      }
      updateCarouselView();
    }, AUTO_INTERVAL_MS);
  }

  function stopAutoAdvance() {
    if (autoAdvanceTimer) {
      clearInterval(autoAdvanceTimer);
      autoAdvanceTimer = null;
      alert('stopAutoAdvance: timer wyczyszczony');
    }
    if (resumeTimer) {
      clearTimeout(resumeTimer);
      resumeTimer = null;
      alert('stopAutoAdvance: resumeTimer wyczyszczony');
    }
  }

  function stopAutoAdvanceTemporarily() {
    alert('stopAutoAdvanceTemporarily: zatrzymuję auto-advance tymczasowo');
    stopAutoAdvance();
    resumeTimer = setTimeout(() => {
      alert('stopAutoAdvanceTemporarily: wznawiam auto-advance po ' + RESUME_AFTER_MS + 'ms');
      startAutoAdvance();
      resumeTimer = null;
    }, RESUME_AFTER_MS);
  }

  // ustawianie głównego panelu
  function setMainFromItem(item) {
    if (!item) { alert('setMainFromItem: otrzymano null'); return; }
    alert('setMainFromItem: ustawiam dane dla ' + (item.title || '[brak tytułu]'));
    if (titleEl) titleEl.textContent = item.title || titleEl.textContent;
    if (descEl) descEl.textContent = item.description || descEl.textContent;
    if (ratingEl) ratingEl.textContent = item.rating || ratingEl.textContent;
    if (releaseEl) releaseEl.textContent = item.release || releaseEl.textContent;
    if (qualityEl) qualityEl.textContent = item.quality || qualityEl.textContent;
    if (episodesInfo) episodesInfo.textContent = 'Odcinki: ' + (item.episodes != null ? item.episodes : '—');
    if (typeInfo) typeInfo.textContent = 'Typ: ' + (item.type || (item.version || '—'));
    if (genresInfo) genresInfo.textContent = 'Gatunki: ' + (Array.isArray(item.tags) ? item.tags.join(', ') : (item.genres || '—'));
    if (item.image && heroImg) {
      const url = normalizeImageUrl(item.image);
      alert('setMainFromItem: ustawiam heroImg.src = ' + url);
      heroImg.src = url;
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
