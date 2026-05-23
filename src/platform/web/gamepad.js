const DEAD = 0.18
const LOOK_SENS = 0.028
const MOVE_THRESH = 0.35

export function createGamepad() {
  return {
    /** @param {{ w?: boolean, s?: boolean, a?: boolean, d?: boolean, q?: boolean, e?: boolean, shift?: boolean }} pad */
    apply(pad, onRotate) {
      pad.w = false
      pad.s = false
      pad.a = false
      pad.d = false
      pad.q = false
      pad.e = false
      pad.shift = false

      const pads = navigator.getGamepads?.()
      if (!pads) return
      const gp = pads.find((p) => p?.connected)
      if (!gp) return

      const lx = Math.abs(gp.axes[0]) > DEAD ? gp.axes[0] : 0
      const ly = Math.abs(gp.axes[1]) > DEAD ? gp.axes[1] : 0
      const rx = Math.abs(gp.axes[2]) > DEAD ? gp.axes[2] : 0
      const ry = Math.abs(gp.axes[3]) > DEAD ? gp.axes[3] : 0

      if (ly < -MOVE_THRESH) pad.w = true
      if (ly > MOVE_THRESH) pad.s = true
      if (lx < -MOVE_THRESH) pad.a = true
      if (lx > MOVE_THRESH) pad.d = true

      if (gp.buttons[6]?.pressed) pad.q = true
      if (gp.buttons[7]?.pressed) pad.e = true
      if (gp.buttons[5]?.pressed) pad.shift = true

      if (rx !== 0 || ry !== 0) onRotate(rx * LOOK_SENS, ry * LOOK_SENS)
    },
  }
}
