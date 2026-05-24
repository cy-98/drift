const STORAGE_KEY = 'drift-achievements'

/** @typedef {{ id: string, title: string, desc: string, check: (state: object, ctx: object) => boolean }} AchievementDef */

/** @type {AchievementDef[]} */
export const ACHIEVEMENT_DEFS = [
  {
    id: 'awake',
    title: '苏醒',
    desc: '第一次进入漫游。',
    check: (_s, ctx) => !!ctx.engaged,
  },
  {
    id: 'first_lore',
    title: '初译',
    desc: '读到第一条星野告示。',
    check: (s) => s.loreEvents >= 1,
  },
  {
    id: 'warp',
    title: '折跃',
    desc: '穿过星门一次。',
    check: (s) => s.warps >= 1,
  },
  {
    id: 'dust_12',
    title: '微光',
    desc: '收集 12 粒星尘。',
    check: (s) => s.collectTotal >= 12,
  },
  {
    id: 'poi_3',
    title: '旅人',
    desc: '邂逅 3 处行星。',
    check: (s) => s.poiVisited >= 3,
  },
  {
    id: 'drift_30',
    title: '久漂',
    desc: '累计漫游 30 分钟。',
    check: (s) => s.playTimeSec >= 1800,
  },
  {
    id: 'bookmark',
    title: '路标',
    desc: '留下第一处星图标记。',
    check: (_s, ctx) => (ctx.bookmarks ?? 0) >= 1,
  },
  {
    id: 'photo',
    title: '取景',
    desc: '使用截图模式。',
    check: (_s, ctx) => !!ctx.photoUsed,
  },
]

export function createAchievementTracker(storage) {
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

  return {
    list() {
      return ACHIEVEMENT_DEFS.map((def) => ({
        ...def,
        unlocked: unlocked.has(def.id),
      }))
    },
    unlockedIds: () => [...unlocked],
    applyImport(ids) {
      if (!Array.isArray(ids)) return
      unlocked = new Set(ids.filter((id) => ACHIEVEMENT_DEFS.some((d) => d.id === id)))
      persist()
    },
    /** @returns {AchievementDef | null} newly unlocked */
    evaluate(state, ctx) {
      for (const def of ACHIEVEMENT_DEFS) {
        if (unlocked.has(def.id)) continue
        if (!def.check(state, ctx)) continue
        unlocked.add(def.id)
        persist()
        return def
      }
      return null
    },
    formatSummary() {
      return `成就 ${unlocked.size}/${ACHIEVEMENT_DEFS.length}`
    },
  }
}
