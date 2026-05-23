import * as THREE from 'three'

export function createConstellation(scene) {
  const maxSeg = 24
  const positions = new Float32Array(maxSeg * 2 * 3)
  const colors = new Float32Array(maxSeg * 2 * 3)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const mat = new THREE.LineBasicMaterial({
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true,
  })
  const lines = new THREE.LineSegments(geo, mat)
  scene.add(lines)

  const dim = new THREE.Color(0x6eb8e8)
  const bright = new THREE.Color(0xb8f0ff)

  function update(getPoints, isUnlocked) {
    const pts = getPoints()
    let i = 0
    let anyUnlocked = false
    for (let a = 0; a < pts.length; a++) {
      for (let b = a + 1; b < pts.length; b++) {
        if (i >= maxSeg * 2) break
        const pa = pts[a].position ?? pts[a]
        const pb = pts[b].position ?? pts[b]
        const dist = pa.distanceTo(pb)
        if (dist > 220 || dist < 40) continue
        const unlocked = isUnlocked?.(pts[a].slot, pts[b].slot)
        if (unlocked) anyUnlocked = true
        const c = unlocked ? bright : dim
        const i3 = i * 3
        positions[i3] = pa.x
        positions[i3 + 1] = pa.y
        positions[i3 + 2] = pa.z
        positions[i3 + 3] = pb.x
        positions[i3 + 4] = pb.y
        positions[i3 + 5] = pb.z
        colors[i3] = c.r
        colors[i3 + 1] = c.g
        colors[i3 + 2] = c.b
        colors[i3 + 3] = c.r
        colors[i3 + 4] = c.g
        colors[i3 + 5] = c.b
        i += 2
      }
    }
    geo.setDrawRange(0, i)
    geo.attributes.position.needsUpdate = true
    geo.attributes.color.needsUpdate = true
    lines.visible = i > 0
    mat.opacity = anyUnlocked ? 0.38 : 0.28
  }

  function dispose() {
    scene.remove(lines)
    geo.dispose()
    mat.dispose()
  }

  return { update, dispose }
}
