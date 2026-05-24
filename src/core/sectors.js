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

const EVENTS = [
  { title: '静潮涨落', text: '星雾在这里缓慢呼吸，像远海上的潮汐。' },
  { title: '薄雾拱桥', text: '淡蓝星云弯成桥，邀请你继续向前漂。' },
  { title: '星烬雨', text: '余烬般的微光飘落，并不灼人，只是提醒时间仍在流动。' },
  { title: '深流回旋', text: '暗流把光折成螺旋，空间在此轻轻打旋。' },
  { title: '余晖带', text: '旧日的光仍在这条带上徘徊，不肯完全熄灭。' },
]

export function sectorEvent(x, z, cell = 720) {
  const { sx, sz } = sectorCoords(x, z, cell)
  const seed = (sx * 668265263 + sz * 374761393) >>> 0
  return EVENTS[seed % EVENTS.length]
}
