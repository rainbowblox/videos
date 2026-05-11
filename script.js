// videos/script.js - produkcyjna, odporna wersja
document.addEventListener('DOMContentLoaded', () => {
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

  // prosty fallback sample
  const sampleList = [
    {"title":"Tytuł A","release":"2026","image":"../meta-data/images/obrazek.jpg","episodes":12,"type":"TV","tags":["fantasy","przygodowe"],"description":"Opis Tytuł A","social":{"likes":"12.3k","views":"98.7k","comments":"1.2k"}},
    {"title":"Tytuł B","release":"2026","image":"../meta-data/images/obrazek.jpg","episodes":24,"type":"TV","tags":["akcja"],"description":"Opis Tytuł B"}
    // ... do 10 elementów
  ];

  heroImg.onerror = () => {
    heroImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340"><rect width="100%" height="100%" fill="#0b1220"/><text x="50%" y="50%" fill="#9aa6b2" font-size="20" text-anchor="middle" dominant-baseline="middle">Brak obrazu</text></svg>'
    );
  };
  heroImg.src = defaultImage;

  // social domyślnie ukryte
  socialWrap.classList.add('hidden');
  toggleSocialBtn.addEventListener('click', () => {
    const hidden = socialWrap.classList.toggle('hidden');
    toggleSocialBtn.textContent = hidden ? 'Pokaż statystyki' : 'Ukryj statystyki';
  });

  async function fetchFirst(list) {
    for (const path of list) {
      try {
        const resp = await fetch(path, {cache: 'no-store'});
        if (!resp.ok) {
          console.warn('fetch', path, 'status', resp.status);
          continue;
        }
        const data = await resp.json();
        return data;
      } catch (e) {
        console.warn('fetch error', path, e.message);
      }
    }
    return null;
  }

  (async function init() {
    let titlesData = await fetchFirst(jsonCandidates);
    if (!titlesData) {
      const single = await fetchFirst(['../meta-data/data.json','/meta-data/data.json']);
      titlesData = single ? (Array.isArray(single) ? single : [single]) : sampleList;
    }

    if (titlesData && titlesData.titles && Array.isArray(titlesData.titles)) {
      titlesData = titlesData.titles;
    }

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

  // karuzela
  let currentIndex = 0;
  function buildCarousel(list) {
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
    carouselTotalEl.textContent = String(list.length);
    currentIndex = 0;
    updateCarouselView();
  }

  function updateCarouselView() {
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

  prevBtn.addEventListener('click', () => {
    const total = carouselEl.children.length;
    if (total === 0) return;
    currentIndex = (currentIndex - 1 + total) % total;
    updateCarouselView();
  });
  nextBtn.addEventListener('click', () => {
    const total = carouselEl.children.length;
    if (total === 0) return;
    currentIndex = (currentIndex + 1) % total;
    updateCarouselView();
  });

  function setMainFromItem(item) {
    titleEl.textContent = item.title || titleEl.textContent;
    descEl.textContent = item.description || descEl.textContent;
    ratingEl.textContent = item.rating || ratingEl.textContent;
    releaseEl.textContent = item.release || releaseEl.textContent;
    qualityEl.textContent = item.quality || qualityEl.textContent;
    episodesInfo.textContent = 'Odcinki: ' + (item.episodes != null ? item.episodes : '—');
    typeInfo.textContent = 'Typ: ' + (item.type || (item.version || '—'));
    genresInfo.textContent = 'Gatunki: ' + (Array.isArray(item.tags) ? item.tags.join(', ') : (item.genres || '—'));
    if (item.image) {
      const img = item.image.startsWith('/') ? item.image : ('../' + item.image.replace(/^\.?\//, ''));
      heroImg.src = img;
    }
    if (item.social) {
      document.getElementById('likes').textContent = item.social.likes || document.getElementById('likes').textContent;
      document.getElementById('views').textContent = item.social.views || document.getElementById('views').textContent;
      document.getElementById('comments').textContent = item.social.comments || document.getElementById('comments').textContent;
    }
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]); });
  }

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
