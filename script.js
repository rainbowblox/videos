// script.js
// Ładuje dane z /meta-data/titles/data.json i wypełnia elementy strony.
// Zakładamy, że data.json ma strukturę:
// {
//   "title": "Witch Hat Atelier",
//   "description": "Coco, a humble dressmaker’s daughter...",
//   "rating": "PG 13",
//   "release": "2026",
//   "quality": "HD"
// }

document.addEventListener('DOMContentLoaded', () => {
  const titleEl = document.getElementById('title');
  const descEl = document.getElementById('description');
  const ratingEl = document.getElementById('rating');
  const releaseEl = document.getElementById('release');
  const qualityEl = document.getElementById('quality');
  const heroImg = document.getElementById('heroImage');

  // Ścieżki podane przez użytkownika
  const jsonPath = '/meta-data/titles/data.json';
  const imagePath = '/meta-data/images/obrazek.jpg';

  // Ustaw obraz (fallback)
  heroImg.src = imagePath;
  heroImg.onerror = () => {
    heroImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340"><rect width="100%" height="100%" fill="#0b1220"/><text x="50%" y="50%" fill="#9aa6b2" font-size="20" text-anchor="middle" dominant-baseline="middle">Brak obrazu</text></svg>'
    );
  };

  // Pobierz JSON z metadanymi
  fetch(jsonPath, {cache: "no-store"})
    .then(resp => {
      if (!resp.ok) throw new Error('Nie udało się pobrać metadanych');
      return resp.json();
    })
    .then(data => {
      // Bezpieczne wypełnienie
      titleEl.textContent = data.title || 'Brak tytułu';
      descEl.textContent = data.description || 'Brak opisu';
      ratingEl.textContent = data.rating || '—';
      releaseEl.textContent = data.release || '—';
      qualityEl.textContent = data.quality || '—';
    })
    .catch(err => {
      alert('Błąd ładowania metadanych:', err);
      titleEl.textContent = 'Tytuł niedostępny';
      descEl.textContent = 'Nie udało się załadować opisu.';
    });

  // Proste akcje przycisków
  document.getElementById('watchBtn').addEventListener('click', () => {
    // Przykładowa akcja: przewiń do sekcji listy
    document.querySelector('.list').scrollIntoView({behavior:'smooth'});
  });

  document.getElementById('trailerBtn').addEventListener('click', () => {
    alert('Zwiastun — funkcja demo.'); // zastąp własną logiką
  });

  document.getElementById('searchBtn').addEventListener('click', () => {
    const q = document.getElementById('searchInput').value.trim();
    if (!q) return;
    // Prosty przykład: przekierowanie do wyszukiwania (możesz zmienić)
    window.location.href = `/search?q=${encodeURIComponent(q)}`;
  });
});
