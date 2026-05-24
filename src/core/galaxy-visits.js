const STORAGE_KEY = 'drift-galaxy-visits'
const MAX = 48

export function createGalaxyVisits(storage) {
  let visits = load()

  function load() {
    try {
      const raw = storage.getItem(STORAGE_KEY)
      if (!raw) return []
      const arr = JSON.parse(raw)
      return Array.isArray(arr) ? arr.slice(0, MAX) : []
    } catch {
      return []
    }
  }

  function persist() {
    storage.setItem(STORAGE_KEY, JSON.stringify(visits))
  }

  return {
    list() {
      return visits.map((v) => ({ ...v }))
    },
    has(id) {
      return visits.some((v) => v.id === id)
    },
  /** @returns {boolean} newly visited */
    visit(meta) {
      if (!meta?.id) return false
      if (visits.some((v) => v.id === meta.id)) return false
      visits.unshift({
        id: meta.id,
        name: meta.name ?? meta.id,
        archetype: meta.archetype ?? '',
        at: Date.now(),
      })
      if (visits.length > MAX) visits.length = MAX
      persist()
      return true
    },
    archetypesVisited() {
      return new Set(visits.map((v) => v.archetype).filter(Boolean))
    },
    exportPayload() {
      return visits
    },
    applyImport(arr) {
      if (!Array.isArray(arr)) return
      visits = arr
        .filter((v) => v && typeof v.id === 'string')
        .slice(0, MAX)
        .map((v) => ({
          id: v.id,
          name: String(v.name ?? v.id),
          archetype: String(v.archetype ?? ''),
          at: Number(v.at) || Date.now(),
        }))
      persist()
    },
    formatSummary() {
      const n = visits.length
      const arch = this.archetypesVisited().size
      return n ? `造访 ${n} 片星系 · ${arch} 种气候` : '尚无星系造访记录'
    },
  }
}
