import * as THREE from 'three'
import { sectorLabel, sectorEvent } from './core/sectors.js'

const QUALITY = {
  low: { starMul: 0.55, spreadMul: 0.9 },
  medium: { starMul: 1, spreadMul: 1 },
  high: { starMul: 1.25, spreadMul: 1.05 },
}

function makeStarLayer(count, spread, yRange, size, opacity) {
  const pos = new Float32Array(count * 3)
  const phase = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    pos[i3] = (Math.random() - 0.5) * spread
    pos[i3 + 1] = (Math.random() - 0.5) * yRange
    pos[i3 + 2] = -Math.random() * spread - 20
    phase[i] = Math.random() * Math.PI * 2
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('phase', new THREE.BufferAttribute(phase, 1))
  const mat = new THREE.PointsMaterial({
    color: 0xc8dcff,
    size,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    fog: false,
  })
  const points = new THREE.Points(geo, mat)
  points.frustumCulled = false
  points.userData = { spread, baseOpacity: opacity, baseSize: size }
  return points
}

function spawnStarInView(arr, i, camera, spread, _ahead, _right, _up) {
  const cx = camera.position.x
  const cy = camera.position.y
  const cz = camera.position.z
  const maxDepth = spread * 1.15 + 40
  const depth = 20 + Math.random() * (maxDepth - 20)
  const side = (Math.random() - 0.5) * spread
  const lift = (Math.random() - 0.5) * spread * 0.45
  arr[i] = cx + _ahead.x * depth + _right.x * side + _up.x * lift
  arr[i + 1] = cy + _ahead.y * depth + _right.y * side + _up.y * lift
  arr[i + 2] = cz + _ahead.z * depth + _right.z * side + _up.z * lift
}

function warmStarsAroundCamera(layers, camera, _ahead, _right, _up) {
  _ahead.set(0, 0, -1).applyQuaternion(camera.quaternion)
  _right.set(1, 0, 0).applyQuaternion(camera.quaternion)
  _up.set(0, 1, 0).applyQuaternion(camera.quaternion)
  for (const layer of layers) {
    const spread = layer.userData.spread
    const arr = layer.geometry.attributes.position.array
    for (let i = 0; i < arr.length; i += 3) {
      spawnStarInView(arr, i, camera, spread, _ahead, _right, _up)
    }
    layer.geometry.attributes.position.needsUpdate = true
    layer.geometry.computeBoundingSphere()
  }
}

function makeDustBelt(count) {
  const pos = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    const r = 90 + Math.random() * 40
    pos[i * 3] = Math.cos(angle) * r
    pos[i * 3 + 1] = (Math.random() - 0.5) * 8
    pos[i * 3 + 2] = Math.sin(angle) * r - 120
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const mat = new THREE.PointsMaterial({
    color: 0x88bbee,
    size: 0.45,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  })
  const belt = new THREE.Points(geo, mat)
  belt.frustumCulled = false
  return belt
}

function makeLakeLayer(bloom, { rimScale, alphaScale, waveScale }) {
  const rim = bloom ? 0.16 * rimScale : 0.1 * rimScale
  const alpha = 0.1 * alphaScale
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uDay: { value: 0.5 },
      uIntensity: { value: 1 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uDay;
      uniform float uIntensity;
      varying vec2 vUv;
      void main() {
        vec2 uv = vUv;
        float wave = sin(uv.x * ${waveScale} + uTime * 0.35) * 0.5 + 0.5;
        wave *= sin(uv.y * ${waveScale * 0.85} - uTime * 0.28) * 0.5 + 0.5;
        vec3 deep = mix(vec3(0.02, 0.05, 0.1), vec3(0.05, 0.12, 0.22), uDay);
        vec3 bright = mix(vec3(0.04, 0.1, 0.18), vec3(0.1, 0.22, 0.38), uDay);
        vec3 col = mix(deep, bright, wave);
        float rimBand = pow(1.0 - abs(uv.y - 0.68) * 1.45, 4.5);
        col += vec3(0.12, 0.32, 0.5) * rimBand * ${rim.toFixed(4)} * uIntensity;
        float edge = smoothstep(0.12, 0.5, uv.y);
        float alpha = edge * (${alpha.toFixed(4)} + uDay * 0.04) * uIntensity;
        gl_FragColor = vec4(col, alpha);
      }
    `,
  })
}

export function createWorld(scene, { reducedMotion, bloom, quality = 'medium', lakeGlow = true }) {
  const q = QUALITY[quality] ?? QUALITY.medium
  const mul = (reducedMotion ? 0.5 : 1) * q.starMul

  scene.fog = new THREE.FogExp2(0x061018, reducedMotion ? 0.01 : 0.0055)
  const nightFog = 0x061018
  const dayFog = 0x0a1830
  const nightBg = new THREE.Color(0x030810)
  const dayBg = new THREE.Color(0x061428)

  const starLayers = [
    makeStarLayer(Math.floor((reducedMotion ? 1200 : 2400) * mul), 200 * q.spreadMul, 110, bloom ? 0.38 : 0.32, 0.9),
    makeStarLayer(Math.floor((reducedMotion ? 900 : 1800) * mul), 280 * q.spreadMul, 150, bloom ? 0.58 : 0.5, 0.65),
    makeStarLayer(Math.floor((reducedMotion ? 600 : 1200) * mul), 380 * q.spreadMul, 200, bloom ? 0.88 : 0.78, 0.4),
  ]
  scene.add(...starLayers)
  let starsWarmed = false

  const dust = reducedMotion ? null : makeDustBelt(Math.floor(420 * mul))
  if (dust) scene.add(dust)

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

  const _sectorColor = new THREE.Color()

  const lakeLayers = [
    {
      mat: makeLakeLayer(bloom, { rimScale: 1, alphaScale: 1, waveScale: 10 }),
      size: 340,
      ahead: 155,
      down: 108,
      tilt: -0.26,
    },
    {
      mat: makeLakeLayer(bloom, { rimScale: 0.55, alphaScale: 0.65, waveScale: 7 }),
      size: 480,
      ahead: 210,
      down: 125,
      tilt: -0.2,
    },
  ].map((cfg) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(cfg.size, cfg.size), cfg.mat)
    scene.add(mesh)
    return { ...cfg, mesh }
  })

  const _down = new THREE.Vector3()
  const _ahead = new THREE.Vector3()
  const _right = new THREE.Vector3()
  const _up = new THREE.Vector3()
  const _starOffset = new THREE.Vector3()
  const _clear = new THREE.Color()

  function recycleStars(layer, camera) {
    const spread = layer.userData.spread
    const arr = layer.geometry.attributes.position.array
    const cx = camera.position.x
    const cy = camera.position.y
    const cz = camera.position.z

    _ahead.set(0, 0, -1).applyQuaternion(camera.quaternion)
    _right.set(1, 0, 0).applyQuaternion(camera.quaternion)
    _up.set(0, 1, 0).applyQuaternion(camera.quaternion)

    const behindPad = 20
    const maxDepth = spread * 1.15 + 40
    const lateral = spread * 0.52
    const vertical = spread * 0.28

    for (let i = 0; i < arr.length; i += 3) {
      _starOffset.set(arr[i] - cx, arr[i + 1] - cy, arr[i + 2] - cz)
      const along = _starOffset.dot(_ahead)
      const side = _starOffset.dot(_right)
      const lift = _starOffset.dot(_up)

      const behind = along < -behindPad
      const tooFarAhead = along > maxDepth
      const outside = Math.abs(side) > lateral || Math.abs(lift) > vertical
      if (!behind && !tooFarAhead && !outside) continue

      spawnStarInView(arr, i, camera, spread, _ahead, _right, _up)
    }
    layer.geometry.attributes.position.needsUpdate = true
  }

  function applyLod(layer, camera) {
    const spread = layer.userData.spread
    const arr = layer.geometry.attributes.position.array
    _ahead.set(0, 0, -1).applyQuaternion(camera.quaternion)
    let sumAhead = 0
    let n = 0
    for (let i = 0; i < arr.length; i += 33) {
      _starOffset.set(arr[i] - camera.position.x, arr[i + 1] - camera.position.y, arr[i + 2] - camera.position.z)
      sumAhead += Math.max(0, _starOffset.dot(_ahead))
      n++
    }
    const avg = n ? sumAhead / n : spread * 0.5
    const lod = THREE.MathUtils.clamp(1 - avg / (spread * 1.2), 0.55, 1)
    layer.material.size = layer.userData.baseSize * lod * (bloom ? 1.05 : 1)
  }

  function followCamera(camera, elapsed, motion, state) {
    _ahead.set(0, 0, -1).applyQuaternion(camera.quaternion)
    const ax = camera.position.x
    const ay = camera.position.y
    const az = camera.position.z

    _down.set(0, -1, 0).applyQuaternion(camera.quaternion)
    const pitchFade = THREE.MathUtils.clamp(1 - Math.abs(camera.rotation.x) / 0.95, 0.08, 1)

    for (const layer of lakeLayers) {
      layer.mesh.visible = lakeGlow
      if (!lakeGlow) continue
      layer.mesh.position
        .copy(camera.position)
        .addScaledVector(_ahead, layer.ahead)
        .addScaledVector(_down, layer.down)
      layer.mesh.quaternion.copy(camera.quaternion)
      layer.mesh.rotateX(-Math.PI * layer.tilt)
      layer.mat.uniforms.uIntensity.value = pitchFade
    }

    nebula.position.set(ax + 40 + Math.sin(elapsed * 0.08) * 12 * motion, ay + 15, az - 175)
    nebula2.position.set(ax - 60 + Math.cos(elapsed * 0.06) * 18 * motion, ay - 10, az - 235)

    const sx = Math.floor(camera.position.x / 720)
    const sz = Math.floor(camera.position.z / 720)
    const seed = (sx * 374761393 + sz * 668265263) >>> 0
    const warmth = (seed % 1000) / 1000
    _sectorColor.setRGB(0.08 + warmth * 0.14, 0.14 + (1 - warmth) * 0.1, 0.26 + (1 - warmth) * 0.14)
    nebulaMat.color.copy(_sectorColor)
    nebula2.material.color.copy(_sectorColor).multiplyScalar(0.82)

    state.sectorLabel = sectorLabel(ax, az)
    const evt = sectorEvent(ax, az)
    state.sectorEvent = evt
    const eventPulse = 0.5 + 0.5 * Math.sin(elapsed * 0.0031 + seed * 0.001)
    nebulaMat.opacity = 0.1 + eventPulse * 0.06
    nebula2.material.opacity = 0.06 + eventPulse * 0.05
    if (state._fogBase != null) scene.fog.density = state._fogBase * (0.94 + (seed % 100) * 0.0012)

    if (dust) {
      dust.position.copy(camera.position)
      dust.rotation.y = elapsed * 0.04
    }

    return pitchFade
  }

  function update(elapsed, camera, dt, state = {}) {
    const motion = reducedMotion ? 0.35 : 1
    const day = 0.5 + 0.5 * Math.sin(elapsed * 0.018)
    const season = 0.5 + 0.5 * Math.sin(elapsed * 0.0047 + 1.2)
    const fogBase = reducedMotion ? 0.01 : 0.0055
    scene.fog.density = fogBase * (0.82 + 0.28 * Math.sin(elapsed * 0.11))
    state._fogBase = scene.fog.density
    scene.fog.color.setHex(day > 0.55 ? dayFog : nightFog)
    _clear.copy(nightBg).lerp(dayBg, day * 0.22)
    state.clearColor = _clear
    state.dayFactor = day

    followCamera(camera, elapsed, motion, state)
    if (!starsWarmed) {
      warmStarsAroundCamera(starLayers, camera, _ahead, _right, _up)
      starsWarmed = true
    }
    for (const layer of lakeLayers) {
      layer.mat.uniforms.uTime.value = elapsed
      layer.mat.uniforms.uDay.value = day * 0.65 + season * 0.35
    }

    for (const layer of starLayers) {
      recycleStars(layer, camera)
      applyLod(layer, camera)
      const phases = layer.geometry.attributes.phase.array
      const base = layer.userData.baseOpacity
      let twinkle = 0
      for (let i = 0; i < phases.length; i += 97) {
        twinkle += Math.sin(elapsed * (1.2 + (i % 5) * 0.15) + phases[i])
      }
      twinkle /= Math.ceil(phases.length / 97) || 1
      layer.material.opacity = base * (0.88 + twinkle * 0.12 * motion)
    }
  }

  return { update, starLayers, dispose: () => {} }
}
