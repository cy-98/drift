export function createAudio(getSettings) {
  const THEME_PATHS = ['/audio/drift-theme.mp3', '/audio/drift-theme.ogg']
  let ctx = null
  let master = null
  let ambientGain = null
  let musicGain = null
  let oscLow = null
  let oscMid = null
  let noise = null
  let started = false
  let sessionTime = 0
  let themeEl = null
  let themeReady = false
  let themePathIdx = 0

  function initTheme() {
    if (themeEl || typeof Audio === 'undefined') return
    themeEl = new Audio()
    themeEl.loop = true
    themeEl.preload = 'auto'
    themeEl.addEventListener(
      'canplaythrough',
      () => {
        themeReady = true
        syncTheme()
      },
      { once: true },
    )
    themeEl.addEventListener('error', () => {
      themePathIdx += 1
      if (themePathIdx < THEME_PATHS.length) {
        themeEl.src = THEME_PATHS[themePathIdx]
        themeEl.load()
      } else {
        themeEl = null
      }
    })
    themeEl.src = THEME_PATHS[0]
    themeEl.load()
  }

  function hasTheme() {
    return !!(themeReady && themeEl)
  }

  function syncTheme() {
    if (!hasTheme()) return
    const { music } = getSettings()
    const vol = started && music ? 0.42 : 0
    themeEl.volume = vol
    if (vol > 0 && themeEl.paused) themeEl.play().catch(() => {})
    if (vol === 0 && !themeEl.paused) themeEl.pause()
  }

  function ensure() {
    if (ctx) return true
    try {
      ctx = new AudioContext()
      master = ctx.createGain()
      master.gain.value = 0
      master.connect(ctx.destination)

      ambientGain = ctx.createGain()
      ambientGain.gain.value = 0
      ambientGain.connect(master)

      musicGain = ctx.createGain()
      musicGain.gain.value = 0
      musicGain.connect(master)

      oscLow = ctx.createOscillator()
      oscLow.type = 'sine'
      oscLow.frequency.value = 52
      const lowG = ctx.createGain()
      lowG.gain.value = 0.04
      oscLow.connect(lowG)
      lowG.connect(ambientGain)
      oscLow.start()

      oscMid = ctx.createOscillator()
      oscMid.type = 'triangle'
      oscMid.frequency.value = 130
      const midG = ctx.createGain()
      midG.gain.value = 0
      oscMid.connect(midG)
      midG.connect(musicGain)
      oscMid.start()
      oscMid._gain = midG

      const bufferSize = 2 * ctx.sampleRate
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.35
      noise = ctx.createBufferSource()
      noise.buffer = buffer
      noise.loop = true
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 420
      const noiseGain = ctx.createGain()
      noiseGain.gain.value = 0.025
      noise.connect(filter)
      filter.connect(noiseGain)
      noiseGain.connect(ambientGain)
      noise.start()
      return true
    } catch {
      return false
    }
  }

  function resume() {
    if (!ensure()) return
    if (ctx.state === 'suspended') ctx.resume()
    started = true
    initTheme()
    syncVolume()
    syncTheme()
  }

  function syncVolume() {
    if (!master) return
    const { ambient, music } = getSettings()
    const on = started && (ambient || music)
    master.gain.setTargetAtTime(on ? 0.55 : 0, ctx.currentTime, 0.5)
    ambientGain.gain.setTargetAtTime(started && ambient ? 1 : 0, ctx.currentTime, 0.4)
    musicGain.gain.setTargetAtTime(started && music ? 1 : 0, ctx.currentTime, 0.4)
    syncTheme()
  }

  /** 情绪曲线：宁静开场 → 探索上扬 → 久漂收束 */
  function updateMood(dt, { speedNorm = 0, moving = false } = {}) {
    if (!started || !ctx) return
    const { ambient, music } = getSettings()
    if (!ambient && !music) return

    sessionTime += dt
    const t = sessionTime
    const open = Math.min(1, t / 100)
    const explore = moving ? Math.min(1, speedNorm * 0.85) : 0
    const windDown = t > 420 ? Math.min(1, (t - 420) / 200) : 0

    const calm = open * (1 - windDown * 0.45)
    const lift = explore * (1 - windDown * 0.65)
    const pad = music ? calm * 0.35 + lift * 0.55 : 0
    const themeBlend = hasTheme() ? 0.22 : 1

    if (oscMid?._gain) {
      oscMid._gain.gain.setTargetAtTime(pad * 0.06 * themeBlend, ctx.currentTime, 0.35)
    }
    if (oscLow) {
      const base = ambient ? 0.04 : 0
      oscLow.frequency.setTargetAtTime(48 + lift * 8 + calm * 4, ctx.currentTime, 0.5)
      oscLow.detune?.setTargetAtTime?.(lift * 12, ctx.currentTime, 0.5)
    }
    if (oscMid) {
      oscMid.frequency.setTargetAtTime(124 + lift * 18 + seasonDrift(t), ctx.currentTime, 0.6)
    }
  }

  function seasonDrift(t) {
    return Math.sin(t * 0.07) * 3
  }

  function playChime() {
    if (!ensure()) return
    const { sfx } = getSettings()
    if (!started || !sfx) return
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = 784
    g.gain.value = 0
    o.connect(g)
    g.connect(musicGain)
    const t = ctx.currentTime
    g.gain.linearRampToValueAtTime(0.035, t + 0.015)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85)
    o.start(t)
    o.stop(t + 0.9)
  }

  function dispose() {
    try {
      themeEl?.pause()
      themeEl = null
      oscLow?.stop()
      oscMid?.stop()
      noise?.stop()
      ctx?.close()
    } catch {
      /* ignore */
    }
    ctx = null
  }

  return { resume, syncVolume, updateMood, playChime, dispose }
}
