import * as THREE from 'https://esm.sh/three@0.172.0'

const _proj = new THREE.Vector3()
const _dir = new THREE.Vector3()

export function createNav(camera, getPoiList, hud) {
  let activeIndex = 0

  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() !== 'tab') return
    e.preventDefault()
    const list = getPoiList()
    if (!list.length) return
    activeIndex = (activeIndex + 1) % list.length
    hud.flashTarget?.(list[activeIndex].name)
  })

  function nearestIndex(list) {
    let best = 0
    let bestD = Infinity
    for (let i = 0; i < list.length; i++) {
      const d = list[i].position.distanceTo(camera.position)
      if (d < bestD) {
        bestD = d
        best = i
      }
    }
    return best
  }

  function update() {
    camera.updateMatrixWorld()
    const list = getPoiList()
    if (!list.length) {
      hud.targetEl.textContent = '—'
      hud.distEl.textContent = '—'
      hud.compass.style.opacity = '0'
      return
    }

    if (activeIndex >= list.length) activeIndex = 0
    const target = list[activeIndex]
    const dist = target.position.distanceTo(camera.position)
    hud.targetEl.textContent = target.discovered ? target.name : '未知信号'
    hud.distEl.textContent = `${Math.round(dist)} 单位`

    _proj.copy(target.position).project(camera)
    const behind = _proj.z > 1
    const onScreen =
      !behind && _proj.x >= -0.95 && _proj.x <= 0.95 && _proj.y >= -0.95 && _proj.y <= 0.95

    if (onScreen) {
      const x = ((_proj.x + 1) * 0.5) * window.innerWidth
      const y = ((1 - _proj.y) * 0.5) * window.innerHeight
      hud.compass.style.opacity = '1'
      hud.compass.style.left = `${x}px`
      hud.compass.style.top = `${y}px`
      hud.compass.style.transform = 'translate(-50%, -50%)'
      hud.compass.classList.remove('edge')
    } else {
      _dir.copy(target.position).sub(camera.position).normalize()
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
      const dx = _dir.dot(right)
      const dy = _dir.dot(new THREE.Vector3(0, 1, 0))
      const angle = Math.atan2(dx, _dir.dot(forward))
      const margin = 36
      const cx = window.innerWidth * 0.5 + Math.sin(angle) * (window.innerWidth * 0.5 - margin)
      const cy = window.innerHeight * 0.5 - Math.cos(angle) * (window.innerHeight * 0.5 - margin)
      hud.compass.style.opacity = '1'
      hud.compass.style.left = `${cx}px`
      hud.compass.style.top = `${cy}px`
      hud.compass.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`
      hud.compass.classList.add('edge')
    }

    if (!target.discovered && dist < 200) {
      const near = nearestIndex(list)
      if (list[near].discovered || dist > list[near].position.distanceTo(camera.position)) {
        /* keep manual tab selection */
      }
    }
  }

  return { update }
}
