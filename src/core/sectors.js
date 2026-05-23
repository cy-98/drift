const PREFIX = ['静潮', '薄雾', '远湖', '深流', '星烬', '青冕', '余晖', '空廊']
const SUFFIX = ['星域', '走廊', '褶皱', '余韵', '浅滩', '湾', '带', '序曲']

export function sectorCoords(x, z, cell = 720) {
  return { sx: Math.floor(x / cell), sz: Math.floor(z / cell) }
}

export function sectorLabel(x, z, cell = 720) {
  const { sx, sz } = sectorCoords(x, z, cell)
  const seed = (sx * 374761393 + sz * 668265263) >>> 0
  const pre = PREFIX[seed % PREFIX.length]
  const suf = SUFFIX[(seed >>> 8) % SUFFIX.length]
  return `${pre}${suf}`
}
