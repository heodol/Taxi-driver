const CACHE = "taxi-pwa-v1";
const FILES = ["./", "./index.html", "./manifest.json", "./icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) =>
        c.addAll(FILES).catch(() => c.addAll(["./", "./index.html"])),
      ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches
      .match(e.request)
      .then(
        (r) => r || fetch(e.request).catch(() => caches.match("./index.html")),
      ),
  );
});

// 백그라운드 위치 기록을 위한 메시지 처리
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "START_BACKGROUND_TRACKING") {
    startBackgroundTracking(event.data.date);
  } else if (event.data && event.data.type === "STOP_BACKGROUND_TRACKING") {
    stopBackgroundTracking();
  }
});

let backgroundTrackingInterval = null;

function startBackgroundTracking(date) {
  if (backgroundTrackingInterval) return;

  backgroundTrackingInterval = setInterval(
    () => {
      // Service Worker에서는 navigator.geolocation을 직접 사용할 수 없음
      // 대신 클라이언트에 메시지를 보내 위치 기록 요청
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "RECORD_LOCATION",
            date: date,
          });
        });
      });
    },
    5 * 60 * 1000,
  ); // 5분마다
}

function stopBackgroundTracking() {
  if (backgroundTrackingInterval) {
    clearInterval(backgroundTrackingInterval);
    backgroundTrackingInterval = null;
  }
}
