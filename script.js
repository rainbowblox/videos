// videos/script.js - produkcyjna wersja bez debug widget
document.addEventListener('DOMContentLoaded', () => {
  const titleEl = document.getElementById('title');
  const descEl = document.getElementById('description');
  const ratingEl = document.getElementById('rating');
  const releaseEl = document.getElementById('release');
  const qualityEl = document.getElementById('quality');
  const heroImg = document.getElementById('heroImage');

  // Ścieżki względem videos/index.html
  const jsonPath = '../meta-data/data.json';
  const defaultImage = '../meta-data/images/obrazek.jpg';

  // Fallback obrazka
  heroImg.onerror = () => {
    heroImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340"><rect width="100%" height="100%" fill="#0b1220"/><text x="50%" y="50%" fill="#9aa6b2" font-size="20" text-anchor="middle" dominant-baseline="middle">Brak obrazu</text></svg>'
    );
  };
  heroImg.src = defaultImage;

  // Pobierz JSON i wypełnij stronę
  fetch(jsonPath, { cache: 'no-store' })
    .then(resp => {
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      return resp.json();
    })
    .then(data => {
      titleEl.textContent = data.title || 'Brak tytułu';
      descEl.textContent = data.description || 'Brak opisu';
      ratingEl.textContent = data.rating || '—';
      releaseEl.textContent = data.release || '—';
      qualityEl.textContent = data.quality || '—';
      if (data.image) {
        const img = data.image.startsWith('/') ? data.image : ('../' + data.image.replace(/^\.?\//, ''));
        heroImg.src = img;
      }
    })
    .catch(err => {
      // W produkcji logujemy tylko do konsoli
      console.error('Błąd ładowania metadanych:', err);
      titleEl.textContent = 'Tytuł niedostępny';
      descEl.textContent = 'Nie udało się załadować opisu.';
    });

  // Przyciski strony
  document.getElementById('watchBtn')?.addEventListener('click', () => {
    document.querySelector('.list')?.scrollIntoView({ behavior: 'smooth' });
  });
  document.getElementById('trailerBtn')?.addEventListener('click', () => {
    // zastąp własną logiką odtwarzania
    alert('Zwiastun — demo.');
  });
  document.getElementById('searchBtn')?.addEventListener('click', () => {
    const q = document.getElementById('searchInput').value.trim();
    if (!q) return;
    window.location.href = `/search?q=${encodeURIComponent(q)}`;
  });
});
