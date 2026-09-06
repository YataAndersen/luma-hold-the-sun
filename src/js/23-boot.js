  // --- BIND UI SFX ---
  document.querySelectorAll('button, .draft-card, .chapter-btn').forEach(el => {
      el.addEventListener('mouseenter', () => { if (audioInitialized) playUIHover(); });
      el.addEventListener('click', () => { 
          if (!audioInitialized) { initAudio(); audioInitialized = true; }
          if (el.classList.contains('luma-btn-secondary') || el.classList.contains('luma-btn-text') || el.id.includes('close')) {
              playUIBack();
          } else { playUIConfirm(); }
      });
  });
  
  requestAnimationFrame(loop);

  // --- CINEMATIC TRANSITION & PWA ---
  const isReturningFromMap = window.location.search.includes('node=');
  if (isReturningFromMap) {
      const fade = document.getElementById("fade");
      if (fade) {
          fade.style.transition = 'opacity 1.2s ease 0.5s';
          fade.classList.add('active');
          setTimeout(() => {
              const urlParams = new URLSearchParams(window.location.search);
              const nodeId = urlParams.get('node');
              experienceState.mission = HOLD_THE_SUN_MISSIONS.find(m => m.id === nodeId) || HOLD_THE_SUN_MISSIONS[0];
              startGame();
          }, 100);
          setTimeout(() => {
              fade.classList.remove('active');
          }, 1300);
      } else {
          startGame();
      }
  }

  // --- PWA SERVICE WORKER (OFFLINE INSTALL) ---
  if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
          const swCode = `
              const CACHE_NAME = 'luma-cache-v1';
              self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(['/']))); });
              self.addEventListener('fetch', event => { event.respondWith(caches.match(event.request).then(response => response || fetch(event.request))); });
          `;
          const blob = new Blob([swCode], { type: 'application/javascript' });
          const swUrl = URL.createObjectURL(blob);
          navigator.serviceWorker.register(swUrl)
              .then(reg => console.log('Luma Offline PWA Registered'))
              .catch(err => console.log('Luma SW Error:', err));
      });
  }
