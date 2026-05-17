export function createAudio(getSettings) {
  let ctx = null
  let gain = null
  let osc = null
  let noise = null
  let started = false

  function ensure() {
    if (ctx) return true
    try {
      ctx = new AudioContext()
      gain = ctx.createGain()
      gain.gain.value = 0
      gain.connect(ctx.destination)

      osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = 52
      const oscGain = ctx.createGain()
      oscGain.gain.value = 0.04
      osc.connect(oscGain)
      oscGain.connect(gain)
      osc.start()

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
      noiseGain.connect(gain)
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
    syncVolume()
  }

  function syncVolume() {
    if (!gain) return
    const { ambient } = getSettings()
    const target = started && ambient ? 0.55 : 0
    gain.gain.setTargetAtTime(target, ctx.currentTime, 0.4)
  }

  function dispose() {
    try {
      osc?.stop()
      noise?.stop()
      ctx?.close()
    } catch {
      /* ignore */
    }
    ctx = null
  }

  return { resume, syncVolume, dispose }
}
