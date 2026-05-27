import * as THREE from 'three'
import { PhotoDofShader } from './postprocess-dof.js'

let postModules = null

async function loadPostModules() {
  if (postModules) return postModules
  const [EffectComposer, RenderPass, UnrealBloomPass, ShaderPass] = await Promise.all([
    import('three/addons/postprocessing/EffectComposer.js'),
    import('three/addons/postprocessing/RenderPass.js'),
    import('three/addons/postprocessing/UnrealBloomPass.js'),
    import('three/addons/postprocessing/ShaderPass.js'),
  ])
  postModules = {
    EffectComposer: EffectComposer.EffectComposer,
    RenderPass: RenderPass.RenderPass,
    UnrealBloomPass: UnrealBloomPass.UnrealBloomPass,
    ShaderPass: ShaderPass.ShaderPass,
  }
  return postModules
}

export function createPostprocess(renderer, scene, camera) {
  let composer = null
  let bloomPass = null
  let dofPass = null
  let enabled = false
  let photoDofActive = false
  let quality = 'medium'
  let composerReady = false
  let composerFailed = false

  function syncDofPass() {
    if (!dofPass) return
    dofPass.enabled = photoDofActive && composerReady
  }

  async function ensureComposer() {
    if (composer || composerFailed) return
    try {
      const { EffectComposer, RenderPass, UnrealBloomPass, ShaderPass } = await loadPostModules()
      composer = new EffectComposer(renderer)
      composer.addPass(new RenderPass(scene, camera))
      bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.35, 0.45, 0.72)
      composer.addPass(bloomPass)
      dofPass = new ShaderPass(PhotoDofShader)
      dofPass.enabled = false
      composer.addPass(dofPass)
      composerReady = true
      applyStrength()
      syncDofPass()
    } catch (err) {
      console.warn('[Drift] Bloom postprocess unavailable', err)
      composerFailed = true
      enabled = false
    }
  }

  function applyStrength() {
    if (!bloomPass) return
    const map = { low: 0.22, medium: 0.34, high: 0.48 }
    bloomPass.strength = map[quality] ?? map.medium
    bloomPass.radius = quality === 'high' ? 0.55 : 0.42
    bloomPass.threshold = quality === 'low' ? 0.78 : 0.68
  }

  function setEnabled(on, q = quality) {
    enabled = !!on && !composerFailed
    quality = q
    if (!enabled) return
    void ensureComposer()
  }

  function setPhotoDof(on) {
    photoDofActive = !!on
    if (photoDofActive && !composerFailed) {
      enabled = true
      void ensureComposer().then(syncDofPass)
    } else {
      syncDofPass()
    }
  }

  function resize(w, h) {
    if (!composer) return
    composer.setSize(w, h)
    bloomPass?.resolution.set(w, h)
    if (dofPass?.uniforms?.resolution) dofPass.uniforms.resolution.value.set(w, h)
  }

  function render() {
    try {
      if (enabled && composerReady && composer) composer.render()
      else renderer.render(scene, camera)
    } catch (err) {
      console.warn('[Drift] render fallback', err)
      renderer.render(scene, camera)
    }
  }

  function dispose() {
    composer?.dispose()
    composer = null
    bloomPass = null
    dofPass = null
  }

  return { render, resize, setEnabled, setPhotoDof, dispose }
}
