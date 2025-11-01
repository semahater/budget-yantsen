// Service Worker для PWA поддержки
// Обработка установки
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker установлен');
  self.skipWaiting();
});

// Обработка активации
self.addEventListener('activate', (event) => {
  console.log('⚡ Service Worker активирован');
  event.waitUntil(clients.claim());
});

// Обработка fetch запросов (offline support)
self.addEventListener('fetch', (event) => {
  // Просто пропускаем запросы - базовый функционал
  // В будущем можно добавить кэширование
});
