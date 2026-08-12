/* Service worker — Teranga Packaging App
   Stratégie cache-first avec mise à jour en arrière-plan.
   Incrémentez CACHE_VERSION à chaque nouvelle livraison pour forcer le
   rafraîchissement du cache chez les utilisateurs. */

const CACHE_VERSION = "teranga-app-v7";
const CORE_ASSETS = [
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png",
  "./icons/apple-touch-icon.png",
  "./assets/products/boite-burger-kraft.jpg",
  "./assets/products/boite-sandwich-kraft.jpg",
  "./assets/products/boite-pizza-kraft.jpg",
  "./assets/products/boite-patisserie-kraft.jpg",
  "./assets/products/boite-gateau-kraft.jpg",
  "./assets/products/bol-salade-kraft.jpg",
  "./assets/products/gobelet-kraft-chaud.jpg",
  "./assets/products/pot-kraft-couvercle.jpg",
  "./assets/products/porte-gobelets.jpg",
  "./assets/products/sac-kraft-poignees.jpg",
  "./assets/products/bol-kraft-couvercle.jpg",
  "./assets/products/boite-transparente.jpg",
  "./assets/products/barquette-noire-compart.jpg",
  "./assets/products/boite-patisserie-transparente.jpg",
  "./assets/products/gobelet-pet-dome.jpg",
  "./assets/products/pot-sauce-transparent.jpg",
  "./assets/products/barquette-plastique-transparente.jpg",
  "./assets/products/couverts-jetables.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Ne pas intercepter les requêtes vers des origines externes (CDN Firebase, polices...)
  if (new URL(event.request.url).origin !== location.origin) return;
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((resp) => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          }
          return resp;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
