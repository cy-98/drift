import * as THREE from 'https://esm.sh/three@0.172.0'
import { loadSettings, saveSettings } from './settings.js'
import { createWorld } from './world.js'
import { createInput } from './input.js'
import { createPois } from './pois.js'
import { createNav } from './nav.js'
import { createAudio } from './audio.js'
import { createTouch } from './touch.js'
import { createGamepad } from './gamepad.js'
import { createWormholes } from './wormhole.js'
import { createStations } from './stations.js'
import { createConstellation } from './constellation.js'

const canvas = document.getElementById('canvas')
const prompt = document.getElementById('prompt')
const speedEl = document.getElementById('speed')
const altEl = document.getElementById('alt')
const fpsEl = document.getElementById('fps')
const targetEl = document.getElementById('target')
const distEl = document.getElementById('dist')
const compass = document.getElementById('compass')
const loreToast = document.getElementById('lore')
const settingsPanel = document.getElementById('settings')
const sensInput = document.getElementById('sens')
const speedInput = document.getElementById('speed-range')
const reducedInput = document.getElementById('reduced')
const bloomInput = document.getElementById('bloom')
const ambientInput = document.getElementById('ambient')
const vignetteInput = document.getElementById('vignette')
const qualityInput = document.getElementById('quality')
const loadingEl = document.getElementById('loading')
const webglError = document.getElementById('webgl-error')

const LOAD_START = performance.now()
const MIN_LOAD_MS = 1200
let loadingDone = false
let readyFrames = 0
let photoMode = false

let input = null
let wormholes = null
let stations = null
let constellation = null
const worldState = {}

function hideLoading() {
  if (loadingDone || !loadingEl) return
  const delay = Math.max(0, MIN_LOAD_MS - (performance.now() - LOAD_START))
  setTimeout(() => {
    loadingEl.classList.add('out')
    loadingEl.setAttribute('aria-busy', 'false')
    loadingEl.setAttribute('aria-hidden', 'true')
    document.body.classList.remove('is-loading')
    loadingDone = true
    input?.showStartGuide()
    setTimeout(() => loadingEl.remove(), 850)
  }, delay)
}

let settings = loadSettings()
let world = null
let pois = null

function showWebglError() {
  webglError?.classList.add('show')
  loadingEl?.classList.add('out')
}

let renderer
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: settings.quality !== 'low' })
  if (!renderer.getContext()) {
    renderer.dispose()
    renderer = null
  }
} catch {
  renderer = null
}
if (!renderer) {
  showWebglError()
}

if (renderer) {
  renderer.setPixelRatio(
    settings.quality === 'low' ? 1 : Math.min(window.devicePixelRatio, settings.quality === 'high' ? 2 : 1.5),
  )
  renderer.setClearColor(0x030810, 1)
}

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(68, 1, 0.1, 800)
camera.position.set(0, 0, 0)

const audio = createAudio(() => settings)

let loreTimer = 0
function showLore(title, text) {
  loreToast.querySelector('strong').textContent = title
  loreToast.querySelector('p').textContent = text
  loreToast.classList.add('show')
  loreTimer = 6
}

const hud = {
  prompt,
  speedEl,
  altEl,
  targetEl,
  distEl,
  compass,
  flashTarget(name) {
    targetEl.textContent = name
    targetEl.classList.add('flash')
    setTimeout(() => targetEl.classList.remove('flash'), 400)
  },
}

function applyVignette() {
  document.body.classList.toggle('vignette-on', !!settings.vignette && !photoMode)
}

function togglePhotoMode() {
  if (!loadingDone) return
  photoMode = !photoMode
  document.body.classList.toggle('photo-mode', photoMode)
  applyVignette()
  if (photoMode) {
    document.exitPointerLock?.()
    showLore('截图模式', 'UI 已隐藏，按 P 退出。')
    loreTimer = 4
  }
}

function rebuildWorld() {
  wormholes?.dispose()
  stations?.dispose()
  constellation?.dispose()
  pois?.dispose()
  for (const child of [...scene.children]) scene.remove(child)
  world = createWorld(scene, settings)
  pois = createPois(scene, settings)
  wormholes = createWormholes(scene)
  stations = createStations(scene)
  constellation = createConstellation(scene)
}

function syncSettingsForm() {
  sensInput.value = settings.sensitivity
  speedInput.value = settings.baseSpeed
  reducedInput.checked = settings.reducedMotion
  bloomInput.checked = settings.bloom
  ambientInput.checked = settings.ambient
  vignetteInput.checked = settings.vignette
  qualityInput.value = settings.quality
  document.getElementById('sens-val').textContent = settings.sensitivity.toFixed(1)
  document.getElementById('speed-val').textContent = settings.baseSpeed.toFixed(1)
}

function applySettingsFromForm() {
  const prev = { ...settings }
  settings = {
    sensitivity: Number(sensInput.value),
    baseSpeed: Number(speedInput.value),
    reducedMotion: reducedInput.checked,
    bloom: bloomInput.checked,
    ambient: ambientInput.checked,
    vignette: vignetteInput.checked,
    quality: qualityInput.value,
  }
  saveSettings(settings)
  audio.syncVolume()
  applyVignette()
  if (
    prev.reducedMotion !== settings.reducedMotion ||
    prev.bloom !== settings.bloom ||
    prev.quality !== settings.quality
  ) {
    renderer.setPixelRatio(
      settings.quality === 'low' ? 1 : Math.min(window.devicePixelRatio, settings.quality === 'high' ? 2 : 1.5),
    )
    rebuildWorld()
  }
}

function toggleSettings() {
  const open = !settingsPanel.classList.contains('open')
  settingsPanel.classList.toggle('open', open)
  settingsPanel.setAttribute('aria-hidden', open ? 'false' : 'true')
  if (open) {
    document.exitPointerLock?.()
    syncSettingsForm()
  }
}

function resize() {
  const w = window.innerWidth
  const h = window.innerHeight
  if (renderer) renderer.setSize(w, h, false)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}

resize()
window.addEventListener('resize', resize)

let elapsed = 0
let last = performance.now()
let fpsFrames = 0
let fpsTick = performance.now()

function updateFps(now) {
  if (!fpsEl) return
  fpsFrames += 1
  const dt = now - fpsTick
  if (dt < 400) return
  fpsEl.textContent = String(Math.round((fpsFrames * 1000) / dt))
  fpsFrames = 0
  fpsTick = now
}

function loop(now) {
  updateFps(now)
  if (!renderer || !world) {
    requestAnimationFrame(loop)
    return
  }
  const dt = Math.min((now - last) / 1000, 0.05)
  last = now
  elapsed += dt

  if (!loadingDone) {
    const drift = settings.reducedMotion ? 1.2 : 2.8
    camera.position.z -= drift * dt
    world.update(elapsed, camera, dt, worldState)
    if (worldState.clearColor) renderer.setClearColor(worldState.clearColor, 1)
    if (pois) pois.update(elapsed, camera, dt, showLore)
    renderer.render(scene, camera)
    readyFrames += 1
    if (readyFrames >= 2) hideLoading()
    requestAnimationFrame(loop)
    return
  }

  if (!photoMode) input.updateMovement(dt)
  world.update(elapsed, camera, dt, worldState)
  if (worldState.clearColor) renderer.setClearColor(worldState.clearColor, 1)
  if (pois) pois.update(elapsed, camera, dt, showLore)
  stations?.update(elapsed, camera)
  wormholes?.update(elapsed, camera, dt, showLore)
  if (constellation && pois) {
    constellation.update(() => pois.list().map((p) => p.position))
  }
  nav.update()
  if (loreTimer > 0) {
    loreTimer -= dt
    if (loreTimer <= 0) loreToast.classList.remove('show')
  }
  const flash = wormholes?.getFlash?.() ?? 0
  if (flash > 0) renderer.setClearColor(0x1a4060, 1)
  renderer.render(scene, camera)
  requestAnimationFrame(loop)
}

if (renderer) {
  try {
    rebuildWorld()
    syncSettingsForm()
    applyVignette()
  } catch (err) {
  console.error(err)
  const sub = document.getElementById('loading-sub')
    if (sub) sub.textContent = '苏醒受阻，请刷新页面重试'
  }
}

const nav = createNav(camera, () => (pois ? pois.list() : []), hud)

const touch = createTouch(() => settings, {
  onEngage: () => input?.requestEngage(),
})
const gamepad = createGamepad()

input = createInput(canvas, camera, () => settings, hud, {
  onEscape: () => {
    if (photoMode) togglePhotoMode()
    else toggleSettings()
  },
  onEngage: () => audio.resume(),
  canStart: () => loadingDone,
  touch,
  gamepad,
})

settingsPanel.querySelectorAll('input, select').forEach((el) => {
  el.addEventListener('input', applySettingsFromForm)
  el.addEventListener('change', applySettingsFromForm)
})
document.getElementById('settings-close').addEventListener('click', toggleSettings)

window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'p' && !settingsPanel.classList.contains('open')) {
    if (e.target.closest('#settings')) return
    togglePhotoMode()
  }
})

requestAnimationFrame(loop)
