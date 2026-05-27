const CACHE = 'drift-shell-v3'

const ASSETS = [
  'index.html',
  'manifest.webmanifest',
  'src/game.js',
  'vendor/three/build/three.module.js',
  'vendor/three/build/three.core.js',
]

function assetUrl(path) {
  return new URL(path, self.location).href
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS.map(assetUrl)))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok && (/\/vendor\/|\/src\//.test(url.pathname))) {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put(event.request, copy))
        }
        return res
      })
      .catch(() =>
        caches.match(event.request).then((hit) => hit || caches.match(assetUrl('index.html'))),
      ),
  )
})
