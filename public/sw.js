const CACHE_NAME = 'calendario-lit-v6';
const RUNTIME_CACHE = 'calendario-lit-runtime-v1';
const ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/logo.png',
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
  if (event.request.method !== 'GET') return;

  event.respondWith((async () => {
    const requestURL = new URL(event.request.url);
    const isNavigation = event.request.mode === 'navigate';

    if (isNavigation) {
      try {
        const networkResponse = await fetch(event.request);
        return networkResponse;
      } catch (error) {
        const cached = await caches.match('/offline.html');
        return cached;
      }
    }

    const cachedResponse = await caches.match(event.request);
    if (cachedResponse) return cachedResponse;

    try {
      const networkResponse = await fetch(event.request);
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(event.request, networkResponse.clone());
      return networkResponse;
    } catch (error) {
      return cachedResponse;
    }
  })());
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
      icon: '/logo.png',
      badge: '/logo.png'
    })
  );
});