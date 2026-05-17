import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const port = Number(process.env.PORT) || 5180

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css',
}

function resolveFile(urlPath) {
  if (urlPath === '/' || urlPath === '') return path.join(root, 'index.html')
  if (urlPath === '/spec' || urlPath === '/spec/') return path.join(root, '.SPEC', 'index.html')
  if (urlPath.startsWith('/.SPEC/')) return path.join(root, urlPath.slice(1))
  if (urlPath.startsWith('/spec/')) {
    const sub = urlPath.slice('/spec/'.length) || 'index.html'
    return path.join(root, '.SPEC', sub)
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
    if (!file.startsWith(rootResolved)) {
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
    console.log(`Drift       → http://localhost:${port}/`)
    console.log(`Drift Spec  → http://localhost:${port}/spec/`)
  })
