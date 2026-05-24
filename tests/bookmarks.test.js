import { describe, it, expect } from 'vitest'
import { createBookmarks } from '../src/core/bookmarks.js'

function memStorage() {
  const map = new Map()
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) }
}

describe('bookmarks', () => {
  it('adds and exports marks', () => {
    const b = createBookmarks(memStorage())
    b.add({ x: 1, y: 2, z: 3 }, '测试')
    expect(b.list()).toHaveLength(1)
    expect(b.exportPayload()[0].label).toBe('测试')
  })
})
