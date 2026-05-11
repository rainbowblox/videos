document.addEventListener('DOMContentLoaded', () => {
  let currentIndex = 0;

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

  const defaultImage = '../meta-data/images/obrazek.jpg';

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  function updateCarouselView() {
    const cards = carouselEl.children;
    const total = cards.length;

    if (total === 0) {
      carouselIndexEl.textContent = '0';
      carouselTotalEl.textContent = '0';
      return;
    }

    const cardWidth = cards[0].getBoundingClientRect().width + 12;
    carouselEl.scrollTo({ left: currentIndex * cardWidth, behavior: 'smooth' });
    carouselIndexEl.textContent = String(currentIndex + 1);
    carouselTotalEl.textContent = String(total);
  }

  function setMainFromItem(item) {
    titleEl.textContent = item.title || titleEl.textContent;
    descEl.textContent = item.description || descEl.textContent;
    ratingEl.textContent = item.rating ?? ratingEl.textContent;
    releaseEl.textContent = item.release || releaseEl.textContent;
    qualityEl.textContent = item.quality || qualityEl.textContent;
    episodesInfo.textContent = 'Odcinki: ' + (item.episodes ?? '—');
    typeInfo.textContent = 'Typ: ' + (item.type || item.version || '—');
    genresInfo.textContent = 'Gatunki: ' + (Array.isArray(item.tags) ? item.tags.join(', ') : (item.genres || '—'));

    if (typeof item.image === 'string' && item.image) {
      heroImg.src = item.image.startsWith('/') ? item.image : ('../' + item.image.replace(/^\.?\//, ''));
    }

    if (item.social) {
      const likes = document.getElementById('likes');
      const views = document.getElementById('views');
      const comments = document.getElementById('comments');
      if (likes) likes.textContent = item.social.likes || likes.textContent;
      if (views) views.textContent = item.social.views || views.textContent;
      if (comments) comments.textContent = item.social.comments || comments.textContent;
    }
  }

  function buildCarousel(list) {
    carouselEl.innerHTML = '';
    list.forEach(item => {
      const card = document.createElement('article');
      card.className = 'card';

      const imgSrc = (typeof item.image === 'string' && item.image)
        ? (item.image.startsWith('/') ? item.image : ('../' + item.image.replace(/^\.?\//, '')))
        : defaultImage;

      card.innerHTML = `
        <img src="${imgSrc}" alt="${escapeHtml(item.title)}" />
        <h3>${escapeHtml(item.title)}</h3>
        <div class="small">${escapeHtml(item.type || '—')} • ${item.episodes != null ? item.episodes + ' ep.' : '—'}</div>
      `;

      card.addEventListener('click', () => setMainFromItem(item));
      carouselEl.appendChild(card);
    });

    currentIndex = 0;
    updateCarouselView();
  }

  prevBtn?.addEventListener('click', () => {
    const total = carouselEl.children.length;
    if (!total) return;
    currentIndex = Math.max(0, currentIndex - 1);
    updateCarouselView();
  });

  nextBtn?.addEventListener('click', () => {
    const total = carouselEl.children.length;
    if (!total) return;
    currentIndex = Math.min(total - 1, currentIndex + 1);
    updateCarouselView();
  });

  document.getElementById('watchBtn')?.addEventListener('click', () => {
    document.querySelector('.list')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('trailerBtn')?.addEventListener('click', () => {
    alert('Zwiastun — demo.');
  });

  document.getElementById('searchBtn')?.addEventListener('click', () => {
    const input = document.getElementById('searchInput');
    const q = input?.value.trim();
    if (!q) return;
    window.location.href = `/search?q=${encodeURIComponent(q)}`;
  });
});
