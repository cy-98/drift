import * as THREE from 'three'

const COUNT = 3
const SPAWN = 260
const RECYCLE = 480

function buildMonolith(mats) {
  const body = new THREE.Group()
  const hull = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 14), mats.hull)
  const mast = new THREE.Mesh(new THREE.BoxGeometry(1, 12, 1), mats.hull)
  mast.position.y = 7
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 10), mats.beacon)
  beacon.position.y = 14
  body.add(hull, mast, beacon)
  return { mesh: body, beacon }
}

function buildRingOutpost(mats) {
  const body = new THREE.Group()
  const core = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.8, 5, 10), mats.hull)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(9, 0.55, 8, 32), mats.hull)
  ring.rotation.x = Math.PI * 0.5
  const spar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 16, 1.2), mats.hull)
  spar.position.y = 8
  const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(1.4, 0), mats.beacon)
  beacon.position.y = 17
  body.add(core, ring, spar, beacon)
  return { mesh: body, beacon }
}

function buildDebrisArch(mats) {
  const body = new THREE.Group()
  const slabA = new THREE.Mesh(new THREE.BoxGeometry(14, 2.5, 4), mats.hull)
  slabA.rotation.z = 0.35
  slabA.position.set(-3, 2, 0)
  const slabB = new THREE.Mesh(new THREE.BoxGeometry(12, 2, 3.5), mats.hull)
  slabB.rotation.z = -0.28
  slabB.position.set(4, -1, 1)
  const pillar = new THREE.Mesh(new THREE.BoxGeometry(2, 11, 2), mats.hull)
  pillar.position.set(0, 4, -2)
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 8), mats.beacon)
  beacon.position.set(0, 10, 0)
  body.add(slabA, slabB, pillar, beacon)
  return { mesh: body, beacon }
}

const BUILDERS = [buildMonolith, buildRingOutpost, buildDebrisArch]

export function createStations(scene) {
  const group = new THREE.Group()
  const mats = {
    hull: new THREE.MeshBasicMaterial({
      color: 0x9ab0c8,
      transparent: true,
      opacity: 0.85,
    }),
    beacon: new THREE.MeshBasicMaterial({
      color: 0x6eb8e8,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  }

  const stations = []
  for (let i = 0; i < COUNT; i++) {
    const built = BUILDERS[i % BUILDERS.length](mats)
    group.add(built.mesh)
    stations.push({ ...built, seed: i * 137, variant: i % BUILDERS.length })
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
      st.beacon.material.opacity = 0.65 + Math.sin(elapsed * 2 + st.seed) * 0.25
    }
  }

  function dispose() {
    scene.remove(group)
    mats.hull.dispose()
    mats.beacon.dispose()
  }

  return { update, dispose, list: () => stations.map((s) => s.mesh.position) }
}
