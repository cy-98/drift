import * as THREE from 'three'
import { createSettingsStore } from './settings.js'
import { createWorld } from '../world.js'
import { createPois } from '../pois.js'
import { createNav } from './nav.js'
import { createAudio } from '../audio.js'
import { createWormholes } from '../wormhole.js'
import { createStations } from '../stations.js'
import { createConstellation } from '../constellation.js'
import { createPostprocess } from '../postprocess.js'
import { createCollectibles } from '../collectibles.js'
import { createPerformanceTracker } from './performance.js'
import { createProgressTracker } from './progress.js'
import { createAchievementTracker } from './achievements.js'
import { createAnalytics } from './analytics.js'
import { createJournal } from './journal.js'
import { createConstellationUnlock } from './constellation-unlock.js'
import { createBookmarks } from './bookmarks.js'
import { galaxyMeta } from './galaxies.js'
import { createGalaxyVisits } from './galaxy-visits.js'

/**
 * @typedef {ReturnType<import('./settings.js').createSettingsStore>} SettingsStore
 * @typedef {import('./storage.js').KeyValueStorage} KeyValueStorage
 * @typedef {{
 *   getViewport(): { width: number, height: number },
 *   setSpeed(text: string): void,
 *   setAlt(text: string): void,
 *   setFps(text: string): void,
 *   setCollectCount(n: number): void,
 *   setTarget(text: string): void,
 *   setDistance(text: string): void,
 *   flashTarget(name: string): void,
 *   setCompass(state: { visible: boolean, x: number, y: number, transform: string, edge: boolean }): void,
 *   dismissPrompt(): void,
 *   showStartGuide(): void,
 *   getPromptElement(): HTMLElement | null | undefined,
 *   getStartButton(): HTMLElement | null | undefined,
 *   showLore(title: string, text: string): void,
 *   hideLore(): void,
 *   setSector(text: string): void,
 *   setGalaxy(text: string): void,
 *   applyLoreStyle(scale: string): void,
 * }} GameHud
 * @typedef {{
 *   getPixelRatio(quality: string): number,
 *   onReady(): void,
 *   setVignette(on: boolean): void,
 *   setPhotoMode(on: boolean): void,
 *   setBoostHyper(on: boolean): void,
 *   exitPointerLock(): void,
 * }} PlatformShell
 */

const MIN_LOAD_MS = 1200

/**
 * @param {{
 *   canvas: HTMLCanvasElement,
 *   storage: KeyValueStorage,
 *   hud: GameHud,
 *   platform: PlatformShell,
 *   monitor: { noteFps(fps: number, dt: number): void },
 *   createInput: Function,
 *   touch: object | null,
 *   gamepad: object,
 *   loadStart: number,
 *   createNarration?: (getSettings: () => object) => { speak(title: string, text: string): void, cancel(): void },
 * }} deps
 */
export function createDriftApp(deps) {
  const { canvas, storage, hud, platform, monitor, createInput, touch, gamepad, loadStart, createNarration } = deps
  const settingsStore = createSettingsStore(storage)
  let settings = settingsStore.load()

  const perf = createPerformanceTracker(storage, {
    ua: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    dpr: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
  })
  const progress = createProgressTracker(storage)
  const achievements = createAchievementTracker(storage)
  const analytics = createAnalytics(storage)
  const journal = createJournal(storage)
  const constellationUnlock = createConstellationUnlock(storage)
  const bookmarks = createBookmarks(storage)
  const galaxyVisits = createGalaxyVisits(storage)
  const narration = createNarration?.(() => settings)
  const achievementCtx = { engaged: false, photoUsed: false, bookmarks: 0 }

  let loadingDone = false
  let loadingScheduled = false
  let readyFrames = 0
  let photoMode = false
  let input = null
  let wormholes = null
  let stations = null
  let constellation = null
  let collectibles = null
  let post = null
  let world = null
  let pois = null
  let nav = null
  const worldState = {}

  let loreTimer = 0
  let progressSaveTimer = 0
  let lastSector = ''
  let lastGalaxyId = ''
  let inRevisitedGalaxy = false
  let wasHyper = false

  function poiOptions() {
    return {
      ...settings,
      getGalaxyMeta: (x, z) => galaxyMeta(x, z),
    }
  }

  function updateLocationHud() {
    if (worldState.galaxyLabel) hud.setGalaxy?.(`星系 · ${worldState.galaxyLabel}`)
    if (worldState.sectorLabel) hud.setSector?.(`星区 · ${worldState.sectorLabel}`)
  }

  function recordGalaxyVisit() {
    if (!loadingDone || !worldState.galaxyMeta) return
    if (galaxyVisits.visit(worldState.galaxyMeta)) checkAchievements()
  }

  function checkGalaxyCrossing() {
    if (!worldState.galaxyId || worldState.galaxyId === lastGalaxyId) return
  inRevisitedGalaxy = !!lastGalaxyId && galaxyVisits.has(worldState.galaxyId)
    if (lastGalaxyId && worldState.galaxyLore) {
      const lore = worldState.galaxyLore
      showLore(`星系 · ${worldState.galaxyLabel}`, lore.text, { chime: false, duration: 6 })
      journal.note(lore.title, lore.text)
    }
    lastGalaxyId = worldState.galaxyId
    recordGalaxyVisit()
  }

  function checkSectorCrossing() {
    if (!worldState.sectorLabel || worldState.sectorLabel === lastSector) return
    if (lastSector && worldState.sectorEvent) {
      const evt = worldState.sectorEvent
      showLore(`星区 · ${worldState.sectorLabel}`, evt.text, { chime: false, duration: 5 })
      journal.note(evt.title, evt.text)
    }
    lastSector = worldState.sectorLabel
  }

  function getNavTargets() {
    const list = pois ? pois.list() : []
    const marks = bookmarks.list().map((b) => ({
      name: `★ ${b.label}`,
      position: new THREE.Vector3(b.x, b.y, b.z),
      discovered: true,
    }))
    return [...list, ...marks]
  }

  function checkAchievements() {
    achievementCtx.bookmarks = bookmarks.list().length
    achievementCtx.archetypesVisited = galaxyVisits.archetypesVisited().size
    progress.syncRuntime({
      collectTotal: collectibles?.getCount() ?? 0,
      poiVisited: pois?.visitedCount?.() ?? 0,
    })
    const hit = achievements.evaluate(progress.getState(), achievementCtx)
    if (hit) showLore(`成就 · ${hit.title}`, hit.desc, { journal: false, chime: false })
  }

  function loreDurationSec() {
    const n = Number(settings.loreDuration ?? 6)
    return Math.max(4, Math.min(14, n))
  }

  function showLore(title, text, opts = {}) {
    hud.showLore(title, text)
    narration?.speak(title, text)
    if (opts.journal !== false) journal.note(title, text)
    if (opts.chime) audio.playChime?.()
    progress.noteLore()
    loreTimer = opts.duration ?? loreDurationSec()
  }

  function onWorldLore(name, text) {
    analytics.notePoi(name)
    showLore(name, text, { chime: true })
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
    return { ok: false, renderer: null }
  }

  renderer.setPixelRatio(platform.getPixelRatio(settings.quality))
  renderer.setClearColor(0x030810, 1)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(68, 1, 0.1, 800)
  camera.position.set(0, 0, 0)

  const audio = createAudio(() => settings)

  function applyVignette() {
    platform.setVignette(!!settings.vignette && !photoMode)
  }

  function togglePhotoMode() {
    if (!loadingDone) return
    photoMode = !photoMode
    platform.setPhotoMode(photoMode)
    applyVignette()
    if (photoMode) {
      achievementCtx.photoUsed = true
      checkAchievements()
      platform.exitPointerLock()
      showLore('截图模式', 'UI 已隐藏 · S 保存 PNG · P 退出', { journal: false, chime: false })
      loreTimer = 4
    }
  }

  function syncPostprocess() {
    post?.setEnabled(settings.bloom, settings.quality)
  }

  function rebuildWorld() {
    wormholes?.dispose()
    stations?.dispose()
    constellation?.dispose()
    collectibles?.dispose()
    pois?.dispose()
    for (const child of [...scene.children]) scene.remove(child)
    world = createWorld(scene, settings)
    pois = createPois(scene, poiOptions())
    wormholes = createWormholes(scene, {
      getGalaxyMeta: (x, z) => galaxyMeta(x, z),
    })
    stations = createStations(scene)
    constellation = createConstellation(scene)
    collectibles = createCollectibles(scene, () => settings)
    collectibles.setCount(progress.getState().collectTotal)
    if (loadingDone) collectibles.warm(camera)
    syncPostprocess()
    if (!nav) nav = createNav(camera, getNavTargets, hud)
  }

  function applySettings(next) {
    const prev = { ...settings }
    settings = next
    settingsStore.save(settings)
    audio.syncVolume()
    hud.applyLoreStyle?.(settings.loreScale ?? 'medium')
    applyVignette()
    syncPostprocess()
    if (
      prev.reducedMotion !== settings.reducedMotion ||
      prev.bloom !== settings.bloom ||
      prev.quality !== settings.quality ||
      prev.lakeGlow !== settings.lakeGlow
    ) {
      renderer.setPixelRatio(platform.getPixelRatio(settings.quality))
      rebuildWorld()
    }
  }

  function finishLoading() {
    if (loadingDone) return
    loadingDone = true
    analytics.startSession()
    collectibles?.warm(camera)
    recordGalaxyVisit()
    input?.showStartGuide()
    platform.onReady()
  }

  function hideLoadingWhenReady() {
    if (loadingDone || loadingScheduled) return
    loadingScheduled = true
    const delay = Math.max(0, MIN_LOAD_MS - (performance.now() - loadStart))
    setTimeout(finishLoading, delay)
  }

  function forceFinishLoading() {
    if (loadingDone) return
    loadingScheduled = true
    finishLoading()
  }

  function resize() {
    const { width: w, height: h } = hud.getViewport()
    renderer.setSize(w, h, false)
    post?.resize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }

  post = createPostprocess(renderer, scene, camera)
  try {
    rebuildWorld()
    applyVignette()
    syncPostprocess()
    hud.applyLoreStyle?.(settings.loreScale ?? 'medium')
    resize()
  } catch (err) {
    console.error(err)
    return { ok: false, renderer, error: err }
  }

  input = createInput(canvas, camera, () => settings, hud, {
    onEngage: () => {
      audio.resume()
      achievementCtx.engaged = true
      checkAchievements()
    },
    canStart: () => loadingDone,
    touch,
    gamepad,
  })

  let elapsed = 0
  let last = performance.now()
  let fpsFrames = 0
  let fpsTick = performance.now()
  let perfSaveTimer = 0

  function updateFps(now, dt) {
    fpsFrames += 1
    const win = now - fpsTick
    if (win < 400) return
    const fps = Math.round((fpsFrames * 1000) / win)
    const snap = perf.snapshot()
    hud.setFps(snap ? `${fps} (低 ${snap.min})` : String(fps))
    perf.record(fps)
    monitor.noteFps(fps, dt)
    fpsFrames = 0
    fpsTick = now
  }

  function renderFrame() {
    const flash = wormholes?.getFlash?.() ?? 0
    if (flash > 0) renderer.setClearColor(0x1a4060, 1)
    else if (worldState.clearColor) renderer.setClearColor(worldState.clearColor, 1)
    post.render()
  }

  function loop(now) {
    try {
      const dt = Math.min((now - last) / 1000, 0.05)
      updateFps(now, dt)
      if (!renderer || !world) {
        requestAnimationFrame(loop)
        return
      }
      last = now
      elapsed += dt
      perfSaveTimer += dt
      if (perfSaveTimer >= 30 && loadingDone) {
        perf.saveBaseline({ quality: settings.quality, bloom: settings.bloom })
        perfSaveTimer = 0
      }

      if (!loadingDone) {
        const drift = settings.reducedMotion ? 1.2 : 2.8
        camera.position.z -= drift * dt
        world.update(elapsed, camera, dt, worldState)
        if (pois) pois.update(elapsed, camera, dt, onWorldLore)
        updateLocationHud()
        if (worldState.galaxyId) lastGalaxyId = worldState.galaxyId
        if (worldState.sectorLabel) lastSector = worldState.sectorLabel
        renderFrame()
        readyFrames += 1
        if (readyFrames >= 2) hideLoadingWhenReady()
        requestAnimationFrame(loop)
        return
      }

      if (!photoMode) input.updateMovement(dt)
      const motion = input.getMotionState?.()
      const allowFx = !settings.reducedMotion
      platform.setBoostHyper?.(!!motion?.hyper && allowFx)
      if (motion?.hyper && !wasHyper) audio.playBoost?.()
      wasHyper = !!motion?.hyper
      audio.updateMood(dt, {
        speedNorm: input.getSpeedNorm?.() ?? 0,
        moving: input.isMoving?.() ?? false,
      })
      world.update(elapsed, camera, dt, worldState)
      if (pois) {
        pois.update(elapsed, camera, dt, onWorldLore)
        constellationUnlock.check(pois.entries, (name, a, b) => {
          showLore(`星座 · ${name}`, `「${a}」与「${b}」之间的光被重新点亮。`, { chime: true })
          checkAchievements()
        })
      }
      updateLocationHud()
      checkGalaxyCrossing()
      checkSectorCrossing()
      stations?.update(elapsed, camera)
      wormholes?.update(elapsed, camera, dt, (payload) => {
        const evt = typeof payload === 'string' ? { kind: 'inner', title: '星门', text: payload } : payload
        if (evt.kind === 'inter') progress.noteInterWarp()
        else progress.noteWarp()
        audio.playWarp?.()
        onWorldLore(evt.title, evt.text)
        checkAchievements()
      })
      if (constellation && pois) {
        const revisitBoost = inRevisitedGalaxy
        constellation.update(
          () => pois.list(),
          (a, b) => constellationUnlock.hasPair(a, b),
          revisitBoost,
        )
      }
      if (collectibles) {
        const { count } = collectibles.update(elapsed, camera, dt, (n) => {
          hud.setCollectCount(n)
          if (n % 12 === 0) showLore('微光', `已掠过 ${n} 粒星尘，它们并不催促你。`)
          checkAchievements()
        })
        hud.setCollectCount(count)
      }
      nav.update()
      if (loreTimer > 0) {
        loreTimer -= dt
        if (loreTimer <= 0) {
          hud.hideLore()
          narration?.cancel()
        }
      }
      progress.tick(dt)
      analytics.tick(dt)
      progressSaveTimer += dt
      if (progressSaveTimer >= 28) {
        progress.syncRuntime({
          collectTotal: collectibles?.getCount() ?? 0,
          poiVisited: pois?.visitedCount?.() ?? 0,
        })
        progress.save()
        checkAchievements()
        progressSaveTimer = 0
      }
      renderFrame()
    } catch (err) {
      console.error('[Drift] frame error', err)
      if (!loadingDone) {
        readyFrames += 1
        if (readyFrames >= 2) hideLoadingWhenReady()
      }
    }
    requestAnimationFrame(loop)
  }

  requestAnimationFrame(loop)
  setTimeout(hideLoadingWhenReady, MIN_LOAD_MS + 50)

  function capturePhoto() {
    if (!photoMode || !canvas) return false
    try {
      const link = document.createElement('a')
      link.download = `drift-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      showLore('截图', 'PNG 已保存到下载文件夹。', { journal: false, chime: false })
      loreTimer = 3
      return true
    } catch {
      return false
    }
  }

  function importProgress(json) {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json
      const payload = data.progress && typeof data.progress === 'object' ? data.progress : data
      if (!progress.applyImport(payload)) return false
      if (Array.isArray(data.achievements)) achievements.applyImport(data.achievements)
      if (data.analytics) analytics.applyImport(data.analytics)
      if (Array.isArray(data.journal)) journal.applyImport(data.journal)
      if (Array.isArray(data.constellations)) constellationUnlock.applyImport(data.constellations)
      if (Array.isArray(data.bookmarks)) bookmarks.applyImport(data.bookmarks)
      if (Array.isArray(data.galaxyVisits)) galaxyVisits.applyImport(data.galaxyVisits)
      collectibles?.setCount(progress.getState().collectTotal)
      hud.setCollectCount(progress.getState().collectTotal)
      return true
    } catch {
      return false
    }
  }

  return {
    ok: true,
    renderer,
    getSettings: () => settings,
    applySettings,
    resize,
    togglePhotoMode,
    cycleNavTarget: () => nav?.cycleTarget(),
    forceFinishLoading,
    getProgressSummary: () =>
      `${progress.formatSummary()} · ${galaxyVisits.formatSummary()} · ${achievements.formatSummary()} · ${bookmarks.formatSummary()} · ${journal.formatSummary()} · ${analytics.formatSummary()}`,
    listGalaxyVisits: () => galaxyVisits.list(),
    getGalaxyMap: () => ({
      gx: worldState.galaxyMeta?.gx ?? 0,
      gz: worldState.galaxyMeta?.gz ?? 0,
      visited: galaxyVisits.list(),
    }),
    listBookmarks: () => bookmarks.list(),
    addBookmark: () => {
      if (!loadingDone) return null
      const label = worldState.sectorLabel || '星标'
      const g = worldState.galaxyMeta ?? galaxyMeta(camera.position.x, camera.position.z)
      const entry = bookmarks.add(camera.position, label, { id: g.id, name: g.name })
      journal.note('星标', `记下「${label}」· ${g.name}`)
      showLore('星标', `${label} 已加入导航（Tab 切换目标）`, { journal: false, chime: true })
      checkAchievements()
      return entry
    },
    removeBookmark: (id) => bookmarks.remove(id),
    listAchievements: () => achievements.list(),
    listJournal: () => journal.list(),
    endSession: () => analytics.endSession(),
    capturePhoto,
    exportProgress: () => {
      progress.syncRuntime({
        collectTotal: collectibles?.getCount() ?? 0,
        poiVisited: pois?.visitedCount?.() ?? 0,
      })
      progress.save()
      return JSON.stringify(
        {
          ...JSON.parse(progress.exportJson()),
          achievements: achievements.unlockedIds(),
          analytics: analytics.exportPayload(),
          journal: journal.exportPayload(),
          constellations: constellationUnlock.exportPayload(),
          bookmarks: bookmarks.exportPayload(),
          galaxyVisits: galaxyVisits.exportPayload(),
        },
        null,
        2,
      )
    },
    importProgress,
  }
}
