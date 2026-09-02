/* =========================================================================
   WORDLY — Service Worker
   Задача: сохранить основные файлы приложения в кэше браузера, чтобы
   приложение открывалось и работало даже без интернета.

   Если ты меняешь index.html / style.css / app.js в будущем — не забудь
   увеличить номер CACHE_NAME (например, "wordly-v2"), иначе браузер
   продолжит показывать старые закэшированные файлы.
   ========================================================================= */

const CACHE_NAME = "wordly-v3.6";

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
// Стратегия зависит от типа запроса.
//
// Раньше здесь был «сначала кэш» для всего: офлайн работал, но после
// обновления файлов пользователь мог долго видеть старую версию. Теперь
// навигация и файлы приложения берутся из сети (кэш — запасной вариант),
// а иконки и прочая статика по-прежнему отдаются из кэша.
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isAppShell = request.mode === "navigate" || /\.(html|css|js|json)$/.test(url.pathname);

  if (isAppShell) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});
