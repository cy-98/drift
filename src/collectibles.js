import * as THREE from 'three'
import { getStarCircleTexture } from './star-sprite.js'

const COUNT = 72
const PICKUP = 10
const RECYCLE = 380
const STAR_SPRITE = getStarCircleTexture()
export function createCollectibles(scene, getSettings) {
  const group = new THREE.Group()
  scene.add(group)

  const geo = new THREE.BufferGeometry()
  const positions = new Float32Array(COUNT * 3)
  const phases = new Float32Array(COUNT)
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('phase', new THREE.BufferAttribute(phases, 1))

  const mat = new THREE.PointsMaterial({
    color: 0xffe066,
    size: 0.55,
    map: STAR_SPRITE ?? undefined,
    alphaMap: STAR_SPRITE ?? undefined,
    transparent: true,
    opacity: 0.85,
    alphaTest: 0.02,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  })
  const points = new THREE.Points(geo, mat)
  group.add(points)

  const alive = new Uint8Array(COUNT)
  let collected = 0
  const _ahead = new THREE.Vector3()
  const _right = new THREE.Vector3()

  function spawn(i, camera) {
    _ahead.set(0, 0, -1).applyQuaternion(camera.quaternion)
    _right.set(1, 0, 0).applyQuaternion(camera.quaternion)
    const dist = 45 + (i % 11) * 14
    const side = ((i * 17) % 7 - 3) * 12
    const i3 = i * 3
    positions[i3] = camera.position.x + _ahead.x * dist + _right.x * side
    positions[i3 + 1] = camera.position.y + ((i % 5) - 2) * 6
    positions[i3 + 2] = camera.position.z + _ahead.z * dist + _right.z * side
    phases[i] = Math.random() * Math.PI * 2
    alive[i] = 1
  }

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3 + 2] = -100 - i
    alive[i] = 0
  }

  function update(elapsed, camera, dt, onPickup) {
    if (!getSettings().collectibles) {
      group.visible = false
      return { count: collected }
    }
    group.visible = true
    const motion = getSettings().reducedMotion ? 0.4 : 1

    for (let i = 0; i < COUNT; i++) {
      if (!alive[i]) continue
      const i3 = i * 3
      const px = positions[i3]
      const py = positions[i3 + 1]
      const pz = positions[i3 + 2]
      const dx = px - camera.position.x
      const dy = py - camera.position.y
      const dz = pz - camera.position.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (dist < PICKUP) {
        alive[i] = 0
        collected += 1
        onPickup?.(collected)
        spawn(i, camera)
        geo.attributes.position.needsUpdate = true
        continue
      }

      if (dist > RECYCLE) spawn(i, camera)

      const tw = 0.75 + Math.sin(elapsed * 2.2 + phases[i]) * 0.25 * motion
      mat.size = 0.5 * tw
    }
    geo.attributes.position.needsUpdate = true
    return { count: collected }
  }

  function warm(camera) {
    for (let i = 0; i < COUNT; i++) spawn(i, camera)
    geo.attributes.position.needsUpdate = true
  }

  function dispose() {
    scene.remove(group)
    geo.dispose()
    mat.dispose()
  }

  function setCount(n) {
    collected = Math.max(0, Math.floor(n))
  }

  return { update, warm, dispose, getCount: () => collected, setCount }
}
