import { createWebStorage } from './platform/web/storage-web.js'
import { createSettingsStore, defaults } from './core/settings.js'

export { defaults, createSettingsStore }

const store = createSettingsStore(createWebStorage())

export function loadSettings() {
  return store.load()
}

export function saveSettings(settings) {
  store.save(settings)
}
