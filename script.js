// --- KARUZELA, STEROWANIE STRZAŁKAMI I AUTO-ADVANCE ---
let currentIndex = 0;
let autoAdvanceTimer = null;
let resumeTimer = null;
const AUTO_INTERVAL_MS = 10000; // 10 sekund
const RESUME_AFTER_MS = 15000; // wznowienie po 15s bezczynności

function buildCarousel(list) {
  if (!carouselEl) return;
  carouselEl.innerHTML = '';
  list.forEach((item, idx) => {
    const card = document.createElement('article');
    card.className = 'card';
    const imgSrc = item.image ? (item.image.startsWith('/') ? item.image : ('../' + item.image.replace(/^\.?\//, ''))) : defaultImage;
    card.innerHTML = `<img src="${imgSrc}" alt="${escapeHtml(item.title)}" />
                      <h3>${escapeHtml(item.title)}</h3>
                      <div class="small">${escapeHtml(item.type || '—')} • ${item.episodes != null ? item.episodes + ' ep.' : '—'}</div>`;
    card.addEventListener('click', () => {
      // kliknięcie karty ustawia główny panel i zatrzymuje auto-advance tymczasowo
      setMainFromItem(item);
      stopAutoAdvanceTemporarily();
      // ustaw currentIndex na klikniętej karcie
      currentIndex = idx;
      updateCarouselView();
    });
    carouselEl.appendChild(card);
  });
  if (carouselTotalEl) carouselTotalEl.textContent = String(list.length);
  currentIndex = 0;
  updateCarouselView();
  startAutoAdvance(); // uruchom auto-advance po zbudowaniu karuzeli
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
  // oblicz szerokość karty (uwzględnia gap)
  const cardRect = cards[0].getBoundingClientRect();
  const gap = 12; // dopasuj jeśli inny w CSS
  const cardWidth = Math.round(cardRect.width + gap);
  // upewnij się, że currentIndex jest w zakresie
  if (currentIndex < 0) currentIndex = 0;
  if (currentIndex >= total) currentIndex = total - 1;
  carouselEl.scrollTo({ left: currentIndex * cardWidth, behavior: 'smooth' });
  carouselIndexEl.textContent = String(currentIndex + 1);
  carouselTotalEl.textContent = String(total);
}

// Obsługa przycisków overlay (strzałki na obrazie)
if (prevBtn) prevBtn.addEventListener('click', () => {
  const total = carouselEl?.children.length || 0;
  if (total === 0) return;
  currentIndex = (currentIndex - 1 + total) % total;
  // ustaw główny panel na nowy element
  const item = getItemAtIndex(currentIndex);
  if (item) setMainFromItem(item);
  updateCarouselView();
  stopAutoAdvanceTemporarily();
});
if (nextBtn) nextBtn.addEventListener('click', () => {
  const total = carouselEl?.children.length || 0;
  if (total === 0) return;
  currentIndex = (currentIndex + 1) % total;
  const item = getItemAtIndex(currentIndex);
  if (item) setMainFromItem(item);
  updateCarouselView();
  stopAutoAdvanceTemporarily();
});

// Pomocnicza funkcja: zwraca obiekt tytułu z karuzeli wg indexu
function getItemAtIndex(idx) {
  const card = carouselEl?.children[idx];
  if (!card) return null;
  // zakładamy, że lista finalList jest dostępna jako window.__carouselData (ustawiamy to w init)
  if (window.__carouselData && Array.isArray(window.__carouselData)) {
    return window.__carouselData[idx] || null;
  }
  // fallback: spróbuj odczytać z DOM (tylko tytuł)
  const title = card.querySelector('h3')?.textContent || null;
  return title ? { title } : null;
}

// AUTO-ADVANCE: start / stop / resume
function startAutoAdvance() {
  stopAutoAdvance(); // upewnij się, że nie ma duplikatów
  autoAdvanceTimer = setInterval(() => {
    const total = carouselEl?.children.length || 0;
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
  // zatrzymaj teraz i wznow po RESUME_AFTER_MS
  stopAutoAdvance();
  resumeTimer = setTimeout(() => {
    startAutoAdvance();
    resumeTimer = null;
  }, RESUME_AFTER_MS);
}

// Upewnij się, że init zapisuje dane karuzeli globalnie, żeby getItemAtIndex działało
// W miejscu, gdzie tworzysz finalList w init(), dodaj:
// window.__carouselData = finalList;
