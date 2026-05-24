/** @param {HTMLCanvasElement} canvas @param {{ gx: number, gz: number, visited: Array<{ id: string, name?: string }> }} data */
export function renderGalaxyMap(canvas, { gx, gz, visited }) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const w = canvas.width
  const h = canvas.height
  const span = 4
  const cell = Math.min(w, h) / (span * 2 + 1)
  const ox = w / 2 - gx * cell
  const oy = h / 2 - gz * cell

  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#061428'
  ctx.fillRect(0, 0, w, h)

  const visitedSet = new Set(visited.map((v) => v.id))

  for (let dy = -span; dy <= span; dy++) {
    for (let dx = -span; dx <= span; dx++) {
      const cx = gx + dx
      const cz = gz + dy
      const id = `g:${cx},${cz}`
      const px = ox + cx * cell
      const py = oy + cz * cell
      const isHere = dx === 0 && dy === 0
      const seen = visitedSet.has(id)

      ctx.beginPath()
      ctx.arc(px, py, cell * 0.22, 0, Math.PI * 2)
      if (isHere) {
        ctx.fillStyle = '#6eb8e8'
        ctx.fill()
        ctx.strokeStyle = '#c8dcff'
        ctx.lineWidth = 1.5
        ctx.stroke()
      } else if (seen) {
        ctx.fillStyle = 'rgba(110, 184, 232, 0.55)'
        ctx.fill()
      } else {
        ctx.fillStyle = 'rgba(110, 184, 232, 0.12)'
        ctx.fill()
      }
    }
  }

  ctx.fillStyle = '#8aa4bc'
  ctx.font = '11px Segoe UI, PingFang SC, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`当前 · ${gx}, ${gz}`, w / 2, h - 8)
}
