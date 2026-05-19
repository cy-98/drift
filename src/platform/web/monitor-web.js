const LOG_KEY = 'drift-error-log'
const MAX_LOG = 12

/** @param {import('../../core/storage.js').KeyValueStorage} storage */
function pushLog(storage, entry) {
  try {
    const list = JSON.parse(storage.getItem(LOG_KEY) || '[]')
    list.unshift({ ...entry, t: Date.now() })
    storage.setItem(LOG_KEY, JSON.stringify(list.slice(0, MAX_LOG)))
  } catch {
    /* ignore quota */
  }
}

export function initWebMonitor({ storage, canvas, onContextLost, onLowFps }) {
  window.addEventListener('error', (e) => {
    pushLog(storage, { type: 'error', msg: e.message, src: e.filename })
  })
  window.addEventListener('unhandledrejection', (e) => {
    pushLog(storage, { type: 'promise', msg: String(e.reason) })
  })

  canvas?.addEventListener('webglcontextlost', (e) => {
    e.preventDefault()
    pushLog(storage, { type: 'webgl', msg: 'context lost' })
    onContextLost?.()
  })

  let lowFpsCooldown = 0
  return {
    noteFps(fps, dt) {
      if (fps >= 24 || lowFpsCooldown > 0) {
        lowFpsCooldown = Math.max(0, lowFpsCooldown - dt)
        return
      }
      lowFpsCooldown = 12
      pushLog(storage, { type: 'perf', msg: `low fps ${fps}` })
      onLowFps?.(fps)
    },
    getRecentLogs() {
      try {
        return JSON.parse(storage.getItem(LOG_KEY) || '[]')
      } catch {
        return []
      }
    },
  }
}
