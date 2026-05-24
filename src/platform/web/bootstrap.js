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
const sfxInput = document.getElementById('sfx')
const narrationInput = document.getElementById('narration')
const collectInput = document.getElementById('collectibles')
const progressSummary = document.getElementById('progress-summary')
const progressExportBtn = document.getElementById('progress-export')
const progressCopyBtn = document.getElementById('progress-copy')
const progressImportInput = document.getElementById('progress-import')
const achievementsList = document.getElementById('achievements-list')
const achievementsCount = document.getElementById('achievements-count')
const journalList = document.getElementById('journal-list')
const journalCount = document.getElementById('journal-count')
const bookmarksList = document.getElementById('bookmarks-list')
const bookmarksCount = document.getElementById('bookmarks-count')
const progressShareBtn = document.getElementById('progress-share')
const qualityInput = document.getElementById('quality')
const loreDurationInput = document.getElementById('lore-duration')
const loreScaleInput = document.getElementById('lore-scale')

function encodeSavePayload(text) {
  return btoa(unescape(encodeURIComponent(text)))
}

function decodeSavePayload(b64) {
  return decodeURIComponent(escape(atob(b64)))
}

function formatJournalTime(at) {
  const d = new Date(at)
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

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
  sectorEl: document.getElementById('sector'),
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
    if (on) {
      document.body.classList.remove('boost-hyper')
    }
  },
  setBoostHyper(on) {
    document.body.classList.toggle('boost-hyper', !!on)
  },
  exitPointerLock() {
    document.exitPointerLock?.()
  },
}

const inputHolder = { current: null }
let app = null

function syncSettingsForm() {
  if (!app?.ok) return
  try {
    const settings = app.getSettings()
    sensInput.value = settings.sensitivity
    speedInput.value = settings.baseSpeed
    reducedInput.checked = settings.reducedMotion
    bloomInput.checked = settings.bloom
    ambientInput.checked = settings.ambient
    vignetteInput.checked = settings.vignette
    if (lakeInput) lakeInput.checked = settings.lakeGlow !== false
    if (musicInput) musicInput.checked = settings.music !== false
    if (sfxInput) sfxInput.checked = settings.sfx !== false
    if (narrationInput) narrationInput.checked = !!settings.narration
    collectInput.checked = settings.collectibles
    if (progressSummary && app?.getProgressSummary) {
      progressSummary.textContent = app.getProgressSummary()
    }
    if (achievementsList && app?.listAchievements) {
      const list = app.listAchievements()
      achievementsList.innerHTML = list
        .map(
          (a) =>
            `<li class="${a.unlocked ? 'unlocked' : 'locked'}"><span>${a.title}</span><small>${a.desc}</small></li>`,
        )
        .join('')
      if (achievementsCount) {
        const n = list.filter((a) => a.unlocked).length
        achievementsCount.textContent = `${n}/${list.length}`
      }
    }
    if (journalList && app?.listJournal) {
      const entries = app.listJournal()
      journalList.innerHTML = entries.length
        ? entries
            .map(
              (e) =>
                `<li><time>${formatJournalTime(e.at)}</time><span>${e.title}</span><p>${e.text}</p></li>`,
            )
            .join('')
        : '<li><p>靠近行星或星门时会自动记下邂逅。</p></li>'
      if (journalCount) journalCount.textContent = String(entries.length)
    }
    if (bookmarksList && app?.listBookmarks) {
      const marks = app.listBookmarks()
      bookmarksList.innerHTML = marks.length
        ? marks
            .map(
              (b) =>
                `<li><span>${b.label}</span><small>${Math.round(b.x)}, ${Math.round(b.y)}, ${Math.round(b.z)}</small><button type="button" data-id="${b.id}" class="bookmark-del">删除</button></li>`,
            )
            .join('')
        : '<li><p>漫游中按 <kbd>B</kbd> 记下当前位置（最多 8 个）。</p></li>'
      if (bookmarksCount) bookmarksCount.textContent = String(marks.length)
      bookmarksList.querySelectorAll('.bookmark-del').forEach((btn) => {
        btn.onclick = () => {
          app.removeBookmark?.(btn.getAttribute('data-id'))
          syncSettingsForm()
        }
      })
    }
    qualityInput.value = settings.quality
    if (loreDurationInput) {
      loreDurationInput.value = String(settings.loreDuration ?? 6)
      const ldv = document.getElementById('lore-duration-val')
      if (ldv) ldv.textContent = loreDurationInput.value
    }
    if (loreScaleInput) loreScaleInput.value = settings.loreScale ?? 'medium'
    document.getElementById('sens-val').textContent = settings.sensitivity.toFixed(1)
    document.getElementById('speed-val').textContent = settings.baseSpeed.toFixed(1)
  } catch (err) {
    console.error('[Drift] settings sync failed', err)
  }
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
    sfx: sfxInput.checked,
    narration: narrationInput.checked,
    collectibles: collectInput.checked,
    quality: qualityInput.value,
    loreDuration: Number(loreDurationInput?.value ?? 6),
    loreScale: loreScaleInput?.value ?? 'medium',
  })
}

function toggleSettings() {
  const open = !settingsPanel.classList.contains('open')
  settingsPanel.classList.toggle('open', open)
  document.body.classList.toggle('settings-open', open)
  settingsPanel.setAttribute('aria-hidden', open ? 'false' : 'true')
  if (open) {
    platform.exitPointerLock()
    syncSettingsForm()
    settingsPanel.querySelector('.panel')?.scrollTo(0, 0)
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
  tryImportFromHash()
  window.addEventListener('resize', () => app.resize())

  setTimeout(() => {
    if (document.body.classList.contains('is-loading')) {
      console.warn('[Drift] loading timeout — forcing ready')
      app.forceFinishLoading()
    }
  }, 6000)
}

window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'b' && app?.ok && !settingsPanel.classList.contains('open')) {
    if (e.target.closest('#settings')) return
    e.preventDefault()
    app.addBookmark?.()
    syncSettingsForm()
    return
  }
  if (e.key.toLowerCase() === 'tab' && app?.ok) {
    e.preventDefault()
    app.cycleNavTarget()
  }
  if (e.key.toLowerCase() === 'p' && app?.ok && !settingsPanel.classList.contains('open')) {
    if (e.target.closest('#settings')) return
    app.togglePhotoMode()
  }
  if (e.key.toLowerCase() === 's' && app?.ok && document.body.classList.contains('photo-mode')) {
    e.preventDefault()
    app.capturePhoto?.()
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

progressCopyBtn?.addEventListener('click', async () => {
  if (!app?.exportProgress) return
  const text = app.exportProgress()
  try {
    await navigator.clipboard.writeText(text)
    hud.showLore('进度', '存档 JSON 已复制到剪贴板。')
  } catch {
    hud.showLore('进度', '无法访问剪贴板，请改用导出 JSON。')
  }
})

progressShareBtn?.addEventListener('click', async () => {
  if (!app?.exportProgress) return
  const text = app.exportProgress()
  const encoded = encodeSavePayload(text)
  if (encoded.length > 1800) {
    hud.showLore('进度', '存档较大，请改用 JSON 导出或复制。')
    return
  }
  const url = `${location.origin}${location.pathname}#save=${encoded}`
  location.hash = `save=${encoded}`
  try {
    await navigator.clipboard.writeText(url)
    hud.showLore('进度', '分享链接已复制（打开链接可载入存档）。')
  } catch {
    hud.showLore('进度', '链接已写入地址栏，请手动复制 URL。')
  }
})

function tryImportFromHash() {
  const match = location.hash.match(/^#save=(.+)$/)
  if (!match || !app?.importProgress) return
  try {
    const json = decodeSavePayload(match[1])
    if (!window.confirm('检测到分享链接中的存档，是否载入本机？')) return
    if (app.importProgress(json)) {
      syncSettingsForm()
      hud.showLore('进度', '分享存档已载入。')
      history.replaceState(null, '', location.pathname + location.search)
    }
  } catch {
    console.warn('[Drift] invalid save hash')
  }
}

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

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('[Drift] sw', err))
}

let installPrompt = null
const installBtn = document.getElementById('install-app')
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  installPrompt = e
  installBtn?.classList.remove('hidden')
})
installBtn?.addEventListener('click', async () => {
  if (!installPrompt) return
  installPrompt.prompt()
  await installPrompt.userChoice
  installPrompt = null
  installBtn.classList.add('hidden')
})

window.addEventListener('beforeunload', () => app?.endSession?.())
window.addEventListener('pagehide', () => app?.endSession?.())
