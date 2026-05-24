import * as THREE from 'three'

const SENS_BASE = 0.0022
const FOV_BASE = 68
const FOV_BOOST = 4
const FOV_HYPER = 14
const SHIFT_RAMP_SEC = 3
const SHIFT_MULT = 2.2
const SHIFT_HYPER_MULT = 9
const HYPER_BLEND_SEC = 0.45

export function createWebInput(canvas, camera, getSettings, hud, { onEscape, onEngage, canStart, touch, gamepad }) {
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
  let shiftHoldSec = 0
  let hyper = false
  let lastPad = { w: false, s: false, a: false, d: false, q: false, e: false, shift: false }

  const forward = new THREE.Vector3()
  const right = new THREE.Vector3()
  const up = new THREE.Vector3(0, 1, 0)
  const velocity = new THREE.Vector3()

  const prompt = hud.getPromptElement()
  const startBtn = hud.getStartButton()

  function dismissPrompt() {
    if (locked || engaged) hud.dismissPrompt()
  }

  function setEngaged() {
    if (engaged || (canStart && !canStart())) return
    engaged = true
    hud.dismissPrompt()
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

  canvas.addEventListener('click', requestLock)
  startBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    requestLock()
  })
      prompt?.addEventListener('click', (e) => {
        if (e.target === startBtn) return
        if (e.target.closest('button, a, input, select, label')) return
        e.stopPropagation()
        requestLock()
      })

  document.addEventListener('pointerlockchange', () => {
    locked = document.pointerLockElement === canvas
    if (locked) engaged = true
    dismissPrompt()
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

  function shiftMultiplier(shiftActive) {
    if (!shiftActive) return 1
    if (shiftHoldSec < SHIFT_RAMP_SEC) return SHIFT_MULT
    const t = Math.min(1, (shiftHoldSec - SHIFT_RAMP_SEC) / HYPER_BLEND_SEC)
    return SHIFT_MULT + (SHIFT_HYPER_MULT - SHIFT_MULT) * t
  }

  function applyLookDelta(dy, dp) {
    yaw -= dy
    pitch -= dp
    pitch = Math.max(-1.35, Math.min(1.35, pitch))
  }

  function applyExternalInput() {
    const pad = { w: false, s: false, a: false, d: false, q: false, e: false, shift: false }
    touch?.apply(keys, applyLookDelta)
    gamepad?.apply(pad, applyLookDelta)
    return pad
  }

  function updateMovement(dt) {
    if (!engaged && !locked) return
    const pad = applyExternalInput()
    lastPad = pad

    const { baseSpeed, reducedMotion } = getSettings()
    forward.set(0, 0, -1).applyEuler(camera.rotation)
    right.set(1, 0, 0).applyEuler(new THREE.Euler(0, camera.rotation.y, 0))

    const shift = keys.shift || pad.shift
    if (shift) shiftHoldSec += dt
    else shiftHoldSec = 0
    hyper = shift && shiftHoldSec >= SHIFT_RAMP_SEC

    let target = baseSpeed * shiftMultiplier(shift)
    if (keys.control) target *= 0.45

    const drift = reducedMotion ? 0.2 : 0.35
    velocity.set(0, 0, 0)
    if (keys.w || pad.w) velocity.add(forward)
    if (keys.s || pad.s) velocity.sub(forward)
    if (keys.a || pad.a) velocity.sub(right)
    if (keys.d || pad.d) velocity.add(right)
    if (keys.q || pad.q) velocity.sub(up)
    if (keys.e || pad.e) velocity.add(up)

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
    hud.setSpeed(displaySpeed.toFixed(1))
    hud.setAlt(camera.position.y.toFixed(0))

    const wantFov = FOV_BASE + (hyper ? FOV_HYPER : shift ? FOV_BOOST : 0)
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
    hud.showStartGuide()
  }

  function isMoving() {
    const p = lastPad
    return !!(
      keys.w ||
      keys.s ||
      keys.a ||
      keys.d ||
      keys.q ||
      keys.e ||
      keys.shift ||
      p.w ||
      p.s ||
      p.a ||
      p.d ||
      p.q ||
      p.e ||
      p.shift
    )
  }

  return {
    updateMovement,
    getSpeedNorm: () => displaySpeed / Math.max(getSettings().baseSpeed, 0.1),
    getMotionState: () => ({ hyper, shiftHoldSec }),
    isMoving,
    isLocked: () => locked,
    isEngaged: () => engaged || locked,
    showStartGuide,
    requestEngage: () => {
      if (canStart && !canStart()) return
      requestLock()
    },
  }
}
