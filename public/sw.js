// Nombre del caché
const CACHE_NAME = 'shop-app-cache-v1';

// Archivos a cachear
const urlsToCache = [
  '/',
  '/offline.html',
  '/icons/menu.svg',
  '/icons/cart.svg',
  '/icons/user.svg',
  '/icons/search.svg',
  '/icons/search-black.svg',
  '/icons/orders.svg',
  '/icons/times.svg',
  '/icons/envelope.svg',
  '/icons/big-star.svg',
  '/icons/small-star.svg',
  '/placeholder.jpg',
  '/mercadopago.svg',
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptación de peticiones
self.addEventListener('fetch', (event) => {
  // Solo interceptar peticiones GET
  if (event.request.method !== 'GET') return;

  event.respondWith((async () => {
    const requestUrl = new URL(event.request.url);
    const destination = event.request.destination;

    // 1) No cachear ni interceptar rutas de API -> siempre ir a red
    if (requestUrl.pathname.startsWith('/api')) {
      return fetch(event.request);
    }

    // 2) NO CACHEAR NADA en el detalle del producto - siempre ir a red
    if (requestUrl.pathname.startsWith('/shop/product/')) {
      return fetch(event.request);
    }

    // 3) Para documentos, usar red con fallback offline. No cachear HTML
    if (event.request.mode === 'navigate' || destination === 'document') {
      try {
        return await fetch(event.request);
      } catch {
        return caches.match('/offline.html');
      }
    }

    // 4) Solo cachear assets estáticos (scripts, estilos, imágenes, fuentes)
    const isStaticAsset =
      destination === 'style' ||
      destination === 'script' ||
      destination === 'image' ||
      destination === 'font' ||
      requestUrl.pathname.startsWith('/_next/static') ||
      requestUrl.pathname.startsWith('/icons/') ||
      requestUrl.pathname.endsWith('.svg') ||
      requestUrl.pathname.endsWith('.png') ||
      requestUrl.pathname.endsWith('.jpg') ||
      requestUrl.pathname.endsWith('.jpeg') ||
      requestUrl.pathname.endsWith('.webp') ||
      requestUrl.pathname.endsWith('.woff') ||
      requestUrl.pathname.endsWith('.woff2') ||
      requestUrl.pathname.endsWith('.css') ||
      requestUrl.pathname.endsWith('.js');

    if (!isStaticAsset) {
      // No cachear otros tipos (p.ej. JSON, fetch genérico)
      return fetch(event.request);
    }

    // 5) Cache-first para estáticos
    const cached = await caches.match(event.request);
    if (cached) {
      return cached;
    }

    const response = await fetch(event.request);
    if (response && response.status === 200 && response.type === 'basic') {
      const responseToCache = response.clone();
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, responseToCache);
    }
    return response;
  })());
});