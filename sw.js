// Hämtar alltid från nätet först så att uppdateringar kommer fram direkt.
// Cachen används bara när telefonen saknar täckning. no-cache gör att
// webbläsaren alltid frågar GitHub om filen ändrats, annars kan den visa
// en upp till tio minuter gammal version.
const CACHE = 'promenader-v2';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys()
    .then(namn => Promise.all(namn.filter(n => n !== CACHE).map(n => caches.delete(n))))
    .then(() => self.clients.claim())
));

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then(svar => {
        const kopia = svar.clone();
        caches.open(CACHE).then(c => c.put(e.request, kopia));
        return svar;
      })
      .catch(() => caches.match(e.request))
  );
});
