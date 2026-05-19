import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const base = 'https://cdn.jsdelivr.net/npm/three@0.172.0/build'
const out = path.join(root, 'vendor/three/build')
fs.mkdirSync(out, { recursive: true })

for (const name of ['three.module.js', 'three.core.js']) {
  const url = `${base}/${name}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  const text = await res.text()
  if (!text.includes('SPDX-License-Identifier: MIT')) {
    throw new Error(`${name}: unexpected content`)
  }
  const dest = path.join(out, name)
  fs.writeFileSync(dest, text)
  console.log('wrote', name, text.length, 'bytes')
}
