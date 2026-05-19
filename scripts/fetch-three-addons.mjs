import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const base = 'https://raw.githubusercontent.com/mrdoob/three.js/r172/examples/jsm'
const files = [
  'postprocessing/EffectComposer.js',
  'postprocessing/RenderPass.js',
  'postprocessing/UnrealBloomPass.js',
  'postprocessing/Pass.js',
  'postprocessing/ShaderPass.js',
  'postprocessing/MaskPass.js',
  'shaders/CopyShader.js',
  'shaders/LuminosityHighPassShader.js',
]

for (const rel of files) {
  const url = `${base}/${rel}`
  const dest = path.join(root, 'vendor/three/examples/jsm', rel)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  fs.writeFileSync(dest, await res.text())
  console.log('wrote', rel)
}
