document.addEventListener('DOMContentLoaded', () => {
  const DEBUG = true;

  const say = (msg) => {
    console.log(msg);
    if (DEBUG) alert(String(msg));
  };

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

  const prevBtns = document.querySelectorAll('#prevBtn');
  const nextBtns = document.querySelectorAll('#nextBtn');
  const carouselIndexEls = document.querySelectorAll('#carouselIndex');
  const carouselTotalEls = document.querySelectorAll('#carouselTotal');

  const watchBtn = document.getElementById('watchBtn');
  const trailerBtn = document.getElementById('trailerBtn');
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');

  const jsonCandidates = [
    '../meta-data/images/data.json',
    '/meta-data/images/data.json',
    '../meta-data/data.json',
    '/meta-data/data.json'
  ];

  const defaultImageCandidates = [
    '../meta-data/titles/image.jpg',
    '/meta-data/titles/image.jpg',
    '../meta-data/images/obrazek.jpg',
    '/meta-data/images/obrazek.jpg'
  ];

  const sampleList = [
    {
      title: 'Tytuł A',
      release: '2026',
      image: '../meta-data/titles/image.jpg',
      episodes: 12,
      type: 'TV',
      tags: ['fantasy', 'przygodowe'],
      description: 'Opis Tytuł A',
      social: { likes: '12.3k', views: '98.7k', comments: '1.2k' }
    },
    {
      title: 'Tytuł B',
      release: '2026',
      image: '../meta-data/titles/image.jpg',
      episodes: 24,
      type: 'TV',
      tags: ['akcja'],
      description: 'Opis Tytuł B'
    },
    {
      title: 'Tytuł C',
      release: '2026',
      image: '../meta-data/titles/image.jpg',
      episodes: null,
      type: 'ONA',
      tags: ['dramat'],
      description: 'Opis Tytuł C'
    },
    {
      title: 'Tytuł D',
      release: '2026',
      image: '../meta-data/titles/image.jpg',
      episodes: 1,
      type: 'MOVIE',
      tags: ['fantasy'],
      description: 'Opis Tytuł D'
    },
    {
      title: 'Tytuł E',
      release: '2026',
      image: '../meta-data/titles/image.jpg',
      episodes: 6,
      type: 'OVA',
      tags: ['komedia'],
      description: 'Opis Tytuł E'
    },
    {
      title: 'Tytuł F',
      release: '2026',
      image: '../meta-data/titles/image.jpg',
      episodes: 13,
      type: 'TV',
      tags: ['romans'],
      description: 'Opis Tytuł F'
    },
    {
      title: 'Tytuł G',
      release: '2026',
      image: '../meta-data/titles/image.jpg',
      episodes: null,
      type: 'TV',
      tags: ['mystery'],
      description: 'Opis Tytuł G'
    },
    {
      title: 'Tytuł H',
      release: '2026',
      image: '../meta-data/titles/image.jpg',
      episodes: 10,
      type: 'TV',
      tags: ['slice of life'],
      description: 'Opis Tytuł H'
    },
    {
      title: 'Tytuł I',
      release: '2026',
      image: '../meta-data/titles/image.jpg',
      episodes: 3,
      type: 'OVA',
      tags: ['fantasy'],
      description: 'Opis Tytuł I'
    },
    {
      title: 'Tytuł J',
      release: '2026',
      image: '../meta-data/titles/image.jpg',
      episodes: 0,
      type: 'TV',
      tags: ['akcja'],
      description: 'Opis Tytuł J'
    }
  ];

  let currentIndex = 0;
  const defaultImage = pickFirstWorkingImage(defaultImageCandidates) || '';

  function pickFirstWorkingImage(candidates) {
    return candidates[0] || '';
  }

  function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  function resolveImagePath(raw) {
    if (!raw || typeof raw !== 'string') return defaultImage;

    if (
      raw.startsWith('data:') ||
      raw.startsWith('http://') ||
      raw.startsWith('https://') ||
      raw.startsWith('//')
    ) {
      return raw;
    }

    if (raw.startsWith('/')) return raw;
    if (raw.startsWith('../') || raw.startsWith('./')) return raw;

    return '../meta-data/titles/' + raw.replace(/^\/+/, '');
  }

  function setText(el, value) {
    if (!el) return;
    el.textContent = value;
  }

  function setMainFromItem(item) {
    if (!item) return;

    setText(titleEl, item.title || 'Brak tytułu');
    setText(descEl, item.description || 'Brak opisu');
    setText(ratingEl, item.rating ?? (ratingEl ? ratingEl.textContent : '—'));
    setText(releaseEl, item.release || '—');
    setText(qualityEl, item.quality || (qualityEl ? qualityEl.textContent : '—'));

    setText(episodesInfo, 'Odcinki: ' + (item.episodes != null ? item.episodes : '—'));
    setText(typeInfo, 'Typ: ' + (item.type || item.version || '—'));
    setText(
      genresInfo,
      'Gatunki: ' + (
        Array.isArray(item.tags)
          ? item.tags.join(', ')
          : (item.genres || '—')
      )
    );

    if (heroImg && item.image) {
      heroImg.src = resolveImagePath(item.image);
    }

    if (item.social) {
      const likes = document.getElementById('likes');
      const views = document.getElementById('views');
      const comments = document.getElementById('comments');

      if (likes && item.social.likes) likes.textContent = item.social.likes;
      if (views && item.social.views) views.textContent = item.social.views;
      if (comments && item.social.comments) comments.textContent = item.social.comments;
    }
  }

  function updateCarouselView() {
    if (!carouselEl) return;

    const cards = carouselEl.children;
    const total = cards.length;

    if (total === 0) {
      carouselIndexEls.forEach(el => el.textContent = '0');
      carouselTotalEls.forEach(el => el.textContent = '0');
      return;
    }

    const firstCard = cards[0];
    const cardWidth = firstCard.getBoundingClientRect().width + 12;

    carouselEl.scrollTo({
      left: currentIndex * cardWidth,
      behavior: 'smooth'
    });

    carouselIndexEls.forEach(el => el.textContent = String(currentIndex + 1));
    carouselTotalEls.forEach(el => el.textContent = String(total));
  }

  function buildCarousel(list) {
    if (!carouselEl) {
      say('Brak elementu #carousel w HTML');
      return;
    }

    carouselEl.innerHTML = '';

    list.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'card';

      const imgSrc = resolveImagePath(item.image || defaultImage);
      const title = escapeHtml(item.title || 'Bez tytułu');
      const type = escapeHtml(item.type || '—');
      const epText = item.episodes != null ? `${item.episodes} ep.` : '—';

      card.innerHTML = `
        <img src="${imgSrc}" alt="${title}" />
        <h3>${title}</h3>
        <div class="small">${type} • ${epText}</div>
      `;

      card.addEventListener('click', () => {
        setMainFromItem(item);
      });

      carouselEl.appendChild(card);
    });

    currentIndex = 0;
    updateCarouselView();
  }

  async function fetchFirst(list) {
    for (const path of list) {
      try {
        say('Próba pobrania: ' + path);

        const resp = await fetch(path, { cache: 'no-store' });
        say('Status dla ' + path + ': ' + resp.status);

        if (!resp.ok) continue;

        const data = await resp.json();
        say('JSON OK: ' + path);

        return data;
      } catch (e) {
        say('Błąd dla ' + path + ':\n' + e);
      }
    }

    return null;
  }

  function normalizeTitlesData(data) {
    if (!data) return [];

    if (Array.isArray(data)) return data;

    if (data && Array.isArray(data.titles)) return data.titles;

    return [];
  }

  prevBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const total = carouselEl ? carouselEl.children.length : 0;
      if (!total) return;

      currentIndex = Math.max(0, currentIndex - 1);
      updateCarouselView();
    });
  });

  nextBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const total = carouselEl ? carouselEl.children.length : 0;
      if (!total) return;

      currentIndex = Math.min(total - 1, currentIndex + 1);
      updateCarouselView();
    });
  });

  toggleSocialBtn?.addEventListener('click', () => {
    if (!socialWrap) return;
    const hidden = socialWrap.classList.toggle('hidden');
    toggleSocialBtn.textContent = hidden ? 'Pokaż statystyki' : 'Ukryj statystyki';
  });

  watchBtn?.addEventListener('click', () => {
    document.querySelector('.list')?.scrollIntoView({ behavior: 'smooth' });
  });

  trailerBtn?.addEventListener('click', () => {
    alert('Zwiastun — demo.');
  });

  searchBtn?.addEventListener('click', () => {
    const q = searchInput?.value.trim();
    if (!q) {
      alert('Pole wyszukiwania jest puste');
      return;
    }
    window.location.href = `/search?q=${encodeURIComponent(q)}`;
  });

  async function init() {
    say('INIT START');

    let titlesData = await fetchFirst(jsonCandidates);

    if (!titlesData) {
      say('Nie znaleziono JSON, używam sampleList');
      titlesData = { titles: sampleList };
    }

    const list = normalizeTitlesData(titlesData);
    say('Ilość rekordów po normalizacji: ' + list.length);

    const year = '2026';
    let filtered = list.filter((t) => {
      const r = t && t.release ? String(t.release) : '';
      return r.includes(year);
    });

    say('Po filtrze 2026: ' + filtered.length);

    if (filtered.length === 0) {
      filtered = sampleList;
      say('Filtr dał 0, podstawiam sampleList');
    }

    let finalList = filtered.slice(0, 10);

    if (finalList.length < 10) {
      const extras = sampleList.filter((s) => !finalList.find((f) => f.title === s.title));
      finalList = finalList.concat(extras).slice(0, 10);
      say('Uzupełniono listę do: ' + finalList.length);
    }

    const mainData = finalList[0] || list[0] || sampleList[0];
    if (mainData) {
      setMainFromItem(mainData);
      say('Ustawiono główny tytuł: ' + (mainData.title || 'brak'));
    } else {
      say('Brak danych do pokazania');
    }

    buildCarousel(finalList);
    say('Karuzela zbudowana');
  }

  init().catch((e) => {
    say('Błąd init:\n' + e);
  });
});
