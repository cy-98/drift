export function createAudio(getSettings) {
  const THEME_PLAYLIST = [
    ['/audio/drift-theme.mp3', '/audio/drift-theme.ogg'],
    ['/audio/drift-theme-b.mp3', '/audio/drift-theme-b.ogg'],
    ['/audio/drift-theme-c.mp3', '/audio/drift-theme-c.ogg'],
  ]
  let ctx = null
  let master = null
  let ambientGain = null
  let musicGain = null
  let sfxGain = null
  let oscLow = null
  let oscMid = null
  let noise = null
  let started = false
  let sessionTime = 0
  let themeEl = null
  let themeReady = false
  let themePathIdx = 0
  let playlistIdx = 0
  let playlistReady = []

  function initTheme() {
    if (themeEl || typeof Audio === 'undefined') return
    themeEl = new Audio()
    themeEl.preload = 'auto'
    themeEl.addEventListener('canplaythrough', onThemeReady)
    themeEl.addEventListener('error', onThemeError)
    themeEl.addEventListener('ended', onThemeEnded)
    probePlaylist()
    loadThemeSlot(0)
  }

  function onThemeReady() {
    themeReady = true
    if (themeEl) themeEl.loop = playlistReady.length <= 1
    syncTheme()
  }

  function onThemeError() {
    themePathIdx += 1
    const paths = THEME_PLAYLIST[playlistIdx]
    if (paths && themePathIdx < paths.length) {
      themeEl.src = paths[themePathIdx]
      themeEl.load()
      return
    }
    themePathIdx = 0
    playlistIdx += 1
    if (playlistIdx < THEME_PLAYLIST.length) {
      loadThemeSlot(playlistIdx)
      return
    }
    themeEl = null
    themeReady = false
  }

  function loadThemeSlot(idx) {
    if (!themeEl) return
    playlistIdx = idx
    themePathIdx = 0
    themeReady = false
    themeEl.src = THEME_PLAYLIST[idx][0]
    themeEl.load()
  }

  function onThemeEnded() {
    if (playlistReady.length <= 1) return
    const pos = playlistReady.indexOf(playlistIdx)
    const next = playlistReady[(pos + 1) % playlistReady.length]
    crossfadeToTrack(next)
  }

  function crossfadeToTrack(nextIdx) {
    if (!themeEl || nextIdx === playlistIdx) return
    const prevVol = themeEl.volume
    themeEl.volume = 0
    loadThemeSlot(nextIdx)
    themeEl.loop = playlistReady.length <= 1
    themeEl.play().catch(() => {})
    const step = () => {
      if (!themeEl) return
      themeEl.volume = Math.min(prevVol, themeEl.volume + 0.04)
      if (themeEl.volume < prevVol - 0.01) requestAnimationFrame(step)
      else themeEl.volume = prevVol
    }
    requestAnimationFrame(step)
  }

  function probePlaylist() {
    playlistReady = [0]
    for (let i = 1; i < THEME_PLAYLIST.length; i++) {
      const probe = new Audio()
      probe.preload = 'metadata'
      probe.src = THEME_PLAYLIST[i][0]
      probe.addEventListener(
        'loadedmetadata',
        () => {
          if (!playlistReady.includes(i)) playlistReady.push(i)
          if (themeEl) themeEl.loop = playlistReady.length <= 1
        },
        { once: true },
      )
      probe.addEventListener('error', () => {}, { once: true })
    }
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

      sfxGain = ctx.createGain()
      sfxGain.gain.value = 0
      sfxGain.connect(master)

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
    sfxGain.gain.setTargetAtTime(started ? 1 : 0, ctx.currentTime, 0.4)
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
    toneSweep(784, 0.035, 0.85, musicGain)
  }

  function toneSweep(freq, peak, dur, dest = sfxGain) {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = freq
    g.gain.value = 0
    o.connect(g)
    g.connect(dest)
    const t = ctx.currentTime
    g.gain.linearRampToValueAtTime(peak, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.start(t)
    o.stop(t + dur + 0.05)
  }

  function playBoost() {
    if (!ensure()) return
    const { sfx } = getSettings()
    if (!started || !sfx) return
    const src = ctx.createBufferSource()
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
    src.buffer = buf
    const filt = ctx.createBiquadFilter()
    filt.type = 'bandpass'
    filt.frequency.setValueAtTime(180, ctx.currentTime)
    filt.frequency.exponentialRampToValueAtTime(920, ctx.currentTime + 0.35)
    const g = ctx.createGain()
    g.gain.value = 0
    src.connect(filt)
    filt.connect(g)
    g.connect(sfxGain)
    const t = ctx.currentTime
    g.gain.linearRampToValueAtTime(0.08, t + 0.04)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45)
    src.start(t)
    src.stop(t + 0.5)
  }

  function playWarp() {
    if (!ensure()) return
    const { sfx } = getSettings()
    if (!started || !sfx) return
    toneSweep(220, 0.05, 1.1, sfxGain)
    toneSweep(440, 0.028, 0.9, sfxGain)
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

  return { resume, syncVolume, updateMood, playChime, playBoost, playWarp, dispose }
}
