/*
 * Service worker mínimo para o modo offline.
 * Na instalação, ele guarda a página inicial; depois, cada arquivo estático visitado
 * entra no cache. Assim o app pode reabrir sem rede após a primeira visita online.
 */
const CACHE_PREFIX = "devtrack-shell-";
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const APP_SHELL = ["/", "/manifest.json"];

/** Cria o cache inicial e força o novo worker a assumir a aba assim que possível. */
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

/** Remove apenas versões antigas do nosso shell. */
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

/**
 * Para navegação, a prioridade é rede e depois a página salva; para arquivos estáticos,
 * responde do cache quando existir e guarda a resposta nova para a próxima visita offline.
 */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  /** Recursos de outra origem seguem pelo navegador normalmente. */
  if (new URL(event.request.url).origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).then((response) => { const copy = response.clone(); void caches.open(CACHE_NAME).then((cache) => cache.put("/", copy)); return response; }).catch(() => caches.match("/")));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached ?? fetch(event.request).then((response) => { if (response.ok) { const copy = response.clone(); void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)); } return response; })));
});
