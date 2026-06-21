// Service worker: deixa o app funcionar offline depois da primeira visita.
const CACHE = 'mexejunto-v37'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./'])))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return
  event.respondWith(
    fetch(request)
      .then((resposta) => {
        const copia = resposta.clone()
        caches.open(CACHE).then((c) => c.put(request, copia))
        return resposta
      })
      .catch(() => caches.match(request).then((r) => r ?? caches.match('./'))),
  )
})
