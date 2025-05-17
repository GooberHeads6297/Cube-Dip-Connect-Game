const CACHE_NAME = 'blockfell-connect-cache-v1';
const urlsToCache = [
    './', // Alias for index.html
    './index.html',
    './tetris.js',
    // Add paths to your icons here. They should match what's in manifest.json
    './icons/icon-72x72.png',
    './icons/icon-96x96.png',
    './icons/icon-128x128.png',
    './icons/icon-144x144.png',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png'
    // If you had other assets like CSS files or game-specific images, you'd list them here.
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache and caching assets');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) { // Cache hit - return response
                    return response;
                }
                // Not in cache - fetch from network
                return fetch(event.request);
            })
    );
});

self.addEventListener('activate', event => {
    // Optional: Remove old caches if CACHE_NAME changes
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(caches.keys().then(cacheNames => Promise.all(cacheNames.map(cacheName => {if (cacheWhitelist.indexOf(cacheName) === -1) {return caches.delete(cacheName);}}))));
});