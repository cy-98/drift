const STORAGE_KEY = 'drift-bookmarks'
const MAX = 8

export function createBookmarks(storage) {
  let items = load()

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
    storage.setItem(STORAGE_KEY, JSON.stringify(items))
  }

  return {
    list() {
      return items.map((b) => ({ ...b }))
    },
    add(position, label, galaxy = {}) {
      if (items.length >= MAX) items.shift()
      const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        label: label || '星标',
        x: position.x,
        y: position.y,
        z: position.z,
        galaxyId: galaxy.id ?? '',
        galaxyName: galaxy.name ?? '',
        at: Date.now(),
      }
      items.push(entry)
      persist()
      return entry
    },
    remove(id) {
      const n = items.length
      items = items.filter((b) => b.id !== id)
      if (items.length !== n) persist()
    },
    exportPayload() {
      return items
    },
    applyImport(arr) {
      if (!Array.isArray(arr)) return
      items = arr
        .filter((b) => b && typeof b.x === 'number')
        .slice(0, MAX)
        .map((b) => ({
          id: String(b.id ?? `${b.at}-${b.x}`),
          label: String(b.label ?? '星标'),
          x: b.x,
          y: b.y,
          z: b.z,
          galaxyId: String(b.galaxyId ?? ''),
          galaxyName: String(b.galaxyName ?? ''),
          at: b.at ?? Date.now(),
        }))
      persist()
    },
    formatSummary() {
      return `星标 ${items.length}/${MAX}`
    },
  }
}
