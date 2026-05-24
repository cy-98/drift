const STORAGE_KEY = 'drift-progress'
const VERSION = 1

export const defaultProgress = {
  version: VERSION,
  playTimeSec: 0,
  warps: 0,
  interWarps: 0,
  loreEvents: 0,
  collectTotal: 0,
  poiVisited: 0,
  savedAt: 0,
}

export function createProgressTracker(storage) {
  let state = load()

  function load() {
    try {
      const raw = storage.getItem(STORAGE_KEY)
      if (!raw) return { ...defaultProgress }
      const parsed = JSON.parse(raw)
      return { ...defaultProgress, ...parsed, version: VERSION }
    } catch {
      return { ...defaultProgress }
    }
  }

  function persist() {
    state.savedAt = Date.now()
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
  }

  return {
    getState: () => ({ ...state }),
    tick(dt) {
      state.playTimeSec += dt
    },
    noteWarp() {
      state.warps += 1
    },
    noteInterWarp() {
      state.warps += 1
      state.interWarps += 1
    },
    noteLore() {
      state.loreEvents += 1
    },
    syncRuntime({ collectTotal, poiVisited }) {
      if (typeof collectTotal === 'number') state.collectTotal = collectTotal
      if (typeof poiVisited === 'number') state.poiVisited = Math.max(state.poiVisited, poiVisited)
    },
    applyImport(data) {
      if (!data || typeof data !== 'object') return false
      state = {
        ...defaultProgress,
        playTimeSec: Number(data.playTimeSec) || 0,
        warps: Number(data.warps) || 0,
        interWarps: Number(data.interWarps) || 0,
        loreEvents: Number(data.loreEvents) || 0,
        collectTotal: Number(data.collectTotal) || 0,
        poiVisited: Number(data.poiVisited) || 0,
        savedAt: Date.now(),
        version: VERSION,
      }
      persist()
      return true
    },
    save: persist,
    exportJson() {
      return JSON.stringify({ ...state, savedAt: Date.now() }, null, 2)
    },
    formatSummary() {
      const min = Math.floor(state.playTimeSec / 60)
      return `漫游 ${min} 分钟 · 微光 ${state.collectTotal} · 星门 ${state.warps} 次 · 邂逅 ${state.poiVisited} 处`
    },
  }
}
