// Hämtar alltid från nätet först så att uppdateringar kommer fram direkt.
// Cachen används bara när telefonen saknar täckning.
const CACHE = 'promenader-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(svar => {
        const kopia = svar.clone();
        caches.open(CACHE).then(c => c.put(e.request, kopia));
        return svar;
      })
      .catch(() => caches.match(e.request))
  );
});
