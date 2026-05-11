// videos/script.js - pełny plik z alert-debug + produkcyjną logiką karuzeli
document.addEventListener('DOMContentLoaded', () => {

  // --- DEBUG ALERT FETCH ---
  // Tymczasowy blok: pokazuje alerty z próbami pobrania JSON (usuń po debugowaniu)
  async function alertDebugFetch() {
    const paths = [
      '../meta-data/titles/data.json',
      '../meta-data/data.json',
      '/meta-data/data.json',
      new URL('../meta-data/titles/data.json', location.href).href,
      new URL('../meta-data/data.json', location.href).href,
      new URL('/meta-data/data.json', location.href).href
    ];
    for (const p of paths) {
      try {
        alert('Próbuję pobrać: ' + p);
        const resp = await fetch(p, { cache: 'no-store' });
        alert('Status dla ' + p + ': ' + resp.status);
        const text = await resp.text();
        alert('Odpowiedź (pierwsze 300 znaków):\n' + (text ? text.slice(0,300) : '[pusta odpowiedź]'));
        if (!resp.ok) {
          alert('HTTP nie OK dla ' + p + ' (status ' + resp.status + '). Próbuję następnej ścieżki.');
          continue;
        }
        try {
          const data = JSON.parse(text);
          const count = Array.isArray(data.titles) ? data.titles.length : (Array.isArray(data) ? data.length : 1);
          alert('JSON sparsowany pomyślnie z: ' + p + '\nLiczba tytułów: ' + count);
          // zwróć dane, jeśli chcesz, żeby init użył ich natychmiast
          return { data, path: p };
        } catch (parseErr) {
          alert('Błąd parsowania JSON z ' + p + ':\n' + parseErr.message);
          continue;
        }
      } catch (netErr) {
        alert('Błąd sieci przy ' + p + ':\n' + netErr.message);
      }
    }
    alert('Debug fetch zakończony: nie znaleziono poprawnego JSON.');
    return null;
  }

  // Jeśli chcesz natychmiast uruchomić debug z alertami, odkomentuj poniższą linię.
  // const debugResultPromise = alertDebugFetch();
  // Jeśli wolisz ręcznie wkleić debug do konsoli, zostaw zakomentowane.

  // --- KONFIGURACJA I ELEMENTY DOM ---
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

  const jsonCandidates = [
    '../meta-data/titles/data.json',
    '../meta-data/data.json',
    '/meta-data/data.json'
  ];
  const defaultImage = '../meta-data/images/obrazek.jpg';

  // prosty fallback sample (używany tylko gdy fetch nic nie zwróci)
  const sampleList = [
    {"title":"Tytuł A","release":"2026","image":"/meta-data/images/obrazek.jpg","episodes":12,"type":"TV","tags":["fantasy","przygodowe"],"description":"Opis Tytuł A","social":{"likes":"12.3k","views":"98.7k","comments":"1.2k"}},
    {"title":"Tytuł B","release":"2026","image":"/meta-data/images/obrazek2.jpg","episodes":24,"type":"TV","tags":["akcja"],"description":"Opis Tytuł B"},
    {"title":"Tytuł C","release":"2026","image":"/meta-data/images/obrazek3.jpg","episodes":null,"type":"ONA","tags":["dramat"],"description":"Opis Tytuł C"},
    {"title":"Tytuł D","release":"2026","image":"/meta-data/images/obrazek4.jpg","episodes":1,"type":"MOVIE","tags":["fantasy"],"description":"Opis Tytuł D"},
    {"title":"Tytuł E","release":"2026","image":"/meta-data/images/obrazek5.jpg","episodes":6,"type":"OVA","tags":["komedia"],"description":"Opis Tytuł E"},
    {"title":"Tytuł F","release":"2026","image":"/meta-data/images/obrazek6.jpg","episodes":13,"type":"TV","tags":["romans"],"description":"Opis Tytuł F"},
    {"title":"Tytuł G","release":"2026","image":"/meta-data/images/obrazek7.jpg","episodes":null,"type":"TV","tags":["mystery"],"description":"Opis Tytuł G"},
    {"title":"Tytuł H","release":"2026","image":"/meta-data/images/obrazek8.jpg","episodes":10,"type":"TV","tags":["slice of life"],"description":"Opis Tytuł H"},
    {"title":"Tytuł I","release":"2026","image":"/meta-data/images/obrazek9.jpg","episodes":3,"type":"OVA","tags":["fantasy"],"description":"Opis Tytuł I"},
    {"title":"Tytuł J","release":"2026","image":"/meta-data/images/obrazek10.jpg","episodes":0,"type":"TV","tags":["akcja"],"description":"Opis Tytuł J"}
  ];

  // fallback obraz
  heroImg.onerror = () => {
    heroImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340"><rect width="100%" height="100%" fill="#0b1220"/><text x="50%" y="50%" fill="#9aa6b2" font-size="20" text-anchor="middle" dominant-baseline="middle">Brak obrazu</text></svg>'
    );
  };
  heroImg.src = defaultImage;

  // social domyślnie ukryte
  if (socialWrap) socialWrap.classList.add('hidden');
  if (toggleSocialBtn) toggleSocialBtn.addEventListener('click', () => {
    if (!socialWrap) return;
    const hidden = socialWrap.classList.toggle('hidden');
    toggleSocialBtn.textContent = hidden ? 'Pokaż statystyki' : 'Ukryj statystyki';
  });

  // fetch helper: spróbuj kilku ścieżek
  async function fetchFirst(list) {
    for (const path of list) {
      try {
        const resp = await fetch(path, {cache: 'no-store'});
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

  // inicjalizacja: najpierw (opcjonalnie) debugResult z alertów, potem normalny fetch
  (async function init() {
    // jeśli chcesz uruchomić alert-debug bez edycji pliku, odkomentuj wywołanie:
    // const debugResult = await alertDebugFetch();
    // if (debugResult) { /* możesz użyć debugResult.data jeśli chcesz */ }

    // normalny fetch
    let titlesDataObj = await fetchFirst(jsonCandidates);
    if (!titlesDataObj) {
      // spróbuj pojedynczego pliku
      const single = await fetchFirst(['../meta-data/data.json','/meta-data/data.json']);
      titlesDataObj = single;
    }

    let titlesData = titlesDataObj ? (titlesDataObj.data) : null;
    if (!titlesData) {
      // fallback
      titlesData = sampleList;
    }

    // jeśli struktura to { titles: [...] }
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

    const mainData = finalList[0] || (Array.isArray(titlesData) ? titlesData[0] : null);
    if (mainData) setMainFromItem(mainData);

    buildCarousel(finalList);
  })();

  // --- KARUZELA I STEROWANIE ---
  let currentIndex = 0;

  function buildCarousel(list) {
    if (!carouselEl) return;
    carouselEl.innerHTML = '';
    list.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'card';
      const imgSrc = item.image ? (item.image.startsWith('/') ? item.image : ('../' + item.image.replace(/^\.?\//, ''))) : defaultImage;
      card.innerHTML = `<img src="${imgSrc}" alt="${escapeHtml(item.title)}" />
                        <h3>${escapeHtml(item.title)}</h3>
                        <div class="small">${escapeHtml(item.type || '—')} • ${item.episodes != null ? item.episodes + ' ep.' : '—'}</div>`;
      card.addEventListener('click', () => setMainFromItem(item));
      carouselEl.appendChild(card);
    });
    if (carouselTotalEl) carouselTotalEl.textContent = String(list.length);
    currentIndex = 0;
    updateCarouselView();
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
    const cardRect = cards[0].getBoundingClientRect();
    const gap = 12;
    const cardWidth = Math.round(cardRect.width + gap);
    carouselEl.scrollTo({ left: currentIndex * cardWidth, behavior: 'smooth' });
    carouselIndexEl.textContent = String(currentIndex + 1);
    carouselTotalEl.textContent = String(total);
  }

  if (prevBtn) prevBtn.addEventListener('click', () => {
    const total = carouselEl.children.length;
    if (total === 0) return;
    currentIndex = (currentIndex - 1 + total) % total;
    updateCarouselView();
  });
  if (nextBtn) nextBtn.addEventListener('click', () => {
    const total = carouselEl.children.length;
    if (total === 0) return;
    currentIndex = (currentIndex + 1) % total;
    updateCarouselView();
  });

  function setMainFromItem(item) {
    if (titleEl) titleEl.textContent = item.title || titleEl.textContent;
    if (descEl) descEl.textContent = item.description || descEl.textContent;
    if (ratingEl) ratingEl.textContent = item.rating || ratingEl.textContent;
    if (releaseEl) releaseEl.textContent = item.release || releaseEl.textContent;
    if (qualityEl) qualityEl.textContent = item.quality || qualityEl.textContent;
    if (episodesInfo) episodesInfo.textContent = 'Odcinki: ' + (item.episodes != null ? item.episodes : '—');
    if (typeInfo) typeInfo.textContent = 'Typ: ' + (item.type || (item.version || '—'));
    if (genresInfo) genresInfo.textContent = 'Gatunki: ' + (Array.isArray(item.tags) ? item.tags.join(', ') : (item.genres || '—'));
    if (item.image && heroImg) {
      const img = item.image.startsWith('/') ? item.image : ('../' + item.image.replace(/^\.?\//, ''));
      heroImg.src = img;
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

  // przyciski strony
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

}); // DOMContentLoaded end
