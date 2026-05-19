/** @param {import('./storage.js').KeyValueStorage} storage */

const STORAGE_KEY = 'drift-settings'

export const defaults = {
  sensitivity: 1,
  baseSpeed: 6,
  reducedMotion: false,
  bloom: true,
  ambient: true,
  vignette: true,
  lakeGlow: true,
  music: true,
  narration: false,
  quality: 'medium',
  collectibles: true,
}

export function createSettingsStore(storage) {
  return {
    defaults,
    load() {
      try {
        const raw = storage.getItem(STORAGE_KEY)
        if (!raw) return { ...defaults }
        return { ...defaults, ...JSON.parse(raw) }
      } catch {
        return { ...defaults }
      }
    },
    save(settings) {
      storage.setItem(STORAGE_KEY, JSON.stringify(settings))
    },
  }
}
