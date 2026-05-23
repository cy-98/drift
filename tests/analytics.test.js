import { describe, it, expect } from 'vitest'
import { createAnalytics } from '../src/core/analytics.js'

function memStorage() {
  const map = new Map()
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
  }
}

describe('analytics', () => {
  it('tracks sessions and poi hits', () => {
    const a = createAnalytics(memStorage())
    a.startSession()
    a.tick(600)
    a.notePoi('蓝冻结海')
    a.notePoi('蓝冻结海')
    a.endSession()
    expect(a.getState().sessions).toBe(1)
    expect(a.getState().totalSessionSec).toBeGreaterThanOrEqual(600)
    expect(a.topPoi()).toBe('蓝冻结海')
  })
})
