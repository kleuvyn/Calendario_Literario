const CACHE_NAME = 'calendario-lit-v3'; 
const ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/screenshot-mobile.png', 
  '/screenshot-desktop.png'
];

async function enviarLeiturasPendentes() {
  console.log('PWA: Sincronizando dados pendentes...');
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('PWA: Cacheando arquivos essenciais');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
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
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-leituras') {
    event.waitUntil(enviarLeiturasPendentes()); 
  }
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Calendário Literário', body: 'Sua leitura te espera!' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png'
    })
  );
});