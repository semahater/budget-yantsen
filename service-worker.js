// SERVICE-WORKER.JS - Поддержка PWA и offline режима
const CACHE_NAME = 'budget-yanzen-v2.1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/config.js',
    '/js/storage.js',
    '/js/sheets-sync.js',
    '/js/ui.js',
    '/js/app.js',
    '/manifest.json',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// Установка Service Worker
self.addEventListener('install', event => {
    console.log('[SW] Установка...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Кеширование файлов');
                return cache.addAll(urlsToCache);
            })
    );
});

// Активация Service Worker
self.addEventListener('activate', event => {
    console.log('[SW] Активация...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Удаление старого кеша:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Обработка запросов
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Возвращаем из кеша или загружаем с сети
                return response || fetch(event.request);
            })
            .catch(() => {
                // Если оффлайн и нет в кеше
                console.log('[SW] Оффлайн режим');
            })
    );
});
