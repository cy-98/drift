import { createWebStorage } from './storage-web.js'
import { createDomHud } from './dom-hud.js'
import { initWebMonitor } from './monitor-web.js'
import { createDriftApp } from '../../core/drift-app.js'
import { createWebInput } from './input-web.js'
import { createTouch } from './touch.js'
import { createGamepad } from './gamepad.js'
import { createWebNarration } from './narration-web.js'

const LOAD_START = performance.now()
const storage = createWebStorage()

const canvas = document.getElementById('canvas')
const webglError = document.getElementById('webgl-error')
const loadingEl = document.getElementById('loading')
const settingsPanel = document.getElementById('settings')
const sensInput = document.getElementById('sens')
const speedInput = document.getElementById('speed-range')
const reducedInput = document.getElementById('reduced')
const bloomInput = document.getElementById('bloom')
const ambientInput = document.getElementById('ambient')
const vignetteInput = document.getElementById('vignette')
const lakeInput = document.getElementById('lake-glow')
const musicInput = document.getElementById('music')
const narrationInput = document.getElementById('narration')
const collectInput = document.getElementById('collectibles')
const progressSummary = document.getElementById('progress-summary')
const progressExportBtn = document.getElementById('progress-export')
const progressImportInput = document.getElementById('progress-import')
const qualityInput = document.getElementById('quality')

const hud = createDomHud({
  prompt: document.getElementById('prompt'),
  speedEl: document.getElementById('speed'),
  altEl: document.getElementById('alt'),
  fpsEl: document.getElementById('fps'),
  collectEl: document.getElementById('collect-count'),
  targetEl: document.getElementById('target'),
  distEl: document.getElementById('dist'),
  compass: document.getElementById('compass'),
  loreToast: document.getElementById('lore'),
  startBtn: document.getElementById('start-btn'),
})

function showWebglError(message) {
  webglError?.classList.add('show')
  loadingEl?.classList.add('out')
  document.body.classList.remove('is-loading')
  loadingEl?.setAttribute('aria-hidden', 'true')
  if (message) {
    const sub = document.getElementById('loading-sub')
    if (sub) sub.textContent = message
  }
}

const monitor = initWebMonitor({
  storage,
  canvas,
  onContextLost: () => showWebglError('图形上下文丢失，请刷新页面'),
  onLowFps: (fps) => console.warn('[Drift] low fps', fps),
})

const platform = {
  getPixelRatio(quality) {
    if (quality === 'low') return 1
    return Math.min(window.devicePixelRatio, quality === 'high' ? 2 : 1.5)
  },
  onReady() {
    loadingEl?.classList.add('out')
    loadingEl?.setAttribute('aria-busy', 'false')
    loadingEl?.setAttribute('aria-hidden', 'true')
    document.body.classList.remove('is-loading')
    setTimeout(() => loadingEl?.remove(), 850)
  },
  setVignette(on) {
    document.body.classList.toggle('vignette-on', on)
  },
  setPhotoMode(on) {
    document.body.classList.toggle('photo-mode', on)
  },
  exitPointerLock() {
    document.exitPointerLock?.()
  },
}

const inputHolder = { current: null }
let app = null

function syncSettingsForm() {
  if (!app?.ok) return
  const settings = app.getSettings()
  sensInput.value = settings.sensitivity
  speedInput.value = settings.baseSpeed
  reducedInput.checked = settings.reducedMotion
  bloomInput.checked = settings.bloom
  ambientInput.checked = settings.ambient
  vignetteInput.checked = settings.vignette
  lakeInput.checked = settings.lakeGlow !== false
  musicInput.checked = settings.music !== false
  narrationInput.checked = !!settings.narration
  collectInput.checked = settings.collectibles
  if (progressSummary && app?.getProgressSummary) {
    progressSummary.textContent = app.getProgressSummary()
  }
  qualityInput.value = settings.quality
  document.getElementById('sens-val').textContent = settings.sensitivity.toFixed(1)
  document.getElementById('speed-val').textContent = settings.baseSpeed.toFixed(1)
}

function applySettingsFromForm() {
  if (!app?.ok) return
  app.applySettings({
    sensitivity: Number(sensInput.value),
    baseSpeed: Number(speedInput.value),
    reducedMotion: reducedInput.checked,
    bloom: bloomInput.checked,
    ambient: ambientInput.checked,
    vignette: vignetteInput.checked,
    lakeGlow: lakeInput.checked,
    music: musicInput.checked,
    narration: narrationInput.checked,
    collectibles: collectInput.checked,
    quality: qualityInput.value,
  })
}

function toggleSettings() {
  const open = !settingsPanel.classList.contains('open')
  settingsPanel.classList.toggle('open', open)
  settingsPanel.setAttribute('aria-hidden', open ? 'false' : 'true')
  if (open) {
    platform.exitPointerLock()
    syncSettingsForm()
  }
}

const gamepad = createGamepad()

const touch = createTouch(() => (app?.ok ? app.getSettings() : {}), {
  onEngage: () => inputHolder.current?.requestEngage(),
})

function bootError(err) {
  console.error('[Drift] boot failed', err)
  const sub = document.getElementById('loading-sub')
  if (sub) sub.textContent = '苏醒受阻，请刷新页面重试'
  showWebglError()
}

try {
  app = createDriftApp({
    canvas,
    storage,
    hud,
    platform,
    monitor,
    touch,
    gamepad,
    loadStart: LOAD_START,
    createNarration: createWebNarration,
    createInput: (c, cam, getS, h, opts) => {
      const inp = createWebInput(c, cam, getS, h, {
        ...opts,
        onEscape: () => {
          if (document.body.classList.contains('photo-mode')) app?.togglePhotoMode()
          else toggleSettings()
        },
        touch,
        gamepad,
      })
      inputHolder.current = inp
      return inp
    },
  })
} catch (err) {
  bootError(err)
  app = { ok: false }
}

if (!app?.ok) {
  if (app?.error) bootError(app.error)
  else if (!document.getElementById('webgl-error')?.classList.contains('show')) showWebglError()
} else {
  webglError?.classList.remove('show')
  syncSettingsForm()
  window.addEventListener('resize', () => app.resize())

  setTimeout(() => {
    if (document.body.classList.contains('is-loading')) {
      console.warn('[Drift] loading timeout — forcing ready')
      app.forceFinishLoading()
    }
  }, 6000)
}

window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'tab' && app?.ok) {
    e.preventDefault()
    app.cycleNavTarget()
  }
  if (e.key.toLowerCase() === 'p' && app?.ok && !settingsPanel.classList.contains('open')) {
    if (e.target.closest('#settings')) return
    app.togglePhotoMode()
  }
})

settingsPanel.querySelectorAll('input, select').forEach((el) => {
  el.addEventListener('input', applySettingsFromForm)
  el.addEventListener('change', applySettingsFromForm)
})
document.getElementById('settings-close')?.addEventListener('click', toggleSettings)

progressExportBtn?.addEventListener('click', () => {
  if (!app?.exportProgress) return
  const blob = new Blob([app.exportProgress()], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `drift-save-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(a.href)
  syncSettingsForm()
})

progressImportInput?.addEventListener('change', async (e) => {
  const file = e.target.files?.[0]
  if (!file || !app?.importProgress) return
  const text = await file.text()
  if (app.importProgress(text)) {
    syncSettingsForm()
    hud.showLore('进度', '存档已载入本机。')
  } else {
    hud.showLore('进度', '无法识别该文件，请使用 Drift 导出的 JSON。')
  }
  e.target.value = ''
})
