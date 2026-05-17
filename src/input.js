import * as THREE from 'https://esm.sh/three@0.172.0'

const SENS_BASE = 0.0022
const FOV_BASE = 68
const FOV_BOOST = 4

export function createInput(canvas, camera, getSettings, hud, { onEscape, onEngage, canStart, touch, gamepad }) {
  const keys = {}
  let yaw = 0
  let pitch = 0
  let locked = false
  let engaged = false
  let dragging = false
  let lastX = 0
  let lastY = 0
  let displaySpeed = getSettings().baseSpeed
  let currentFov = FOV_BASE

  const forward = new THREE.Vector3()
  const right = new THREE.Vector3()
  const up = new THREE.Vector3(0, 1, 0)
  const velocity = new THREE.Vector3()

  function dismissPrompt() {
    const el = hud.prompt
    if (!el || el.classList.contains('dismissed')) return
    el.classList.remove('wake-guide', 'hidden')
    el.classList.add('dismissed')
    el.setAttribute('aria-hidden', 'true')
  }

  function syncPrompt() {
    if (locked || engaged) dismissPrompt()
  }

  function setEngaged() {
    if (engaged || (canStart && !canStart())) return
    engaged = true
    dismissPrompt()
    onEngage?.()
  }

  function requestLock() {
    if (locked || (canStart && !canStart())) return
    try {
      const p = canvas.requestPointerLock()
      if (p?.catch) p.catch(() => setEngaged())
    } catch {
      setEngaged()
    }
  }

  const startBtn = document.getElementById('start-btn')

  canvas.addEventListener('click', requestLock)
  startBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    requestLock()
  })
  hud.prompt?.addEventListener('click', (e) => {
    if (e.target === startBtn) return
    e.stopPropagation()
    requestLock()
  })

  document.addEventListener('pointerlockchange', () => {
    locked = document.pointerLockElement === canvas
    if (locked) engaged = true
    syncPrompt()
    if (locked) onEngage?.()
  })

  document.addEventListener('pointerlockerror', () => setEngaged())

  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return
    if (!engaged && !locked) requestLock()
    if (!locked && engaged) {
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
    }
  })

  window.addEventListener('mouseup', () => {
    dragging = false
  })

  document.addEventListener('mousemove', (e) => {
    const sens = SENS_BASE * getSettings().sensitivity
    if (locked) {
      yaw -= e.movementX * sens
      pitch -= e.movementY * sens
    } else if (engaged && dragging) {
      yaw -= (e.clientX - lastX) * sens * 0.35
      pitch -= (e.clientY - lastY) * sens * 0.35
      lastX = e.clientX
      lastY = e.clientY
    } else {
      return
    }
    pitch = Math.max(-1.35, Math.min(1.35, pitch))
  })

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase()
    if (k === 'escape') {
      if (document.pointerLockElement === canvas) document.exitPointerLock()
      dragging = false
      onEscape()
      return
    }
    if (canStart && !canStart()) return
    if (k === 'enter' && !engaged && !locked) {
      requestLock()
      return
    }
    if (!engaged && !locked && ['w', 'a', 's', 'd', 'q', 'e'].includes(k)) {
      setEngaged()
    }
    keys[k] = true
    if (k === 'shift') keys.shift = true
    if (k === 'control') keys.control = true
  })
  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase()
    keys[k] = false
    if (k === 'shift') keys.shift = false
    if (k === 'control') keys.control = false
  })

  function applyLookDelta(dy, dp) {
    yaw -= dy
    pitch -= dp
    pitch = Math.max(-1.35, Math.min(1.35, pitch))
  }

  function applyExternalInput() {
    touch?.apply(keys, applyLookDelta)
    gamepad?.apply(keys, applyLookDelta)
  }

  function updateMovement(dt) {
    if (!engaged && !locked) return
    applyExternalInput()

    const { baseSpeed, reducedMotion } = getSettings()
    forward.set(0, 0, -1).applyEuler(camera.rotation)
    right.set(1, 0, 0).applyEuler(new THREE.Euler(0, camera.rotation.y, 0))

    let target = baseSpeed
    if (keys.shift) target *= 2.2
    if (keys.control) target *= 0.45

    const drift = reducedMotion ? 0.2 : 0.35
    velocity.set(0, 0, 0)
    if (keys.w) velocity.add(forward)
    if (keys.s) velocity.sub(forward)
    if (keys.a) velocity.sub(right)
    if (keys.d) velocity.add(right)
    if (keys.q) velocity.sub(up)
    if (keys.e) velocity.add(up)

    if (velocity.lengthSq() > 0) {
      velocity.normalize().multiplyScalar(target * dt)
      camera.position.add(velocity)
    } else {
      camera.position.add(forward.clone().multiplyScalar(target * drift * dt))
    }

    camera.rotation.order = 'YXZ'
    camera.rotation.y = yaw
    camera.rotation.x = pitch

    const smooth = reducedMotion ? 1 : Math.min(1, dt * 8)
    displaySpeed += (target - displaySpeed) * smooth
    hud.speedEl.textContent = displaySpeed.toFixed(1)
    hud.altEl.textContent = camera.position.y.toFixed(0)

    const wantFov = FOV_BASE + (keys.shift ? FOV_BOOST : 0)
    currentFov += (wantFov - currentFov) * smooth
    if (Math.abs(camera.fov - currentFov) > 0.01) {
      camera.fov = currentFov
      camera.updateProjectionMatrix()
    }
  }

  function showStartGuide() {
    engaged = false
    dragging = false
    locked = false
    const el = hud.prompt
    if (el) {
      el.classList.remove('hidden', 'dismissed')
      el.setAttribute('aria-hidden', 'false')
      el.classList.add('wake-guide')
    }
    startBtn?.focus()
  }

  syncPrompt()

  return {
    updateMovement,
    isLocked: () => locked,
    isEngaged: () => engaged || locked,
    showStartGuide,
    requestEngage: () => {
      if (canStart && !canStart()) return
      requestLock()
    },
  }
}
