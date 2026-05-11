// --- KARUZELA, STEROWANIE STRZAŁKAMI I AUTO-ADVANCE (poprawiona wersja) ---
let currentIndex = 0;
let autoAdvanceTimer = null;
let resumeTimer = null;
const AUTO_INTERVAL_MS = 10000; // 10 sekund
const RESUME_AFTER_MS = 15000; // wznowienie po 15s bezczynności

// buildCarousel: tworzy karty i zapisuje dane globalnie
function buildCarousel(list) {
  if (!carouselEl) return;
  // zapisz dane, żeby getItemAtIndex mogło zwracać pełne obiekty
  window.__carouselData = Array.isArray(list) ? list.slice() : [];
  carouselEl.innerHTML = '';
  window.__carouselData.forEach((item, idx) => {
    const card = document.createElement('article');
    card.className = 'card';
    const imgSrc = item.image ? (item.image.startsWith('/') ? item.image : ('../' + item.image.replace(/^\.?\//, ''))) : defaultImage;
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

// updateCarouselView: przewija karuzelę i aktualizuje licznik
function updateCarouselView() {
  if (!carouselEl || !carouselIndexEl || !carouselTotalEl) return;
  const cards = carouselEl.children;
  const total = cards.length;
  if (total === 0) {
    carouselIndexEl.textContent = '0';
    carouselTotalEl.textContent = '0';
    return;
  }
  // oblicz szerokość karty (uwzględnia gap)
  const cardRect = cards[0].getBoundingClientRect();
  const gap = 12; // dopasuj jeśli w CSS masz inną wartość
  const cardWidth = Math.round(cardRect.width + gap);
  // upewnij się, że currentIndex jest w zakresie
  if (currentIndex < 0) currentIndex = 0;
  if (currentIndex >= total) currentIndex = total - 1;
  carouselEl.scrollTo({ left: currentIndex * cardWidth, behavior: 'smooth' });
  carouselIndexEl.textContent = String(currentIndex + 1);
  carouselTotalEl.textContent = String(total);
}

// getItemAtIndex: zwraca obiekt tytułu z zapisanych danych
function getItemAtIndex(idx) {
  if (!window.__carouselData || !Array.isArray(window.__carouselData)) return null;
  return window.__carouselData[idx] || null;
}

// przyciski overlay (strzałki) — teraz ustawiają główny panel
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

// AUTO-ADVANCE: start / stop / resume
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
