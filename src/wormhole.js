import * as THREE from 'https://esm.sh/three@0.172.0'

const WARP_DIST = 42
const COOLDOWN = 8

export function createWormholes(scene) {
  const group = new THREE.Group()
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x6eb8e8,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })

  const holes = []
  for (let i = 0; i < 2; i++) {
    const g = new THREE.Group()
    const ring = new THREE.Mesh(new THREE.TorusGeometry(12, 0.35, 8, 48), ringMat)
    const core = new THREE.Mesh(new THREE.SphereGeometry(4, 16, 16), coreMat)
    g.add(ring, core)
    group.add(g)
    holes.push({
      mesh: g,
      offset: i * 900 + 420,
      cooldown: 0,
    })
  }
  scene.add(group)

  const _ahead = new THREE.Vector3()
  let flash = 0

  function place(hole, camera) {
    _ahead.set(0, 0, -1).applyQuaternion(camera.quaternion)
    hole.mesh.position
      .copy(camera.position)
      .addScaledVector(_ahead, hole.offset)
      .add(new THREE.Vector3((hole.offset % 80) - 40, Math.sin(hole.offset) * 20, 0))
    hole.mesh.lookAt(camera.position)
  }

  function update(elapsed, camera, dt, onWarp) {
    flash = Math.max(0, flash - dt)
    for (const hole of holes) {
      hole.cooldown = Math.max(0, hole.cooldown - dt)
      place(hole, camera)
      hole.mesh.rotation.z = elapsed * 0.6
      const ring = hole.mesh.children[0]
      ring.scale.setScalar(1 + Math.sin(elapsed * 2 + hole.offset) * 0.06)
    }

    const h = holes[0]
    const dist = h.mesh.position.distanceTo(camera.position)
    if (dist < WARP_DIST && h.cooldown <= 0) {
      _ahead.set(0, 0, -1).applyQuaternion(camera.quaternion)
      camera.position.addScaledVector(_ahead, 280)
      camera.position.y += (Math.random() - 0.5) * 40
      h.cooldown = COOLDOWN
      flash = 0.35
      onWarp?.('星门', '空间折跃了一瞬，前方是另一片星野。')
    }

    return { flash }
  }

  function dispose() {
    scene.remove(group)
    ringMat.dispose()
    coreMat.dispose()
  }

  return { update, dispose, getFlash: () => flash }
}
