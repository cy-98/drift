import * as THREE from 'https://esm.sh/three@0.172.0'

const TYPES = [
  {
    name: '蓝冻结海',
    color: 0x6eb8e8,
    emissive: 0x1a4060,
    scale: 4.2,
    lore: '冰晶在暗面上缓慢开裂，像宇宙在呼吸。',
  },
  {
    name: '环形沙巢',
    color: 0xe8c878,
    emissive: 0x5a4020,
    scale: 5.5,
    lore: '尘埃环在引力中低语，时间在这里走得很慢。',
  },
  {
    name: '琥珀气旋',
    color: 0xffaa66,
    emissive: 0x6a3010,
    scale: 6.8,
    lore: '气体旋涡把光折成蜂蜜色，没有尽头。',
  },
  {
    name: '余烬星核',
    color: 0xff8866,
    emissive: 0x802020,
    scale: 3.8,
    lore: '冷却的星核仍有余温，像被遗忘的篝火。',
  },
  {
    name: '极光冠',
    color: 0x88ffcc,
    emissive: 0x206050,
    scale: 5,
    lore: '磁场把天空缝成丝带，静得能听见颜色。',
  },
]

const POI_COUNT = 6
const SPAWN_MIN = 180
const SPAWN_MAX = 360
const RECYCLE_DIST = 520
const DISCOVER_DIST = 90
const CLOSE_DIST = 55

function pickType(seed) {
  return TYPES[Math.abs(seed) % TYPES.length]
}

function viewBasis(camera) {
  const ahead = new THREE.Vector3(0, 0, -1)
  const right = new THREE.Vector3(1, 0, 0)
  if (camera.quaternion) {
    ahead.applyQuaternion(camera.quaternion)
    right.applyQuaternion(camera.quaternion)
  } else {
    const y = camera.rotation?.y ?? 0
    ahead.set(-Math.sin(y), 0, -Math.cos(y))
    right.set(Math.cos(y), 0, -Math.sin(y))
  }
  return { ahead, right }
}

function makePoiMesh(type, bloom) {
  const group = new THREE.Group()
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(1, 20, 20),
    new THREE.MeshBasicMaterial({ color: type.color }),
  )
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(1.35, 16, 16),
    new THREE.MeshBasicMaterial({
      color: type.emissive,
      transparent: true,
      opacity: bloom ? 0.35 : 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.5, 2.1, 32),
    new THREE.MeshBasicMaterial({
      color: type.color,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  ring.rotation.x = Math.PI * 0.42
  group.add(core, glow, ring)
  group.scale.setScalar(type.scale)
  return { group, core, glow, ring }
}

export function createPois(scene, { reducedMotion, bloom }) {
  const root = new THREE.Group()
  scene.add(root)
  const entries = []
  let loreCooldown = 0

  function spawnOne(camera, slot) {
    const type = pickType(slot + Math.floor(camera.position.length() * 0.07))
    const meshes = makePoiMesh(type, bloom)
    const { ahead, right } = viewBasis(camera)
    const dist = SPAWN_MIN + ((slot * 47) % 100) * ((SPAWN_MAX - SPAWN_MIN) / 100)
    const side = Math.sin(slot * 2.399963) * dist * 0.55
    const lift = (slot % 3 - 1) * 35 + Math.sin(slot * 1.7) * 20
    meshes.group.position
      .copy(camera.position)
      .addScaledVector(ahead, dist)
      .addScaledVector(right, side)
    meshes.group.position.y += lift
    root.add(meshes.group)
    return {
      ...meshes,
      type,
      discovered: false,
      visited: false,
      slot,
    }
  }

  const origin = new THREE.Object3D()
  for (let i = 0; i < POI_COUNT; i++) entries.push(spawnOne(origin, i))

  function recycle(entry, camera) {
    root.remove(entry.group)
    const next = spawnOne(camera, entry.slot)
    Object.assign(entry, next)
  }

  function update(elapsed, camera, dt, onLore) {
    loreCooldown = Math.max(0, loreCooldown - dt)
    const motion = reducedMotion ? 0.3 : 1

    for (const entry of entries) {
      const dist = entry.group.position.distanceTo(camera.position)
      if (dist > RECYCLE_DIST) recycle(entry, camera)

      const pulse = 1 + Math.sin(elapsed * 1.1 + entry.slot) * 0.04 * motion
      entry.glow.scale.setScalar(pulse * 1.35)
      entry.ring.rotation.z += dt * 0.12 * motion

      if (dist < DISCOVER_DIST && !entry.discovered) {
        entry.discovered = true
      }
      if (dist < CLOSE_DIST && !entry.visited && loreCooldown <= 0) {
        entry.visited = true
        loreCooldown = 8
        onLore?.(entry.type.name, entry.type.lore)
      }
    }
  }

  function list() {
    return entries.map((e) => ({
      name: e.type.name,
      position: e.group.position,
      discovered: e.discovered,
      visited: e.visited,
    }))
  }

  function dispose() {
    for (const g of [...root.children]) {
      g.traverse((o) => {
        o.geometry?.dispose()
        o.material?.dispose()
      })
      root.remove(g)
    }
    scene.remove(root)
    entries.length = 0
  }

  return { update, list, dispose, entries }
}
