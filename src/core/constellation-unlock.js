const STORAGE_KEY = 'drift-constellations'

const NAMES = [
  '漂流者之弧',
  '静潮三角',
  '湖光影契',
  '远行者桥',
  '微光连珠',
  '深空织带',
  '余烬回环',
  '青冕斜线',
]

const LINK_MIN = 40
const LINK_MAX = 220

export function createConstellationUnlock(storage) {
  let unlocked = load()

  function load() {
    try {
      const raw = storage.getItem(STORAGE_KEY)
      if (!raw) return new Set()
      const arr = JSON.parse(raw)
      return new Set(Array.isArray(arr) ? arr : [])
    } catch {
      return new Set()
    }
  }

  function persist() {
    storage.setItem(STORAGE_KEY, JSON.stringify([...unlocked]))
  }

  function pairKey(a, b) {
    return a < b ? `${a}:${b}` : `${b}:${a}`
  }

  function nameForKey(key) {
    let h = 0
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
    return NAMES[h % NAMES.length]
  }

  return {
    hasPair(a, b) {
      return unlocked.has(pairKey(a, b))
    },
    list() {
      return [...unlocked].map((key) => ({ key, name: nameForKey(key) }))
    },
    exportPayload() {
      return [...unlocked]
    },
    applyImport(ids) {
      if (!Array.isArray(ids)) return
      unlocked = new Set(ids.filter((id) => typeof id === 'string'))
      persist()
    },
    /** @returns {{ name: string, key: string } | null} newly unlocked */
    check(entries, onUnlock) {
      const visited = entries.filter((e) => e.visited)
      for (let a = 0; a < visited.length; a++) {
        for (let b = a + 1; b < visited.length; b++) {
          const ea = visited[a]
          const eb = visited[b]
          const dist = ea.group.position.distanceTo(eb.group.position)
          if (dist > LINK_MAX || dist < LINK_MIN) continue
          const key = pairKey(ea.slot, eb.slot)
          if (unlocked.has(key)) continue
          unlocked.add(key)
          persist()
          const name = nameForKey(key)
          onUnlock?.(name, ea.type.name, eb.type.name)
          return { name, key }
        }
      }
      return null
    },
  }
}
