const STORAGE_KEY = 'drift-journal'
const MAX_ENTRIES = 24

export function createJournal(storage) {
  let entries = load()

  function load() {
    try {
      const raw = storage.getItem(STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.slice(0, MAX_ENTRIES) : []
    } catch {
      return []
    }
  }

  function persist() {
    storage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }

  return {
    note(title, text) {
      if (!title || !text) return
      entries.unshift({ title, text, at: Date.now() })
      if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES
      persist()
    },
    list() {
      return entries.map((e) => ({ ...e }))
    },
    applyImport(data) {
      if (!Array.isArray(data)) return
      entries = data
        .filter((e) => e && typeof e.title === 'string' && typeof e.text === 'string')
        .slice(0, MAX_ENTRIES)
        .map((e) => ({ title: e.title, text: e.text, at: Number(e.at) || Date.now() }))
      persist()
    },
    exportPayload() {
      return entries.map((e) => ({ ...e }))
    },
    formatSummary() {
      return entries.length ? `${entries.length} 条邂逅记录` : '尚无邂逅记录'
    },
  }
}
