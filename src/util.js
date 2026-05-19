/** @param {{ x: number, y: number, z: number }[]} positions */
export function distance3(a, b) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

/** @param {{ position: { x: number, y: number, z: number } }[]} items */
export function findNearestIndex(items, point) {
  let best = 0
  let bestD = Infinity
  for (let i = 0; i < items.length; i++) {
    const d = distance3(items[i].position, point)
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  return best
}
