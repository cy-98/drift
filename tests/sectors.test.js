import { describe, it, expect } from 'vitest'
import { sectorLabel, sectorCoords, sectorEvent } from '../src/core/sectors.js'

describe('sectors', () => {
  it('labels sectors deterministically', () => {
    expect(sectorLabel(0, 0)).toBe(sectorLabel(100, 50))
    expect(sectorLabel(800, 0)).not.toBe(sectorLabel(0, 0))
  })

  it('returns grid coords', () => {
    expect(sectorCoords(800, -720)).toEqual({ sx: 1, sz: -1 })
  })

  it('picks sector events', () => {
    expect(sectorEvent(0, 0).title).toBeTruthy()
  })
})
