// videos/script.js - produkcyjna wersja z karuzelą 10 tytułów 2026 i ukrytymi socialami
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

  // fallback sample (używane tylko jeśli fetch nie znajdzie listy)
  const sampleList = [
    {"title":"Tytuł A","release":"2026","image":"../meta-data/images/obrazek.jpg","episodes":12,"type":"TV","tags":["fantasy","przygodowe"]},
    {"title":"Tytuł B","release":"2026","image":"../meta-data/images/obrazek.jpg","episodes":24,"type":"TV","tags":["akcja"]},
    {"title":"Tytuł C","release":"2026","image":"../meta-data/images/obrazek.jpg","episodes":null,"type":"ONA","tags":["dramat"]},
    {"title":"Tytuł D","release":"2026","image":"../meta-data/images/obrazek.jpg","episodes":1,"type":"MOVIE","tags":["fantasy"]},
    {"title":"Tytuł E","release":"2026","image":"../meta-data/images/obrazek.jpg","episodes":6,"type":"OVA","tags":["komedia"]},
    {"title":"Tytuł F","release":"2026","image":"../meta-data/images/obrazek.jpg","episodes":13,"type":"TV","tags":["romans"]},
    {"title":"Tytuł G","release":"2026","image":"../meta-data/images/obrazek.jpg","episodes":null,"type":"TV","tags":["mystery"]},
    {"title":"Tytuł H","release":"2026","image":"../meta-data/images/obrazek.jpg","episodes":10,"type":"TV","tags":["slice of life"]},
    {"title":"Tytuł I","release":"2026","image":"../meta-data/images/obrazek.jpg","episodes":3,"type":"OVA","tags":["fantasy"]},
    {"title":"Tytuł J","release":"2026","image":"../meta-data/images/obrazek.jpg","episodes":0,"type":"TV","tags":["akcja"]}
  ];

  // fallback obraz
  heroImg.onerror = () => {
    heroImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340"><rect width="100%" height="100%" fill="#0b1220"/><text x="50%" y="50%" fill="#9aa6b2" font-size="20" text-anchor="middle" dominant-baseline="middle">Brak obrazu</text></svg>'
    );
  };
  heroImg.src = defaultImage;

  // --- social toggle (domyślnie ukryte) ---
  socialWrap.classList.add('hidden');
  toggleSocialBtn.addEventListener('click', () => {
    const hidden = socialWrap.classList.toggle('hidden');
    toggleSocialBtn.textContent = hidden ? 'Pokaż statystyki' : 'Ukryj statystyki';
  });

  // --- fetch helper: spróbuj kilku ścieżek ---
  async function fetchFirst(list) {
    for (const path of list) {
      try {
        const resp = await fetch(path, {cache: 'no-store'});
        if (!resp.ok) {
          // next
          continue;
        }
        const data = await resp.json();
        return data;
      } catch (e) {
        // next
      }
    }
    return null;
  }

  // --- wczytaj dane główne (dla hero) i listę tytułów ---
  (async function init() {
    // najpierw spróbuj wczytać listę tytułów
    let titlesData = await fetchFirst(jsonCandidates);
    if (!titlesData) {
      // spróbuj wczytać pojedynczy plik meta-data jako obiekt i opakować w listę
      const single = await fetchFirst(['../meta-data/data.json','/meta-data/data.json']);
      if (single) {
        // jeśli to pojedynczy obiekt, spróbuj umieścić go jako pierwszy element listy
        titlesData = Array.isArray(single) ? single : [single];
      } else {
        // fallback sample
        titlesData = sampleList;
      }
    }

    // jeśli titlesData jest obiektem z polem "titles" -> użyj go
    if (titlesData && titlesData.titles && Array.isArray(titlesData.titles)) {
      titlesData = titlesData.titles;
    }

    // filtruj po roku 2026 (release może być string lub number)
    const year = '2026';
    const filtered = (Array.isArray(titlesData) ? titlesData : []).filter(t => {
      const r = t.release ? String(t.release) : '';
      return r.includes(year);
    });

    // weź maksymalnie 10; jeśli mniej niż 10, dopełnij sample (jeśli sample dostępny)
    let finalList = filtered.slice(0,10);
    if (finalList.length < 10) {
      // dopełnij z sampleList (unikalne tytuły)
      const extras = sampleList.filter(s => !finalList.find(f => f.title === s.title));
      finalList = finalList.concat(extras).slice(0,10);
    }

    // jeśli mamy pierwszy element, wypełnij hero danymi z pierwszego (lub z osobnego pliku)
    const mainData = finalList[0] || (Array.isArray(titlesData) ? titlesData[0] : null);
    if (mainData) {
      titleEl.textContent = mainData.title || 'Brak tytułu';
      descEl.textContent = mainData.description || descEl.textContent;
      ratingEl.textContent = mainData.rating || ratingEl.textContent;
      releaseEl.textContent = mainData.release || releaseEl.textContent;
      qualityEl.textContent = mainData.quality || qualityEl.textContent;
      // episodes, type, genres
      episodesInfo.textContent = 'Odcinki: ' + (mainData.episodes != null ? mainData.episodes : '—');
      typeInfo.textContent = 'Typ: ' + (mainData.type || (mainData.version || '—'));
      genresInfo.textContent = 'Gatunki: ' + (Array.isArray(mainData.tags) ? mainData.tags.join(', ') : (mainData.genres || '—'));
      if (mainData.image) {
        const img = mainData.image.startsWith('/') ? mainData.image : ('../' + mainData.image.replace(/^\.?\//, ''));
        heroImg.src = img;
      }
      // social (jeśli w danych)
      if (mainData.social) {
        document.getElementById('likes').textContent = mainData.social.likes || document.getElementById('likes').textContent;
        document.getElementById('views').textContent = mainData.social.views || document.getElementById('views').textContent;
        document.getElementById('comments').textContent = mainData.social.comments || document.getElementById('comments').textContent;
      }
    }

    // zbuduj karuzelę
    buildCarousel(finalList);
  })();

  // --- karuzela ---
  let currentIndex = 0;
  function buildCarousel(list) {
    carouselEl.innerHTML = '';
    list.forEach((item, idx) => {
      const a = document.createElement('article');
      a.className = 'card';
      const imgSrc = item.image ? (item.image.startsWith('/') ? item.image : ('../' + item.image.replace(/^\.?\//, ''))) : defaultImage;
      a.innerHTML = `<img src="${imgSrc}" alt="${escapeHtml(item.title)}" />
                     <h3>${escapeHtml(item.title)}</h3>
                     <div class="small">${item.type || '—'} • ${item.episodes != null ? item.episodes + ' ep.' : '—'}</div>`;
      // kliknięcie karty ustawia główny panel na tym tytule
      a.addEventListener('click', () => {
        setMainFromItem(item);
      });
      carouselEl.appendChild(a);
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
    // przesunięcie gridu: ustaw scrollLeft tak, by pokazać currentIndex
    const cardWidth = cards[0].getBoundingClientRect().width + 12; // gap
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
    // social
    if (item.social) {
      document.getElementById('likes').textContent = item.social.likes || document.getElementById('likes').textContent;
      document.getElementById('views').textContent = item.social.views || document.getElementById('views').textContent;
      document.getElementById('comments').textContent = item.social.comments || document.getElementById('comments').textContent;
    }
  }

  // helper: escape HTML for titles
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
});


      (async () => {
  console.log('DOM ready:', document.readyState);
  const ids = ['title','description','heroImage','episodesInfo','typeInfo','genresInfo','carousel','prevBtn','nextBtn','toggleSocial','socialWrap'];
  ids.forEach(id => console.log(id, !!document.getElementById(id)));
  const paths = ['../meta-data/data.json','../meta-data/titles/data.json','/meta-data/data.json'];
  for (const p of paths) {
    try {
      const r = await fetch(p, {cache:'no-store'});
      console.log('FETCH', p, 'status', r.status);
      const txt = await r.text();
      console.log('RESP first 300 chars for', p, ':', txt.slice(0,300));
    } catch(e) {
      console.log('FETCH ERROR', p, e.message);
    }
  }
})();
