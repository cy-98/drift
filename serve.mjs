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

http
  .createServer((req, res) => {
    const url = req.url === '/' ? '/index.html' : req.url.split('?')[0]
    const file = path.join(root, url.replace(/^\//, ''))
    if (!file.startsWith(root)) {
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
  .listen(port, () => console.log(`Drift → http://localhost:${port}/`))
