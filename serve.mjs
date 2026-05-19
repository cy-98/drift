import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const port = Number(process.env.PORT) || 5180

const vendorThree = path.join(root, 'vendor', 'three')
const npmThree = path.join(root, 'node_modules', 'three')
const threeRoot = fs.existsSync(path.join(vendorThree, 'build', 'three.module.js'))
  ? vendorThree
  : npmThree

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.wasm': 'application/wasm',
}

if (!fs.existsSync(path.join(threeRoot, 'build', 'three.module.js'))) {
  console.error(
    'Missing Three.js.\n' +
      '  • Run: npm install   (uses node_modules/three)\n' +
      '  • Or ensure vendor/three/build/three.module.js exists',
  )
  process.exit(1)
}

function resolveFile(urlPath) {
  if (urlPath === '/' || urlPath === '') return path.join(root, 'index.html')
  if (urlPath === '/spec' || urlPath === '/spec/') return path.join(root, '.SPEC', 'index.html')
  if (urlPath.startsWith('/.SPEC/')) return path.join(root, urlPath.slice(1))
  if (urlPath.startsWith('/spec/')) {
    const sub = urlPath.slice('/spec/'.length) || 'index.html'
    return path.join(root, '.SPEC', sub)
  }
  if (urlPath.startsWith('/vendor/three/')) {
    const sub = urlPath.slice('/vendor/three/'.length)
    return path.join(threeRoot, sub)
  }
  return path.join(root, urlPath.replace(/^\//, ''))
}

http
  .createServer((req, res) => {
    const urlPath = (req.url || '/').split('?')[0]
    if (urlPath === '/spec') {
      res.writeHead(301, { Location: '/spec/' })
      res.end()
      return
    }
    const file = path.resolve(resolveFile(urlPath))
    const rootResolved = path.resolve(root)
    const threeResolved = path.resolve(threeRoot)
    const allowed =
      file.startsWith(rootResolved) || file.startsWith(threeResolved)
    if (!allowed) {
      res.writeHead(403)
      res.end()
      return
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404)
        res.end('Not found')
        return
      }
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' })
      res.end(data)
    })
  })
  .listen(port, () => {
    const src = threeRoot === vendorThree ? 'vendor/three' : 'node_modules/three'
    console.log(`Drift       → http://localhost:${port}/`)
    console.log(`Drift Spec  → http://localhost:${port}/spec/`)
    console.log(`Three.js    → ${src} (local, no CDN)`)
  })
