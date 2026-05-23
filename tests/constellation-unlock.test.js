import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { createConstellationUnlock } from '../src/core/constellation-unlock.js'

function memStorage() {
  const map = new Map()
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
  }
}

describe('constellation unlock', () => {
  it('unlocks linked visited POI pairs once', () => {
    const cu = createConstellationUnlock(memStorage())
    const p0 = new THREE.Vector3(0, 0, 0)
    const p1 = new THREE.Vector3(100, 0, 0)
    const entries = [
      {
        slot: 0,
        visited: true,
        type: { name: 'A' },
        group: { position: p0 },
      },
      {
        slot: 1,
        visited: true,
        type: { name: 'B' },
        group: { position: p1 },
      },
    ]
    const hit = cu.check(entries)
    expect(hit?.name).toBeTruthy()
    expect(cu.check(entries)).toBeNull()
    expect(cu.hasPair(0, 1)).toBe(true)
  })
})
