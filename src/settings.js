const STORAGE_KEY = 'drift-settings'

export const defaults = {
  sensitivity: 1,
  baseSpeed: 6,
  reducedMotion: false,
  bloom: true,
  ambient: true,
  vignette: true,
  quality: 'medium',
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaults }
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return { ...defaults }
  }
}

export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}
