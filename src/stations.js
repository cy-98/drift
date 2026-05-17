import * as THREE from 'https://esm.sh/three@0.172.0'

const COUNT = 3
const SPAWN = 260
const RECYCLE = 480

export function createStations(scene) {
  const group = new THREE.Group()
  const mat = new THREE.MeshBasicMaterial({
    color: 0x9ab0c8,
    transparent: true,
    opacity: 0.85,
  })
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0x6eb8e8,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })

  const stations = []
  for (let i = 0; i < COUNT; i++) {
    const body = new THREE.Group()
    const hull = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 14), mat)
    const mast = new THREE.Mesh(new THREE.BoxGeometry(1, 12, 1), mat)
    mast.position.y = 7
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 10), beaconMat)
    beacon.position.y = 14
    body.add(hull, mast, beacon)
    group.add(body)
    stations.push({ mesh: body, seed: i * 137 })
  }
  scene.add(group)

  const _ahead = new THREE.Vector3()
  const _right = new THREE.Vector3()

  function respawn(st, camera) {
    const basis = _ahead.set(0, 0, -1).applyQuaternion(camera.quaternion)
    _right.set(1, 0, 0).applyQuaternion(camera.quaternion)
    const side = (st.seed % 2 === 0 ? 1 : -1) * (40 + (st.seed % 30))
    st.mesh.position
      .copy(camera.position)
      .addScaledVector(basis, SPAWN + st.seed * 40)
      .addScaledVector(_right, side)
      .add(new THREE.Vector3(0, (st.seed % 5) * 8 - 16, 0))
    st.mesh.lookAt(camera.position)
  }

  for (const st of stations) respawn(st, { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() })

  function update(elapsed, camera) {
    for (const st of stations) {
      const d = st.mesh.position.distanceTo(camera.position)
      if (d > RECYCLE) respawn(st, camera)
      st.mesh.children[2].material.opacity = 0.65 + Math.sin(elapsed * 2 + st.seed) * 0.25
    }
  }

  function dispose() {
    scene.remove(group)
    mat.dispose()
    beaconMat.dispose()
  }

  return { update, dispose, list: () => stations.map((s) => s.mesh.position) }
}
