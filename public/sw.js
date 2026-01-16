const CACHE_NAME = 'calendario-lit-v4'; // Aumentei a versão para forçar atualização
const ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/screenshot-mobile.png', 
  '/screenshot-desktop.png'
];

async function enviarLeiturasPendentes() {
  console.log('PWA: Sincronizando dados...');
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim(); 
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((response) => {
        if (response) return response;
        if (event.request.mode === 'navigate') return caches.match('/');
      });
    })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-leituras') event.waitUntil(enviarLeiturasPendentes()); 
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Calendário Literário', body: 'Hora da leitura!' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png'
    })
  );
});