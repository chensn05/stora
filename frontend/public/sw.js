// Service Worker v2 — network-first for HTML, cache-first for hashed assets
const CACHE = 'stora-v2'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)

  // HTML / navigation: network first, cache fallback
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then((r) => {
          const clone = r.clone()
          caches.open(CACHE).then((c) => c.put(event.request, clone)).catch(() => {})
          return r
        })
        .catch(() => caches.match(event.request))
    )
    return
  }

  // Hashed build assets: cache first (immutable by content hash)
  if (/assets\/index-[\w-]+\.(js|css)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetch(event.request).then((r) => {
          const clone = r.clone()
          caches.open(CACHE).then((c) => c.put(event.request, clone)).catch(() => {})
          return r
        })
      })
    )
    return
  }

  // Static images/fonts: stale-while-revalidate
  if (/\.(png|jpg|jpeg|webp|woff2?|ttf|otf)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetching = fetch(event.request)
          .then((r) => {
            if (r.ok) {
              const clone = r.clone()
              caches.open(CACHE).then((c) => c.put(event.request, clone)).catch(() => {})
            }
            return r
          })
          .catch(() => cached)
        return cached || fetching
      })
    )
    return
  }

  // Everything else: network first
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})
