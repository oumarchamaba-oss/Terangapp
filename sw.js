/* Service worker — Teranga Packaging App
   Stratégie cache-first avec mise à jour en arrière-plan.
   Incrémentez CACHE_VERSION à chaque nouvelle livraison pour forcer le
   rafraîchissement du cache chez les utilisateurs. */

const CACHE_VERSION = "teranga-app-v9";
const CORE_ASSETS = [
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png",
  "./icons/apple-touch-icon.png",
  "./assets/products/boite-burger.jpg",
  "./assets/products/boite-burger-menu-grand.jpg",
  "./assets/products/boite-pizza-petit.jpg",
  "./assets/products/boite-pizza-grand.jpg",
  "./assets/products/boite-gateau-fenetre.jpg",
  "./assets/products/boite-frites.jpg",
  "./assets/products/lunch-box.jpg",
  "./assets/products/salad-bowl-couvercle.jpg",
  "./assets/products/paper-bowl-couvercle.jpg",
  "./assets/products/pot-a-sauce.jpg",
  "./assets/products/gobelet-glace-petit.jpg",
  "./assets/products/gobelet-glace-grand.jpg",
  "./assets/products/gobelet-couvercle.jpg",
  "./assets/products/sac-kraft-poignees.jpg",
  "./assets/products/sac-kraft-poignees-plates.jpg",
  "./assets/products/barquette-2c-fibres.jpg",
  "./assets/products/barquette-alimentaire-kraft.jpg",
  "./assets/products/barquette-2c-plastique.jpg",
  "./assets/products/barquette-2c-plastique-transparente.jpg",
  "./assets/products/barquette-2c-aluminium.jpg",
  "./assets/products/boite-repas-plastique-noire.jpg",
  "./assets/products/boite-repas-plastique-transparente.jpg",
  "./assets/products/bol-plastique-couvercle-noir.jpg",
  "./assets/products/bol-plastique-couvercle-transparent.jpg",
  "./assets/products/gobelet-plastique-dome.jpg",
  "./assets/products/gobelet-plastique-plat.jpg",
  "./assets/products/gobelet-plastique-sans-couvercle.jpg",
  "./assets/products/pot-sauce-plastique-transparent.jpg",
  "./assets/products/couvercle-dome-plastique.jpg",
  "./assets/products/couvercle-plat-plastique.jpg",
  "./assets/products/pot-cosmetique-creme.jpg",
  "./assets/products/flacon-pompe-cosmetique.jpg",
  "./assets/products/flacon-bouchon-basculant.jpg",
  "./assets/products/flacon-spray.jpg",
  "./assets/products/flacon-compte-gouttes.jpg",
  "./assets/products/tube-cosmetique.jpg",
  "./assets/products/flacons-cosmetiques-divers.jpg",
  "./assets/products/flacon-pompe-grand-format.jpg",
  "./assets/products/pot-cosmetique-rond-ambre.jpg",
  "./assets/products/pot-cosmetique-ambre-couvercle-noir.jpg",
  "./assets/products/flacon-pulverisateur-ambre-spray.jpg",
  "./assets/products/flacon-pulverisateur-transparent.jpg",
  "./assets/products/papier-emballage-imprime.jpg",
  "./assets/products/sac-papier-kraft-soufflet.jpg",
  "./assets/products/pochette-papier-kraft-transparente.jpg",
  "./assets/products/sac-papier-kraft-baguette.jpg",
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
