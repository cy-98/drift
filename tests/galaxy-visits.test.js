import { describe, it, expect } from 'vitest'
import { createGalaxyVisits } from '../src/core/galaxy-visits.js'

function memStorage() {
  const map = new Map()
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
  }
}

describe('galaxy-visits', () => {
  it('records unique galaxy visits', () => {
    const v = createGalaxyVisits(memStorage())
    const meta = { id: 'g:0,0', name: '薄雾弧群', archetype: 'mist' }
    expect(v.visit(meta)).toBe(true)
    expect(v.visit(meta)).toBe(false)
    expect(v.list()).toHaveLength(1)
  })

  it('tracks archetype diversity', () => {
    const v = createGalaxyVisits(memStorage())
    v.visit({ id: 'g:0,0', name: 'A', archetype: 'mist' })
    v.visit({ id: 'g:1,0', name: 'B', archetype: 'ember' })
    expect(v.archetypesVisited().size).toBe(2)
  })
})
