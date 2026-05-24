import * as THREE from 'three'

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

const RARE_TYPES = [
  {
    name: '镜像晶球',
    color: 0xaaccff,
    emissive: 0x304080,
    scale: 7.8,
    lore: '它反射的不是光，而是别处尚未发生的黄昏。',
    rare: true,
  },
  {
    name: '静默裂隙',
    color: 0xcc88ff,
    emissive: 0x402060,
    scale: 6.2,
    lore: '裂隙里没有风，只有被折叠的星光在缓慢呼吸。',
    rare: true,
  },
  {
    name: '古航灯塔',
    color: 0xffddaa,
    emissive: 0x806030,
    scale: 8.5,
    lore: '无人记得谁为它添过燃料，它仍向深空眨着温柔的眼。',
    rare: true,
  },
]

const POI_COUNT = 6
const SPAWN_MIN = 180
const SPAWN_MAX = 360
const RECYCLE_DIST = 520
const DISCOVER_DIST = 90
const CLOSE_DIST = 55

function pickType(seed, camera) {
  const posLen = camera?.position?.length?.() ?? 0
  const h = (seed * 2654435761 + Math.floor(posLen * 0.13)) >>> 0
  if (h % 100 < 8) return RARE_TYPES[h % RARE_TYPES.length]
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

function glowMaterial(color, opacity, bloom, { backSide = false } = {}) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: bloom ? opacity : opacity * 0.72,
    blending: THREE.AdditiveBlending,
    side: backSide ? THREE.BackSide : THREE.FrontSide,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  })
}

function makePoiMesh(type, bloom) {
  const group = new THREE.Group()
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(1, 28, 28),
    new THREE.MeshBasicMaterial({ color: type.color, toneMapped: false }),
  )
  core.renderOrder = 0

  const bodyGlow = new THREE.Mesh(
    new THREE.SphereGeometry(1.02, 28, 28),
    glowMaterial(type.color, 0.38, bloom),
  )
  bodyGlow.renderOrder = 2

  const rimGlow = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 28, 28),
    glowMaterial(type.color, 0.32, bloom, { backSide: true }),
  )
  rimGlow.renderOrder = 2

  const innerGlow = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 24, 24),
    glowMaterial(type.color, 0.24, bloom),
  )
  innerGlow.renderOrder = 3

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(1.55, 20, 20),
    glowMaterial(type.emissive, 0.22, bloom),
  )
  halo.renderOrder = 3

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.68, 2.95, 56),
    new THREE.MeshBasicMaterial({
      color: type.color,
      transparent: true,
      opacity: bloom ? 0.34 : 0.26,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
    }),
  )
  ring.renderOrder = 4

  const ringHaze = new THREE.Mesh(
    new THREE.RingGeometry(2.55, 3.15, 40),
    new THREE.MeshBasicMaterial({
      color: type.emissive,
      transparent: true,
      opacity: bloom ? 0.14 : 0.1,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
    }),
  )
  ringHaze.renderOrder = 4

  ring.rotation.x = Math.PI * 0.42
  ringHaze.rotation.x = Math.PI * 0.38
  ringHaze.rotation.y = 0.15
  group.add(core, bodyGlow, rimGlow, innerGlow, halo, ring, ringHaze)
  group.scale.setScalar(type.scale)
  return { group, core, bodyGlow, rimGlow, innerGlow, halo, ring, ringHaze }
}

export function createPois(scene, { reducedMotion, bloom }) {
  const root = new THREE.Group()
  scene.add(root)
  const entries = []
  let loreCooldown = 0

  function spawnOne(camera, slot) {
    const type = pickType(slot + Math.floor(camera.position.length() * 0.07), camera)
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

      const pulse = 1 + Math.sin(elapsed * 1.1 + entry.slot) * 0.05 * motion
      const glowPulse = 1 + Math.sin(elapsed * 0.85 + entry.slot * 1.3) * 0.06 * motion
      entry.bodyGlow?.scale.setScalar(pulse)
      entry.rimGlow?.scale.setScalar(pulse * 1.04)
      entry.innerGlow.scale.setScalar(pulse * 1.08)
      entry.halo.scale.setScalar(glowPulse * 1.12)
      entry.ring.rotation.z += dt * 0.12 * motion
      entry.ringHaze.rotation.z -= dt * 0.06 * motion

      if (dist < DISCOVER_DIST && !entry.discovered) {
        entry.discovered = true
      }
      if (dist < CLOSE_DIST && !entry.visited && loreCooldown <= 0) {
        entry.visited = true
        loreCooldown = 8
        const title = entry.type.rare ? `稀有 · ${entry.type.name}` : entry.type.name
        onLore?.(title, entry.type.lore)
      }
    }
  }

  function visitedCount() {
    return entries.filter((e) => e.visited).length
  }

  function list() {
    return entries.map((e) => ({
      name: e.type.name,
      position: e.group.position,
      discovered: e.discovered,
      visited: e.visited,
      slot: e.slot,
      rare: !!e.type.rare,
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

  return { update, list, visitedCount, dispose, entries }
}
