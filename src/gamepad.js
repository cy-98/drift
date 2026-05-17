const DEAD = 0.18
const LOOK_SENS = 0.028
const MOVE_THRESH = 0.35

export function createGamepad() {
  return {
    apply(keys, onRotate) {
      const pads = navigator.getGamepads?.()
      if (!pads) return
      const pad = pads.find((p) => p?.connected)
      if (!pad) return

      const lx = Math.abs(pad.axes[0]) > DEAD ? pad.axes[0] : 0
      const ly = Math.abs(pad.axes[1]) > DEAD ? pad.axes[1] : 0
      const rx = Math.abs(pad.axes[2]) > DEAD ? pad.axes[2] : 0
      const ry = Math.abs(pad.axes[3]) > DEAD ? pad.axes[3] : 0

      if (ly < -MOVE_THRESH) keys.w = true
      if (ly > MOVE_THRESH) keys.s = true
      if (lx < -MOVE_THRESH) keys.a = true
      if (lx > MOVE_THRESH) keys.d = true

      if (pad.buttons[6]?.pressed) keys.q = true
      if (pad.buttons[7]?.pressed) keys.e = true
      if (pad.buttons[5]?.pressed) keys.shift = true

      if (rx !== 0 || ry !== 0) onRotate(rx * LOOK_SENS, ry * LOOK_SENS)
    },
  }
}
