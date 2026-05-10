// script.js - wersja debug z alertami (dla videos/index.html)
document.addEventListener('DOMContentLoaded', () => {
  const titleEl = document.getElementById('title');
  const descEl = document.getElementById('description');
  const ratingEl = document.getElementById('rating');
  const releaseEl = document.getElementById('release');
  const qualityEl = document.getElementById('quality');
  const heroImg = document.getElementById('heroImage');

  const jsonCandidates = [
    '../meta-data/data.json',
    '../meta-data/titles/data.json',
    '/meta-data/data.json'
  ];
  const imageCandidates = [
    '../meta-data/images/obrazek.jpg',
    '/meta-data/images/obrazek.jpg'
  ];

  heroImg.onerror = () => {
    alert('Obraz nie załadowany: ' + heroImg.src);
    heroImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340"><rect width="100%" height="100%" fill="#0b1220"/><text x="50%" y="50%" fill="#9aa6b2" font-size="20" text-anchor="middle" dominant-baseline="middle">Brak obrazu</text></svg>'
    );
  };
  heroImg.src = imageCandidates[0];

  async function tryFetch(list) {
    for (const path of list) {
      try {
        alert('Próba pobrania JSON z: ' + path);
        const resp = await fetch(path, { cache: 'no-store' });
        alert('Odpowiedź dla ' + path + ' → status ' + resp.status);
        const text = await resp.text();
        alert('Otrzymana treść (pierwsze 500 znaków):\n' + text.slice(0, 500));
        if (!resp.ok) {
          alert('HTTP nie OK dla ' + path + ' (status ' + resp.status + '). Próbuję następnej ścieżki.');
          continue;
        }
        let data;
        try {
          data = JSON.parse(text);
        } catch (parseErr) {
          alert('Błąd parsowania JSON z ' + path + ':\n' + parseErr);
          continue;
        }
        alert('JSON poprawnie sparsowany z: ' + path);
        return { data, path };
      } catch (networkErr) {
        alert('Network error przy pobieraniu ' + path + ':\n' + networkErr);
      }
    }
    throw new Error('Nie udało się pobrać JSON z żadnej ścieżki: ' + list.join(', '));
  }

  tryFetch(jsonCandidates)
    .then(({ data, path }) => {
      alert('Dane JSON załadowane z ' + path);
      titleEl.textContent = data.title || 'Brak tytułu';
      descEl.textContent = data.description || 'Brak opisu';
      ratingEl.textContent = data.rating || '—';
      releaseEl.textContent = data.release || '—';
      qualityEl.textContent = data.quality || '—';
      if (data.image) {
        const img = data.image.startsWith('/') ? data.image : ('../' + data.image.replace(/^\.?\//, ''));
        heroImg.src = img;
        alert('Ustawiono obraz z pola image w JSON: ' + heroImg.src);
      }
    })
    .catch(err => {
      alert('Błąd ładowania metadanych:\n' + err);
      titleEl.textContent = 'Tytuł niedostępny';
      descEl.textContent = 'Sprawdź Network i konsolę — szczegóły w alertach.';
    });

  document.getElementById('watchBtn')?.addEventListener('click', () => {
    document.querySelector('.list')?.scrollIntoView({behavior:'smooth'});
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
