const STORAGE_KEY = 'drift-perf-baseline'

/** @param {import('./storage.js').KeyValueStorage} storage */
export function createPerformanceTracker(storage, meta = {}) {
  const windowSamples = []
  let minFps = Infinity
  let sumFps = 0
  let count = 0

  function record(fps) {
    windowSamples.push(fps)
    if (windowSamples.length > 120) windowSamples.shift()
    minFps = Math.min(minFps, fps)
    sumFps += fps
    count += 1
  }

  function snapshot() {
    if (!windowSamples.length) return null
    const sorted = [...windowSamples].sort((a, b) => a - b)
    const avg = Math.round(sumFps / count)
    const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? avg
    const min = Math.round(minFps === Infinity ? avg : minFps)
    return { avg, min, p95, samples: windowSamples.length }
  }

  function saveBaseline(extra = {}) {
    const snap = snapshot()
    if (!snap) return
    try {
      storage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...snap,
          ...extra,
          ...meta,
          at: new Date().toISOString(),
        }),
      )
    } catch {
      /* ignore */
    }
  }

  function loadBaseline() {
    try {
      const raw = storage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  return { record, snapshot, saveBaseline, loadBaseline }
}
