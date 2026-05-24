import { describe, it, expect } from 'vitest'
import {
  galaxyCoords,
  galaxyMeta,
  galaxyArchetype,
  galaxyLabel,
  galaxyId,
  setGalaxyCatalog,
  interGateAvailable,
  pickAdjacentGalaxy,
  galaxyCenterWorld,
  GALAXY_WORLD_CELL,
} from '../src/core/galaxies.js'

describe('galaxies', () => {
  it('maps world coords to galaxy grid (4×4 sectors)', () => {
    expect(galaxyCoords(0, 0)).toEqual({ gx: 0, gz: 0 })
    expect(galaxyCoords(2879, 2879)).toEqual({ gx: 0, gz: 0 })
    expect(galaxyCoords(2880, 0)).toEqual({ gx: 1, gz: 0 })
  })

  it('labels galaxies deterministically', () => {
    expect(galaxyLabel(0, 0)).toBe(galaxyLabel(0, 0))
    expect(galaxyLabel(1, 0)).not.toBe(galaxyLabel(0, 0))
  })

  it('returns stable meta with four archetypes', () => {
    const meta = galaxyMeta(100, 200)
    expect(meta.id).toBe(galaxyId(meta.gx, meta.gz))
    expect(['still-lake', 'ember', 'mist', 'void-hall']).toContain(meta.archetype)
    expect(meta.palette.nebula).toMatch(/^#/)
    expect(meta.lore.title).toBeTruthy()
  })

  it('merges catalog overrides', () => {
    setGalaxyCatalog({
      ember: {
        palette: { nebula: '#ff0000', fog: 0.5, starDensity: 1, lakeIntensity: 1 },
        poiWeights: {},
        lore: { title: '测试', text: '覆盖' },
      },
    })
    let found = false
    for (let gx = -2; gx <= 2 && !found; gx++) {
      for (let gz = -2; gz <= 2 && !found; gz++) {
        if (galaxyArchetype(gx, gz) === 'ember') {
          const meta = galaxyMeta(gx * 2880, gz * 2880)
          expect(meta.lore.title).toBe('测试')
          found = true
        }
      }
    }
    expect(found).toBe(true)
  })

  it('finds inter gates on some galaxies', () => {
    let any = false
    for (let gx = -3; gx <= 3; gx++) {
      for (let gz = -3; gz <= 3; gz++) {
        if (interGateAvailable(gx, gz)) any = true
      }
    }
    expect(any).toBe(true)
  })

  it('picks adjacent galaxy cells', () => {
    const next = pickAdjacentGalaxy(2, -1)
    expect(Math.abs(next.gx - 2) + Math.abs(next.gz + 1)).toBe(1)
  })

  it('centers world coords in galaxy cell', () => {
    const c = galaxyCenterWorld(0, 0)
    expect(c.x).toBe(GALAXY_WORLD_CELL / 2)
    expect(c.z).toBe(GALAXY_WORLD_CELL / 2)
  })
})
