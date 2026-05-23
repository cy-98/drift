const STORAGE_KEY = 'drift-analytics'

export const defaultAnalytics = {
  sessions: 0,
  totalSessionSec: 0,
  poiHits: {},
  lastSessionAt: 0,
}

export function createAnalytics(storage) {
  let state = load()
  let sessionSec = 0
  let sessionOpen = false

  function load() {
    try {
      const raw = storage.getItem(STORAGE_KEY)
      if (!raw) return { ...defaultAnalytics, poiHits: {} }
      const parsed = JSON.parse(raw)
      return {
        ...defaultAnalytics,
        ...parsed,
        poiHits: parsed.poiHits && typeof parsed.poiHits === 'object' ? parsed.poiHits : {},
      }
    } catch {
      return { ...defaultAnalytics, poiHits: {} }
    }
  }

  function persist() {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
  }

  return {
    getState: () => ({ ...state, sessionSec }),
    startSession() {
      if (sessionOpen) return
      sessionOpen = true
      sessionSec = 0
      state.sessions += 1
      state.lastSessionAt = Date.now()
      persist()
    },
    tick(dt) {
      if (!sessionOpen) return
      sessionSec += dt
    },
    endSession() {
      if (!sessionOpen) return
      state.totalSessionSec += sessionSec
      sessionOpen = false
      sessionSec = 0
      persist()
    },
    notePoi(name) {
      if (!name) return
      state.poiHits[name] = (state.poiHits[name] || 0) + 1
      persist()
    },
    applyImport(data) {
      if (!data || typeof data !== 'object') return
      state = {
        ...defaultAnalytics,
        sessions: Number(data.sessions) || 0,
        totalSessionSec: Number(data.totalSessionSec) || 0,
        lastSessionAt: Number(data.lastSessionAt) || 0,
        poiHits: data.poiHits && typeof data.poiHits === 'object' ? { ...data.poiHits } : {},
      }
      persist()
    },
    exportPayload() {
      const live = sessionOpen ? state.totalSessionSec + sessionSec : state.totalSessionSec
      return { ...state, totalSessionSec: live }
    },
    topPoi() {
      let best = '—'
      let max = 0
      for (const [name, n] of Object.entries(state.poiHits)) {
        if (n > max) {
          max = n
          best = name
        }
      }
      return max ? best : '—'
    },
    formatSummary() {
      const total = state.totalSessionSec + (sessionOpen ? sessionSec : 0)
      const avgMin =
        state.sessions > 0 ? Math.round(total / state.sessions / 60) : 0
      return `会话 ${state.sessions} · 均时 ${avgMin} 分 · 常去 ${this.topPoi()}`
    },
  }
}
