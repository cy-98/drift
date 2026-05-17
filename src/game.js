import * as THREE from 'https://esm.sh/three@0.172.0'

const canvas = document.getElementById('canvas')
const prompt = document.getElementById('prompt')
const speedEl = document.getElementById('speed')
const altEl = document.getElementById('alt')

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(0x030810, 1)

const scene = new THREE.Scene()
scene.fog = new THREE.FogExp2(0x061018, 0.008)

const camera = new THREE.PerspectiveCamera(68, 1, 0.1, 600)
camera.position.set(0, 0, 0)

function makeStarLayer(count, spread, yRange, size, opacity) {
  const pos = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    pos[i3] = (Math.random() - 0.5) * spread
    pos[i3 + 1] = (Math.random() - 0.5) * yRange
    pos[i3 + 2] = -Math.random() * spread - 20
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const mat = new THREE.PointsMaterial({
    color: 0xc8dcff,
    size,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const points = new THREE.Points(geo, mat)
  points.userData.spread = spread
  return points
}

const starsNear = makeStarLayer(2400, 140, 80, 0.35, 0.9)
const starsMid = makeStarLayer(1800, 220, 120, 0.55, 0.65)
const starsFar = makeStarLayer(1200, 320, 160, 0.85, 0.4)
scene.add(starsNear, starsMid, starsFar)

const nebulaGeo = new THREE.PlaneGeometry(280, 140)
const nebulaMat = new THREE.MeshBasicMaterial({
  color: 0x1a3a5c,
  transparent: true,
  opacity: 0.12,
  side: THREE.DoubleSide,
  depthWrite: false,
})
const nebula = new THREE.Mesh(nebulaGeo, nebulaMat)
nebula.position.set(40, 15, -180)
scene.add(nebula)
const nebula2 = nebula.clone()
nebula2.material = nebulaMat.clone()
nebula2.material.opacity = 0.08
nebula2.position.set(-60, -10, -240)
nebula2.rotation.z = 0.4
scene.add(nebula2)

const lakeGeo = new THREE.PlaneGeometry(400, 400, 1, 1)
const lakeMat = new THREE.ShaderMaterial({
  transparent: true,
  uniforms: { uTime: { value: 0 } },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    varying vec2 vUv;
    void main() {
      vec2 uv = vUv;
      float wave = sin(uv.x * 12.0 + uTime * 0.4) * 0.5 + 0.5;
      wave *= sin(uv.y * 10.0 - uTime * 0.3) * 0.5 + 0.5;
      vec3 col = mix(vec3(0.02, 0.06, 0.12), vec3(0.08, 0.2, 0.35), wave);
      float rim = pow(1.0 - abs(uv.y - 0.55) * 2.0, 3.0);
      col += vec3(0.25, 0.55, 0.75) * rim * 0.35;
      float alpha = smoothstep(0.0, 0.25, uv.y) * 0.55;
      gl_FragColor = vec4(col, alpha);
    }
  `,
})
const lake = new THREE.Mesh(lakeGeo, lakeMat)
lake.rotation.x = -Math.PI * 0.48
lake.position.set(0, -55, -80)
scene.add(lake)

const keys = {}
let yaw = 0
let pitch = 0
const speed = 6
let locked = false
let elapsed = 0
const velocity = new THREE.Vector3()

function recycleStars(layer) {
  const spread = layer.userData.spread
  const arr = layer.geometry.attributes.position.array
  for (let i = 0; i < arr.length; i += 3) {
    if (arr[i + 2] - camera.position.z > 30) {
      arr[i] = camera.position.x + (Math.random() - 0.5) * spread
      arr[i + 1] = camera.position.y + (Math.random() - 0.5) * spread * 0.4
      arr[i + 2] = camera.position.z - Math.random() * spread - 40
    }
  }
  layer.geometry.attributes.position.needsUpdate = true
}

function resize() {
  const w = window.innerWidth
  const h = window.innerHeight
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}

function updateStars() {
  for (const layer of [starsNear, starsMid, starsFar]) recycleStars(layer)
  nebula.position.x = 40 + Math.sin(elapsed * 0.08) * 12
  nebula2.position.x = -60 + Math.cos(elapsed * 0.06) * 18
  lakeMat.uniforms.uTime.value = elapsed
}

function updateMovement(dt) {
  const forward = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation)
  const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, camera.rotation.y, 0))
  const up = new THREE.Vector3(0, 1, 0)

  let target = speed
  if (keys.shift) target *= 2.2
  if (keys.control) target *= 0.45

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
    camera.position.add(forward.multiplyScalar(target * 0.35 * dt))
  }

  camera.rotation.order = 'YXZ'
  camera.rotation.y = yaw
  camera.rotation.x = pitch

  speedEl.textContent = target.toFixed(1)
  altEl.textContent = camera.position.y.toFixed(0)
}

canvas.addEventListener('click', () => {
  if (!locked) canvas.requestPointerLock()
})

document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas
  prompt.classList.toggle('hidden', locked)
})

document.addEventListener('mousemove', (e) => {
  if (!locked) return
  yaw -= e.movementX * 0.0022
  pitch -= e.movementY * 0.0022
  pitch = Math.max(-1.35, Math.min(1.35, pitch))
})

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase()
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

resize()
window.addEventListener('resize', resize)

let last = performance.now()
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05)
  last = now
  elapsed += dt
  updateMovement(dt)
  updateStars()
  renderer.render(scene, camera)
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)
