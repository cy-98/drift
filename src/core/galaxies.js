import { DEFAULT_GALAXY_CATALOG } from './galaxy-data.js'

export const GALAXY_SECTOR_SPAN = 4
export const SECTOR_CELL = 720

/** @typedef {{ nebula: string, fog: number, starDensity: number, lakeIntensity: number }} GalaxyPalette */
/** @typedef {{ title: string, text: string }} GalaxyLore */
/** @typedef {{ palette: GalaxyPalette, poiWeights: Record<string, number>, lore: GalaxyLore }} GalaxyTemplate */
/** @typedef {GalaxyTemplate & { id: string, gx: number, gz: number, name: string, archetype: string }} GalaxyMeta */

const ARCHETYPES = /** @type {const} */ (['still-lake', 'ember', 'mist', 'void-hall'])
const PREFIX = ['薄雾弧', '余烬冠', '青渊', '空廊', '静潮带', '星环幕']
const SUFFIX = ['群', '星系', '浅滩', '回环']

let catalog = { ...DEFAULT_GALAXY_CATALOG }

export function setGalaxyCatalog(next) {
  if (!next || typeof next !== 'object') return
  catalog = { ...DEFAULT_GALAXY_CATALOG, ...next }
}

export function getGalaxyCatalog() {
  return catalog
}

export function galaxyCoords(x, z, sectorCell = SECTOR_CELL, span = GALAXY_SECTOR_SPAN) {
  const worldCell = sectorCell * span
  return {
    gx: Math.floor(x / worldCell),
    gz: Math.floor(z / worldCell),
  }
}

export function galaxySeed(gx, gz) {
  return (gx * 374761393 + gz * 668265263) >>> 0
}

export function galaxyId(gx, gz) {
  return `g:${gx},${gz}`
}

export function galaxyLabel(gx, gz) {
  const seed = galaxySeed(gx, gz)
  const pre = PREFIX[seed % PREFIX.length]
  const suf = SUFFIX[(seed >>> 8) % SUFFIX.length]
  return `${pre}${suf}`
}

export function galaxyArchetype(gx, gz) {
  const seed = galaxySeed(gx, gz)
  return ARCHETYPES[seed % ARCHETYPES.length]
}

/**
 * @param {number} x
 * @param {number} z
 * @returns {GalaxyMeta}
 */
export function galaxyMeta(x, z) {
  const { gx, gz } = galaxyCoords(x, z)
  const archetype = galaxyArchetype(gx, gz)
  const tpl = catalog[archetype] ?? catalog['still-lake']
  return {
    id: galaxyId(gx, gz),
    gx,
    gz,
    name: galaxyLabel(gx, gz),
    archetype,
    palette: { ...tpl.palette },
    poiWeights: { ...tpl.poiWeights },
    lore: { ...tpl.lore },
  }
}

export const GALAXY_WORLD_CELL = SECTOR_CELL * GALAXY_SECTOR_SPAN

/** ~25% 星系附近可见际门 */
export function interGateAvailable(gx, gz) {
  return ((galaxySeed(gx, gz) >>> 5) % 4) === 0
}

export function pickAdjacentGalaxy(gx, gz, salt = 0) {
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]
  const idx = (galaxySeed(gx, gz) + salt * 17) % dirs.length
  const [dx, dz] = dirs[idx]
  return { gx: gx + dx, gz: gz + dz }
}

export function galaxyCenterWorld(gx, gz, cell = GALAXY_WORLD_CELL) {
  return { x: gx * cell + cell * 0.5, z: gz * cell + cell * 0.5 }
}
