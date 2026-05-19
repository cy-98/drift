import { describe, it, expect } from 'vitest'
import { createProgressTracker, defaultProgress } from '../src/core/progress.js'

function memStorage() {
  const map = new Map()
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
  }
}

describe('progress tracker', () => {
  it('persists and exports play stats', () => {
    const storage = memStorage()
    const p = createProgressTracker(storage)
    p.tick(120)
    p.noteWarp()
    p.syncRuntime({ collectTotal: 5, poiVisited: 2 })
    p.save()

    const reloaded = createProgressTracker(storage)
    expect(reloaded.getState().playTimeSec).toBe(120)

    const fresh = createProgressTracker(memStorage())
    expect(fresh.applyImport(JSON.parse(p.exportJson()))).toBe(true)
    expect(fresh.getState().collectTotal).toBe(5)
    expect(fresh.getState().warps).toBe(1)
  })

  it('has sane defaults', () => {
    expect(defaultProgress.version).toBe(1)
  })
})
