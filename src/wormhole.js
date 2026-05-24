import * as THREE from 'three'
import {
  galaxyMeta,
  galaxyLabel,
  interGateAvailable,
  pickAdjacentGalaxy,
  galaxyCenterWorld,
} from './core/galaxies.js'
import { sectorLabel } from './core/sectors.js'

const WARP_DIST = 42
const INTER_WARP_DIST = 48
const COOLDOWN = 8
const INTER_COOLDOWN = 14

function makeHoleMesh(type) {
  const isInter = type === 'inter'
  const ringColor = isInter ? 0xffcc88 : 0x88ccff
  const coreColor = isInter ? 0xffaa55 : 0x6eb8e8
  const ringMat = new THREE.MeshBasicMaterial({
    color: ringColor,
    transparent: true,
    opacity: isInter ? 0.62 : 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const coreMat = new THREE.MeshBasicMaterial({
    color: coreColor,
    transparent: true,
    opacity: isInter ? 0.32 : 0.25,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const g = new THREE.Group()
  const ringScale = isInter ? 1.15 : 1
  const ring = new THREE.Mesh(new THREE.TorusGeometry(12 * ringScale, 0.35, 8, 48), ringMat)
  const core = new THREE.Mesh(new THREE.SphereGeometry(4 * (isInter ? 1.1 : 1), 16, 16), coreMat)
  g.add(ring, core)
  return { mesh: g, ringMat, coreMat, type }
}

export function createWormholes(scene, { getGalaxyMeta } = {}) {
  const group = new THREE.Group()
  const innerA = makeHoleMesh('inner')
  const innerB = makeHoleMesh('inner')
  const inter = makeHoleMesh('inter')
  group.add(innerA.mesh, innerB.mesh, inter.mesh)
  scene.add(group)

  const holes = [
    { ...innerA, offset: 420, cooldown: 0, kind: 'inner' },
    { ...innerB, offset: 1320, cooldown: 0, kind: 'inner' },
    { ...inter, offset: 680, cooldown: 0, kind: 'inter', active: false },
  ]

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

  function refreshInterGate(camera) {
    const meta = getGalaxyMeta?.(camera.position.x, camera.position.z) ?? galaxyMeta(camera.position.x, camera.position.z)
    const interHole = holes[2]
    interHole.active = interGateAvailable(meta.gx, meta.gz)
    interHole.mesh.visible = interHole.active
  }

  function warpInner(camera, onWarp) {
    _ahead.set(0, 0, -1).applyQuaternion(camera.quaternion)
    camera.position.addScaledVector(_ahead, 280)
    camera.position.y += (Math.random() - 0.5) * 40
    const label = sectorLabel(camera.position.x, camera.position.z)
    onWarp?.({
      kind: 'inner',
      title: '折跃',
      text: `同星系内折跃 · ${label}`,
    })
  }

  function warpInter(camera, onWarp) {
    const meta = getGalaxyMeta?.(camera.position.x, camera.position.z) ?? galaxyMeta(camera.position.x, camera.position.z)
    const next = pickAdjacentGalaxy(meta.gx, meta.gz)
    const center = galaxyCenterWorld(next.gx, next.gz)
    const seed = meta.gx * 991 + meta.gz * 997
    camera.position.x = center.x + ((seed % 200) - 100)
    camera.position.z = center.z + (((seed >>> 8) % 200) - 100)
    camera.position.y += (Math.random() - 0.5) * 30
    const name = galaxyLabel(next.gx, next.gz)
    onWarp?.({
      kind: 'inter',
      title: '际门',
      text: `通往 ${name} · 另一片宇宙天气在前方展开。`,
    })
  }

  function update(elapsed, camera, dt, onWarp) {
    flash = Math.max(0, flash - dt)
    refreshInterGate(camera)

    for (const hole of holes) {
      if (hole.kind === 'inter' && !hole.active) continue
      hole.cooldown = Math.max(0, hole.cooldown - dt)
      place(hole, camera)
      hole.mesh.rotation.z = elapsed * (hole.kind === 'inter' ? 0.85 : 0.6)
      const ring = hole.mesh.children[0]
      ring.scale.setScalar(1 + Math.sin(elapsed * 2 + hole.offset) * 0.06)
    }

    const candidates = holes
      .filter((h) => h.kind !== 'inter' || h.active)
      .map((h) => ({ h, dist: h.mesh.position.distanceTo(camera.position) }))
      .sort((a, b) => a.dist - b.dist)

    for (const { h, dist } of candidates) {
      const limit = h.kind === 'inter' ? INTER_WARP_DIST : WARP_DIST
      if (dist >= limit || h.cooldown > 0) continue
      if (h.kind === 'inter') {
        warpInter(camera, onWarp)
        h.cooldown = INTER_COOLDOWN
      } else {
        warpInner(camera, onWarp)
        h.cooldown = COOLDOWN
      }
      flash = h.kind === 'inter' ? 0.5 : 0.35
      break
    }

    return { flash }
  }

  function dispose() {
    scene.remove(group)
    for (const hole of holes) {
      hole.ringMat.dispose()
      hole.coreMat.dispose()
    }
  }

  return { update, dispose, getFlash: () => flash }
}
