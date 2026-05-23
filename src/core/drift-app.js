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
 * }} GameHud
 * @typedef {{
 *   getPixelRatio(quality: string): number,
 *   onReady(): void,
 *   setVignette(on: boolean): void,
 *   setPhotoMode(on: boolean): void,
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
  const narration = createNarration?.(() => settings)
  const achievementCtx = { engaged: false, photoUsed: false }

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

  function checkAchievements() {
    progress.syncRuntime({
      collectTotal: collectibles?.getCount() ?? 0,
      poiVisited: pois?.visitedCount?.() ?? 0,
    })
    const hit = achievements.evaluate(progress.getState(), achievementCtx)
    if (hit) showLore(`成就 · ${hit.title}`, hit.desc)
  }

  function onWorldLore(name, text) {
    analytics.notePoi(name)
    showLore(name, text)
  }

  function showLore(title, text) {
    hud.showLore(title, text)
    narration?.speak(title, text)
    progress.noteLore()
    loreTimer = 6
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
      showLore('截图模式', 'UI 已隐藏，按 P 退出。')
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
    pois = createPois(scene, settings)
    wormholes = createWormholes(scene)
    stations = createStations(scene)
    constellation = createConstellation(scene)
    collectibles = createCollectibles(scene, () => settings)
    collectibles.setCount(progress.getState().collectTotal)
    if (loadingDone) collectibles.warm(camera)
    syncPostprocess()
    if (!nav) nav = createNav(camera, () => (pois ? pois.list() : []), hud)
  }

  function applySettings(next) {
    const prev = { ...settings }
    settings = next
    settingsStore.save(settings)
    audio.syncVolume()
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
        renderFrame()
        readyFrames += 1
        if (readyFrames >= 2) hideLoadingWhenReady()
        requestAnimationFrame(loop)
        return
      }

      if (!photoMode) input.updateMovement(dt)
      audio.updateMood(dt, {
        speedNorm: input.getSpeedNorm?.() ?? 0,
        moving: input.isMoving?.() ?? false,
      })
      world.update(elapsed, camera, dt, worldState)
      if (pois) pois.update(elapsed, camera, dt, onWorldLore)
      stations?.update(elapsed, camera)
      wormholes?.update(elapsed, camera, dt, (title, text) => {
        progress.noteWarp()
        onWorldLore(title, text)
        checkAchievements()
      })
      if (constellation && pois) {
        constellation.update(() => pois.list().map((p) => p.position))
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

  function importProgress(json) {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json
      const payload = data.progress && typeof data.progress === 'object' ? data.progress : data
      if (!progress.applyImport(payload)) return false
      if (Array.isArray(data.achievements)) achievements.applyImport(data.achievements)
      if (data.analytics) analytics.applyImport(data.analytics)
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
      `${progress.formatSummary()} · ${achievements.formatSummary()} · ${analytics.formatSummary()}`,
    listAchievements: () => achievements.list(),
    endSession: () => analytics.endSession(),
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
        },
        null,
        2,
      )
    },
    importProgress,
  }
}
