const CACHE_NAME = 'checkhost-v2.1';

// Core assets to cache on install (Static only)
const STATIC_CACHE = [
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
];

// Install: pre-cache core static pages
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate: clean up old caches
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

// Fetch strategy:
// - API calls: Network First (always fresh data)
// - Static assets (_next, icons, etc.): Cache First
// - Pages: Stale While Revalidate
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET and cross-origin
    if (request.method !== 'GET' || url.origin !== self.location.origin) {
        return;
    }

    // API routes and Auth routes: always go to network, never cache
    if (url.pathname.startsWith('/api/') || url.pathname.includes('/auth/')) {
        event.respondWith(
            fetch(request).catch(() => {
                if (url.pathname.startsWith('/api/')) {
                    return new Response(
                        JSON.stringify({ error: 'Offline', message: 'Network unavailable' }),
                        { status: 503, headers: { 'Content-Type': 'application/json' } }
                    );
                }
                // For HTML auth pages, if offline, we can't do much
                return new Response('Offline', { status: 503 });
            })
        );
        return;
    }

    // Static assets (Next.js chunks, images): Cache First
    if (
        url.pathname.startsWith('/_next/static') ||
        url.pathname.startsWith('/icons/') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.svg') ||
        url.pathname.endsWith('.ico')
    ) {
        event.respondWith(
            caches.match(request).then((cached) => {
                return cached || fetch(request).then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    return response;
                });
            })
        );
        return;
    }

    // HTML pages: Stale-While-Revalidate
    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(request).then((cached) => {
                const networkFetch = fetch(request).then((response) => {
                    if (response.ok) {
                        cache.put(request, response.clone());
                    }
                    return response;
                }).catch(() => {
                    // Offline fallback for pages
                    return cached || new Response(
                        '<html><body><h1>CheckHost.top</h1><p>You are currently offline. Please check your connection.</p></body></html>',
                        { status: 503, headers: { 'Content-Type': 'text/html' } }
                    );
                });
                return cached || networkFetch;
            });
        })
    );
});
