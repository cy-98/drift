import { setGalaxyCatalog } from './galaxies.js'
import { assetUrl } from '../base-path.js'

/**
 * Load galaxy archetype definitions from JSON (authoring mirrors data/galaxies/*.yml).
 * @returns {Promise<boolean>} true if remote catalog merged
 */
export async function loadGalaxyCatalog(baseUrl = assetUrl('data/galaxies/archetypes.json')) {
  try {
    const res = await fetch(baseUrl, { cache: 'no-cache' })
    if (!res.ok) return false
    const data = await res.json()
    if (!data || typeof data !== 'object') return false
    setGalaxyCatalog(data)
    return true
  } catch {
    return false
  }
}
