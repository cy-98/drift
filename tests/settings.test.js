import { describe, it, expect } from 'vitest'
import { defaults } from '../src/settings.js'

describe('settings defaults', () => {
  it('has movement and quality fields', () => {
    expect(defaults.baseSpeed).toBeGreaterThan(0)
    expect(['low', 'medium', 'high']).toContain(defaults.quality)
    expect(defaults.vignette).toBe(true)
    expect(defaults.lakeGlow).toBe(true)
    expect(defaults.music).toBe(true)
    expect(defaults.narration).toBe(false)
    expect(defaults.collectibles).toBe(true)
  })
})
