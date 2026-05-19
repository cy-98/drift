import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const vendor = path.join(root, 'vendor/three/build/three.module.js')
const npm = path.join(root, 'node_modules/three/build/three.module.js')
if (!fs.existsSync(vendor) && !fs.existsSync(npm)) {
  console.error('three.js not found — run: npm install  (or keep vendor/three in repo)')
  process.exit(1)
}
