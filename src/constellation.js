import * as THREE from 'three'

export function createConstellation(scene) {
  const maxSeg = 24
  const positions = new Float32Array(maxSeg * 2 * 3)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const mat = new THREE.LineBasicMaterial({
    color: 0x6eb8e8,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const lines = new THREE.LineSegments(geo, mat)
  scene.add(lines)

  function update(getPoints) {
    const pts = getPoints()
    let i = 0
    for (let a = 0; a < pts.length; a++) {
      for (let b = a + 1; b < pts.length; b++) {
        if (i >= maxSeg * 2) break
        const pa = pts[a]
        const pb = pts[b]
        const dist = pa.distanceTo(pb)
        if (dist > 220 || dist < 40) continue
        const i3 = i * 3
        positions[i3] = pa.x
        positions[i3 + 1] = pa.y
        positions[i3 + 2] = pa.z
        positions[i3 + 3] = pb.x
        positions[i3 + 4] = pb.y
        positions[i3 + 5] = pb.z
        i += 2
      }
    }
    geo.setDrawRange(0, i)
    geo.attributes.position.needsUpdate = true
    lines.visible = i > 0
  }

  function dispose() {
    scene.remove(lines)
    geo.dispose()
    mat.dispose()
  }

  return { update, dispose }
}
