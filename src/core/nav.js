import * as THREE from 'three'
import { findNearestIndex } from '../util.js'

const _proj = new THREE.Vector3()
const _dir = new THREE.Vector3()

/** @param {import('./drift-app.js').GameHud} hud */
export function createNav(camera, getPoiList, hud) {
  let activeIndex = 0

  function cycleTarget() {
    const list = getPoiList()
    if (!list.length) return
    activeIndex = (activeIndex + 1) % list.length
    hud.flashTarget(list[activeIndex].name)
  }

  function update() {
    camera.updateMatrixWorld()
    const list = getPoiList()
    const { width, height } = hud.getViewport()

    if (!list.length) {
      hud.setTarget('—')
      hud.setDistance('—')
      hud.setCompass({ visible: false, x: 0, y: 0, transform: '', edge: false })
      return
    }

    if (activeIndex >= list.length) activeIndex = 0
    const target = list[activeIndex]
    const dist = target.position.distanceTo(camera.position)
    hud.setTarget(target.discovered ? target.name : '未知信号')
    hud.setDistance(`${Math.round(dist)} 单位`)

    _proj.copy(target.position).project(camera)
    const behind = _proj.z > 1
    const onScreen =
      !behind && _proj.x >= -0.95 && _proj.x <= 0.95 && _proj.y >= -0.95 && _proj.y <= 0.95

    if (onScreen) {
      const x = ((_proj.x + 1) * 0.5) * width
      const y = ((1 - _proj.y) * 0.5) * height
      hud.setCompass({
        visible: true,
        x,
        y,
        transform: 'translate(-50%, -50%)',
        edge: false,
      })
    } else {
      _dir.copy(target.position).sub(camera.position).normalize()
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
      const dx = _dir.dot(right)
      const angle = Math.atan2(dx, _dir.dot(forward))
      const margin = 36
      const cx = width * 0.5 + Math.sin(angle) * (width * 0.5 - margin)
      const cy = height * 0.5 - Math.cos(angle) * (height * 0.5 - margin)
      hud.setCompass({
        visible: true,
        x: cx,
        y: cy,
        transform: `translate(-50%, -50%) rotate(${angle}rad)`,
        edge: true,
      })
    }

    if (!target.discovered && dist < 200) {
      const near = findNearestIndex(list, camera.position)
      if (list[near].discovered || dist > list[near].position.distanceTo(camera.position)) {
        /* keep manual tab selection */
      }
    }
  }

  return { update, cycleTarget }
}
