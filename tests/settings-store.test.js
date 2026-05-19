import { describe, it, expect, beforeEach } from 'vitest'
import { createSettingsStore, defaults } from '../src/core/settings.js'

function mockStorage() {
  const map = new Map()
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
  }
}

describe('createSettingsStore', () => {
  let storage
  let store

  beforeEach(() => {
    storage = mockStorage()
    store = createSettingsStore(storage)
  })

  it('loads defaults when empty', () => {
    expect(store.load().baseSpeed).toBe(defaults.baseSpeed)
  })

  it('persists values', () => {
    store.save({ ...defaults, baseSpeed: 9 })
    expect(store.load().baseSpeed).toBe(9)
  })
})
