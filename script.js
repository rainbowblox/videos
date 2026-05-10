// videos/script.js - debug widget (usuń lub wyłącz w produkcji)
document.addEventListener('DOMContentLoaded', () => {
  // Elementy strony
  const titleEl = document.getElementById('title');
  const descEl = document.getElementById('description');
  const ratingEl = document.getElementById('rating');
  const releaseEl = document.getElementById('release');
  const qualityEl = document.getElementById('quality');
  const heroImg = document.getElementById('heroImage');

  // Ścieżki względem videos/index.html
  const jsonCandidates = [
    '../meta-data/data.json',
    '../meta-data/titles/data.json',
    '/meta-data/data.json'
  ];
  const imageCandidates = [
    '../meta-data/images/obrazek.jpg',
    '/meta-data/images/obrazek.jpg'
  ];

  // --- Debug widget creation ---
  function createDebugWidget() {
    const w = document.createElement('aside');
    w.className = 'debug-widget';
    w.id = 'debugWidget';
    w.innerHTML = `
      <header>
        <div class="title">Debug metadanych</div>
        <div class="controls">
          <button id="clearDebug" class="btn">Wyczyść</button>
          <button id="disableDebug" class="btn btn-danger">Wyłącz debug</button>
        </div>
      </header>
      <div class="log" id="debugLog"></div>
      <div class="small">Ścieżki testowane: ${jsonCandidates.join(', ')}</div>
    `;
    document.body.appendChild(w);

    document.getElementById('clearDebug').addEventListener('click', () => {
      document.getElementById('debugLog').innerHTML = '';
    });
    document.getElementById('disableDebug').addEventListener('click', () => {
      const el = document.getElementById('debugWidget');
      if (el) el.remove();
      // opcjonalnie: ustaw flagę aby przestać logować
      window.__DEBUG_DISABLED = true;
    });
  }

  function logDebug(message, type = 'info') {
    if (window.__DEBUG_DISABLED) return;
    const log = document.getElementById('debugLog') || (() => { createDebugWidget(); return document.getElementById('debugLog'); })();
    const entry = document.createElement('div');
    entry.className = 'entry ' + (type === 'error' ? 'error' : 'ok');
    const time = new Date().toLocaleTimeString();
    entry.innerHTML = `<div class="small">${time}</div><div>${message}</div>`;
    log.prepend(entry);
  }

  // Ustaw obraz i fallback
  heroImg.onerror = () => {
    logDebug('Obraz nie załadowany: ' + heroImg.src, 'error');
    heroImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340"><rect width="100%" height="100%" fill="#0b1220"/><text x="50%" y="50%" fill="#9aa6b2" font-size="20" text-anchor="middle" dominant-baseline="middle">Brak obrazu</text></svg>'
    );
  };
  heroImg.src = imageCandidates[0];

  // Próba pobrania JSON z listy kandydatów z logowaniem do widżetu
  async function tryFetch(list) {
    for (const path of list) {
      logDebug('Próba pobrania JSON z: ' + path);
      try {
        const resp = await fetch(path, { cache: 'no-store' });
        logDebug('Odpowiedź: ' + resp.status + ' ' + resp.statusText);
        const text = await resp.text();
        logDebug('Otrzymana treść (pierwsze 400 znaków): ' + text.slice(0, 400));
        if (!resp.ok) {
          logDebug('HTTP nie OK dla ' + path + ' (status ' + resp.status + '). Próbuję następnej ścieżki.', 'error');
          continue;
        }
        let data;
        try {
          data = JSON.parse(text);
        } catch (parseErr) {
          logDebug('Błąd parsowania JSON z ' + path + ': ' + parseErr.message, 'error');
          continue;
        }
        logDebug('JSON poprawnie sparsowany z: ' + path);
        return { data, path };
      } catch (networkErr) {
        logDebug('Network error przy pobieraniu ' + path + ': ' + networkErr.message, 'error');
      }
    }
    throw new Error('Nie udało się pobrać JSON z żadnej ścieżki: ' + list.join(', '));
  }

  // Wykonaj fetch i wypełnij stronę
  tryFetch(jsonCandidates)
    .then(({ data, path }) => {
      logDebug('Dane JSON załadowane z ' + path);
      titleEl.textContent = data.title || 'Brak tytułu';
      descEl.textContent = data.description || 'Brak opisu';
      ratingEl.textContent = data.rating || '—';
      releaseEl.textContent = data.release || '—';
      qualityEl.textContent = data.quality || '—';
      if (data.image) {
        const img = data.image.startsWith('/') ? data.image : ('../' + data.image.replace(/^\.?\//, ''));
        heroImg.src = img;
        logDebug('Ustawiono obraz z pola image w JSON: ' + heroImg.src);
      }
    })
    .catch(err => {
      logDebug('Błąd ładowania metadanych: ' + err.message, 'error');
      titleEl.textContent = 'Tytuł niedostępny';
      descEl.textContent = 'Sprawdź Network i widżet debug — szczegóły powyżej.';
    });

  // Przyciski strony
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

  // Utwórz widżet od razu
  createDebugWidget();
});
