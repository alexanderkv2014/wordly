/* =========================================================================
   WORDLY — Service Worker
   Задача: сохранить основные файлы приложения в кэше браузера, чтобы
   приложение открывалось и работало даже без интернета.

   Если ты меняешь index.html / style.css / app.js в будущем — не забудь
   увеличить номер CACHE_NAME (например, "wordly-v2"), иначе браузер
   продолжит показывать старые закэшированные файлы.
   ========================================================================= */

const CACHE_NAME = "wordly-v2";

// Список файлов, которые нужно сохранить для офлайн-работы
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png"
];

// Событие "install" — срабатывает один раз при первой установке
// Service Worker. Здесь мы кладём все нужные файлы в кэш.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting(); // сразу активировать новый Service Worker
});

// Событие "activate" — срабатывает при активации нового Service Worker.
// Здесь мы удаляем старые версии кэша, если они остались с прошлого раза.
self.addEventListener("activate", (event) => {
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

// Событие "fetch" — срабатывает при каждом запросе файла (страница, стиль,
// скрипт и т.д.). Стратегия "сначала кэш": если файл есть в кэше — отдаём
// его сразу (это и даёт офлайн-работу). Если нет — пробуем загрузить из
// интернета.
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
