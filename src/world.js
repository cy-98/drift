import * as THREE from 'https://esm.sh/three@0.172.0'

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
  })
  const points = new THREE.Points(geo, mat)
  points.userData = { spread, baseOpacity: opacity, baseSize: size }
  return points
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
  })
  return new THREE.Points(geo, mat)
}

export function createWorld(scene, { reducedMotion, bloom, quality = 'medium' }) {
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
        col += vec3(0.25, 0.55, 0.75) * rim * ${bloom ? '0.42' : '0.28'};
        float alpha = smoothstep(0.0, 0.35, uv.y) * 0.38;
        gl_FragColor = vec4(col, alpha);
      }
    `,
  })
  const lake = new THREE.Mesh(new THREE.PlaneGeometry(320, 320), lakeMat)
  scene.add(lake)
  const _down = new THREE.Vector3()
  const _ahead = new THREE.Vector3()
  const _clear = new THREE.Color()

  function recycleStars(layer, camera) {
    const spread = layer.userData.spread
    const arr = layer.geometry.attributes.position.array
    const cx = camera.position.x
    const cy = camera.position.y
    const cz = camera.position.z
    const limit = spread * spread * 0.72

    for (let i = 0; i < arr.length; i += 3) {
      const dx = arr[i] - cx
      const dy = arr[i + 1] - cy
      const dz = arr[i + 2] - cz
      const behind = dz > spread * 0.12
      const tooFar = dx * dx + dy * dy + dz * dz > limit
      if (!behind && !tooFar) continue

      arr[i] = cx + (Math.random() - 0.5) * spread
      arr[i + 1] = cy + (Math.random() - 0.5) * spread * 0.45
      arr[i + 2] = cz - Math.random() * spread - 25
    }
    layer.geometry.attributes.position.needsUpdate = true
  }

  function applyLod(layer, camera) {
    const spread = layer.userData.spread
    const arr = layer.geometry.attributes.position.array
    let sumZ = 0
    let n = 0
    for (let i = 2; i < arr.length; i += 33) {
      sumZ += arr[i] - camera.position.z
      n++
    }
    const avg = n ? sumZ / n : 0
    const lod = THREE.MathUtils.clamp(1 - avg / (spread * 1.2), 0.55, 1)
    layer.material.size = layer.userData.baseSize * lod * (bloom ? 1.05 : 1)
  }

  function followCamera(camera, elapsed, motion) {
    _ahead.set(0, 0, -1).applyQuaternion(camera.quaternion)
    const ax = camera.position.x
    const ay = camera.position.y
    const az = camera.position.z

    _down.set(0, -1, 0).applyQuaternion(camera.quaternion)
    lake.position.copy(camera.position).addScaledVector(_ahead, 130).addScaledVector(_down, 72)
    lake.quaternion.copy(camera.quaternion)
    lake.rotateX(-Math.PI * 0.42)

    nebula.position.set(ax + 40 + Math.sin(elapsed * 0.08) * 12 * motion, ay + 15, az - 175)
    nebula2.position.set(ax - 60 + Math.cos(elapsed * 0.06) * 18 * motion, ay - 10, az - 235)

    if (dust) {
      dust.position.copy(camera.position)
      dust.rotation.y = elapsed * 0.04
    }
  }

  function update(elapsed, camera, dt, state = {}) {
    const motion = reducedMotion ? 0.35 : 1
    const day = 0.5 + 0.5 * Math.sin(elapsed * 0.018)
    const fogBase = reducedMotion ? 0.01 : 0.0055
    scene.fog.density = fogBase * (0.82 + 0.28 * Math.sin(elapsed * 0.11))
    scene.fog.color.setHex(day > 0.55 ? dayFog : nightFog)
    _clear.copy(nightBg).lerp(dayBg, day * 0.22)
    state.clearColor = _clear

    followCamera(camera, elapsed, motion)
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
    lakeMat.uniforms.uTime.value = elapsed
    state.dayFactor = day
  }

  return { update, starLayers, dispose: () => {} }
}
