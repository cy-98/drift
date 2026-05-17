const MOVE_RADIUS = 44
const LOOK_SENS = 0.0032

export function createTouch(getSettings, { onEngage }) {
  const root = document.getElementById('touch-ui')
  const stick = document.getElementById('move-stick')
  const knob = document.getElementById('move-knob')
  const lookZone = document.getElementById('look-zone')
  if (!root || !stick || !knob || !lookZone) return null

  const coarse = window.matchMedia('(pointer: coarse)').matches
  const narrow = window.matchMedia('(max-width: 900px)').matches
  if (!coarse && !narrow) return null

  document.body.classList.add('touch-ui')
  root.setAttribute('aria-hidden', 'false')

  const move = { x: 0, y: 0 }
  let lookDx = 0
  let lookDy = 0
  let moveId = null
  let lookId = null
  let lookLastX = 0
  let lookLastY = 0

  function setKnob(x, y) {
    knob.style.transform = `translate(${x}px, ${y}px)`
  }

  stick.addEventListener(
    'pointerdown',
    (e) => {
      moveId = e.pointerId
      stick.setPointerCapture(e.pointerId)
      onEngage?.()
      updateMove(e)
    },
    { passive: false },
  )

  stick.addEventListener('pointermove', (e) => {
    if (e.pointerId !== moveId) return
    updateMove(e)
  })

  function endMove(e) {
    if (e.pointerId !== moveId) return
    moveId = null
    move.x = 0
    move.y = 0
    setKnob(0, 0)
  }
  stick.addEventListener('pointerup', endMove)
  stick.addEventListener('pointercancel', endMove)

  function updateMove(e) {
    const rect = stick.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    let dx = e.clientX - cx
    let dy = e.clientY - cy
    const len = Math.hypot(dx, dy) || 1
    const clamped = Math.min(len, MOVE_RADIUS)
    dx = (dx / len) * clamped
    dy = (dy / len) * clamped
    move.x = dx / MOVE_RADIUS
    move.y = dy / MOVE_RADIUS
    setKnob(dx, dy)
  }

  lookZone.addEventListener(
    'pointerdown',
    (e) => {
      lookId = e.pointerId
      lookZone.setPointerCapture(e.pointerId)
      lookLastX = e.clientX
      lookLastY = e.clientY
      onEngage?.()
    },
    { passive: false },
  )

  lookZone.addEventListener('pointermove', (e) => {
    if (e.pointerId !== lookId) return
    lookDx += e.clientX - lookLastX
    lookDy += e.clientY - lookLastY
    lookLastX = e.clientX
    lookLastY = e.clientY
  })

  function endLook(e) {
    if (e.pointerId !== lookId) return
    lookId = null
  }
  lookZone.addEventListener('pointerup', endLook)
  lookZone.addEventListener('pointercancel', endLook)

  return {
    apply(keys, onRotate) {
      const sens = LOOK_SENS * getSettings().sensitivity
      keys.w = move.y < -0.22
      keys.s = move.y > 0.22
      keys.a = move.x < -0.22
      keys.d = move.x > 0.22
      if (lookDx !== 0 || lookDy !== 0) {
        onRotate(lookDx * sens, lookDy * sens)
        lookDx = 0
        lookDy = 0
      }
    },
  }
}
