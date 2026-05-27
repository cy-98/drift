/** POI slot layout (normalized) for abstract constellation chart */
const SLOT = [
  [0.5, 0.2],
  [0.76, 0.36],
  [0.68, 0.72],
  [0.32, 0.72],
  [0.24, 0.36],
  [0.5, 0.52],
]

/** @param {HTMLCanvasElement} canvas @param {Array<{ key: string, name: string }>} unlocked */
export function renderConstellationMap(canvas, unlocked) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const w = canvas.width
  const h = canvas.height
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#061428'
  ctx.fillRect(0, 0, w, h)

  const px = (u) => u * w
  const py = (v) => v * h

  for (let i = 0; i < SLOT.length; i++) {
    const [u, v] = SLOT[i]
    ctx.beginPath()
    ctx.arc(px(u), py(v), 3, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(110, 184, 232, 0.25)'
    ctx.fill()
  }

  if (!unlocked.length) {
    ctx.fillStyle = '#6a8098'
    ctx.font = '11px Segoe UI, PingFang SC, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('造访相邻 POI 后解锁连线', w / 2, h / 2)
    return
  }

  const lit = new Set()
  for (const { key, name } of unlocked) {
    const parts = key.split(':').map(Number)
    if (parts.length !== 2 || parts.some(Number.isNaN)) continue
    const [a, b] = parts
    if (a < 0 || b < 0 || a >= SLOT.length || b >= SLOT.length) continue
    lit.add(a)
    lit.add(b)

    const [ua, va] = SLOT[a]
    const [ub, vb] = SLOT[b]
    ctx.beginPath()
    ctx.moveTo(px(ua), py(va))
    ctx.lineTo(px(ub), py(vb))
    ctx.strokeStyle = 'rgba(184, 240, 255, 0.55)'
    ctx.lineWidth = 1.2
    ctx.stroke()

    const mx = (ua + ub) * 0.5
    const my = (va + vb) * 0.5
    ctx.fillStyle = 'rgba(138, 164, 188, 0.85)'
    ctx.font = '9px Segoe UI, PingFang SC, sans-serif'
    ctx.textAlign = 'center'
    const label = name.length > 8 ? `${name.slice(0, 7)}…` : name
    ctx.fillText(label, px(mx), py(my) - 4)
  }

  for (const i of lit) {
    const [u, v] = SLOT[i]
    ctx.beginPath()
    ctx.arc(px(u), py(v), 4.5, 0, Math.PI * 2)
    ctx.fillStyle = '#6eb8e8'
    ctx.fill()
    ctx.strokeStyle = '#c8dcff'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  ctx.fillStyle = '#8aa4bc'
  ctx.font = '11px Segoe UI, PingFang SC, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`已解锁 ${unlocked.length} 条星座连线`, w / 2, h - 8)
}
