import { describe, it, expect } from 'vitest'
import { distance3, findNearestIndex } from '../src/util.js'

describe('util', () => {
  it('distance3', () => {
    expect(distance3({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 })).toBe(5)
  })

  it('findNearestIndex', () => {
    const items = [
      { position: { x: 100, y: 0, z: 0 } },
      { position: { x: 2, y: 0, z: 0 } },
      { position: { x: 50, y: 0, z: 0 } },
    ]
    expect(findNearestIndex(items, { x: 0, y: 0, z: 0 })).toBe(1)
  })
})
