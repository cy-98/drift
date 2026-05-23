import { describe, it, expect } from 'vitest'
import { createAchievementTracker, ACHIEVEMENT_DEFS } from '../src/core/achievements.js'

function memStorage() {
  const map = new Map()
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
  }
}

describe('achievements', () => {
  it('unlocks when progress matches', () => {
    const a = createAchievementTracker(memStorage())
    const hit = a.evaluate({ warps: 1, loreEvents: 0, collectTotal: 0, poiVisited: 0, playTimeSec: 0 }, {})
    expect(hit?.id).toBe('warp')
    expect(a.unlockedIds()).toContain('warp')
  })

  it('does not duplicate unlocks', () => {
    const a = createAchievementTracker(memStorage())
    a.evaluate({ warps: 2 }, {})
    expect(a.evaluate({ warps: 3 }, {})).toBeNull()
  })

  it('defines stable ids', () => {
    expect(ACHIEVEMENT_DEFS.length).toBeGreaterThanOrEqual(5)
  })
})
