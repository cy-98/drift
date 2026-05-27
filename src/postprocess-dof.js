import * as THREE from 'three'

/** Radial soft-focus for screenshot mode (center sharp, edges bloom-blur). */
export const PhotoDofShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2(1, 1) },
    strength: { value: 0.72 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float strength;
    varying vec2 vUv;
    void main() {
      vec2 uv = vUv;
      float dist = length(uv - 0.5);
      float blurAmt = smoothstep(0.06, 0.42, dist) * strength * 3.5;
      vec4 col = vec4(0.0);
      float total = 0.0;
      for (float x = -2.0; x <= 2.0; x += 1.0) {
        for (float y = -2.0; y <= 2.0; y += 1.0) {
          vec2 off = vec2(x, y) * blurAmt / resolution;
          float w = 1.0 - length(vec2(x, y)) * 0.14;
          col += texture2D(tDiffuse, uv + off) * w;
          total += w;
        }
      }
      gl_FragColor = col / total;
    }
  `,
}
