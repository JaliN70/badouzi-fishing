import * as THREE from 'three'
import { waterNormalTexture } from './sceneTextures.ts'

const MAX_RIPPLES = 6

export interface SeaWaterEffects {
  surface: THREE.Mesh
  setTime: (t: number) => void
  setBobber: (worldX: number, worldZ: number, active: boolean) => void
  pushRipple: (worldX: number, worldZ: number, strength: number) => void
}

export type SeaWaterBundle = SeaWaterEffects

type Ripple = { x: number; z: number; birth: number; strength: number }

const vertexShader = /* glsl */ `
uniform float uTime;
uniform vec4 uRipples[6];
uniform vec2 uBobber;
uniform float uBobberActive;

varying vec3 vWorldPos;
varying vec3 vNormalW;
varying vec2 vUv;
varying float vWave;
varying float vRippleMask;

float rippleMaskAt(vec2 xz) {
  float mask = 0.0;
  for (int i = 0; i < 6; i++) {
    vec4 r = uRipples[i];
    float age = uTime - r.w;
    if (age > 0.0 && age < 5.5) {
      float d = distance(xz, r.xy);
      float ring = sin((d - age * 3.2) * 7.0) * exp(-age * 0.55) * exp(-d * 0.055);
      mask += abs(ring) * r.z * 0.35;
    }
  }
  if (uBobberActive > 0.5) {
    float d = distance(xz, uBobber);
    mask += abs(sin(d * 16.0 - uTime * 9.0) * exp(-d * 0.12)) * 0.12;
  }
  return mask;
}

float baseWave(vec2 xz) {
  float t = uTime;
  return
    sin(xz.x * 0.11 + t * 1.35) * 0.11 +
    cos(xz.y * 0.09 + t * 1.05) * 0.09 +
    sin((xz.x * 0.07 + xz.y * 0.08) + t * 1.65) * 0.06 +
    cos(xz.x * 0.19 - xz.y * 0.14 + t * 2.1) * 0.035;
}

float rippleSum(vec2 xz) {
  float h = 0.0;
  for (int i = 0; i < 6; i++) {
    vec4 r = uRipples[i];
    float age = uTime - r.w;
    if (age > 0.0 && age < 5.5) {
      float d = distance(xz, r.xy);
      float ring = sin((d - age * 3.2) * 7.0) * exp(-age * 0.55) * exp(-d * 0.055);
      h += ring * r.z;
    }
  }
  if (uBobberActive > 0.5) {
    float d = distance(xz, uBobber);
    h += sin(d * 16.0 - uTime * 9.0) * exp(-d * 0.12) * 0.028;
  }
  return h;
}

float waveHeight(vec2 xz) {
  return baseWave(xz) + rippleSum(xz);
}

void main() {
  vUv = uv;
  vec3 pos = position;
  vRippleMask = rippleMaskAt(pos.xz);
  float h = waveHeight(pos.xz);
  vWave = h;
  float eps = 0.35;
  float hx = waveHeight(pos.xz + vec2(eps, 0.0)) - waveHeight(pos.xz - vec2(eps, 0.0));
  float hz = waveHeight(pos.xz + vec2(0.0, eps)) - waveHeight(pos.xz - vec2(0.0, eps));
  vec3 n = normalize(vec3(-hx, 2.0 * eps, -hz));
  vNormalW = normalize(mat3(modelMatrix) * n);
  pos.y += h;
  vec4 world = modelMatrix * vec4(pos, 1.0);
  vWorldPos = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uDeepColor;
uniform vec3 uShallowColor;
uniform vec3 uMoonDir;
uniform sampler2D uNormalMap;
uniform vec2 uFlowA;
uniform vec2 uFlowB;
uniform float uFoamRadius;
uniform vec3 uShoreCenter;

varying vec3 vWorldPos;
varying vec3 vNormalW;
varying vec2 vUv;
varying float vWave;
varying float vRippleMask;

void main() {
  vec2 uvA = vUv * 8.0 + uFlowA;
  vec2 uvB = vUv * 5.0 + uFlowB;
  vec3 nA = texture2D(uNormalMap, uvA).xyz * 2.0 - 1.0;
  vec3 nB = texture2D(uNormalMap, uvB).xyz * 2.0 - 1.0;
  vec3 nMap = normalize(nA + nB);
  vec3 N = normalize(vNormalW + vec3(nMap.x, nMap.y * 0.35, nMap.z) * 0.55);

  vec3 V = normalize(cameraPosition - vWorldPos);
  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.8);
  vec3 H = normalize(uMoonDir + V);
  float spec = pow(max(dot(N, H), 0.0), 120.0) * 0.85;
  float specBroad = pow(max(dot(N, H), 0.0), 28.0) * 0.25;

  float distShore = length(vWorldPos.xz - uShoreCenter.xz);
  float depthMix = smoothstep(4.0, 42.0, distShore);
  vec3 waterCol = mix(uShallowColor, uDeepColor, depthMix);
  waterCol += vec3(0.04, 0.12, 0.18) * (0.35 + vWave * 2.0);

  vec3 moonTint = vec3(0.75, 0.88, 1.0);
  vec3 col = waterCol;
  col += moonTint * (fresnel * 0.55 + spec + specBroad);
  col += vec3(0.02, 0.08, 0.12) * fresnel;
  col += vec3(0.15, 0.35, 0.45) * vRippleMask;

  float foam = smoothstep(uFoamRadius - 6.0, uFoamRadius - 1.5, distShore);
  foam *= 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * 2.2 + vWorldPos.x * 0.2 + vWorldPos.z * 0.17));
  col = mix(col, vec3(0.82, 0.92, 0.98), foam * 0.45);

  float alpha = mix(0.88, 0.96, fresnel);
  gl_FragColor = vec4(col, alpha);
}
`

export function createSeaWater(opts: {
  width: number
  depth: number
  segX?: number
  segY?: number
  position: THREE.Vector3
  shoreCenter: THREE.Vector3
  foamRadius?: number
  deepColor?: string
  shallowColor?: string
}): SeaWaterEffects {
  const segX = opts.segX ?? 96
  const segY = opts.segY ?? 80
  const geo = new THREE.PlaneGeometry(opts.width, opts.depth, segX, segY)
  geo.rotateX(-Math.PI / 2)

  const normalMap = waterNormalTexture()
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping

  const rippleUniforms = Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector4(0, 0, 0, -999))
  const ripples: Ripple[] = []

  const uniforms = {
    uTime: { value: 0 },
    uDeepColor: { value: new THREE.Color(opts.deepColor ?? '#042f3a') },
    uShallowColor: { value: new THREE.Color(opts.shallowColor ?? '#0e7490') },
    uMoonDir: { value: new THREE.Vector3(-0.45, 0.82, 0.35).normalize() },
    uNormalMap: { value: normalMap },
    uFlowA: { value: new THREE.Vector2(0, 0) },
    uFlowB: { value: new THREE.Vector2(0, 0) },
    uFoamRadius: { value: opts.foamRadius ?? 38 },
    uShoreCenter: { value: opts.shoreCenter.clone() },
    uRipples: { value: rippleUniforms },
    uBobber: { value: new THREE.Vector2(0, 0) },
    uBobberActive: { value: 0 },
  }

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: true,
    side: THREE.DoubleSide,
  })

  const surface = new THREE.Mesh(geo, mat)
  surface.position.copy(opts.position)
  surface.receiveShadow = true

  const syncRippleUniforms = (time: number): void => {
    for (let i = 0; i < MAX_RIPPLES; i++) {
      const r = ripples[i]
      const u = rippleUniforms[i]!
      if (r) {
        u.set(r.x, r.z, r.strength, r.birth)
      } else {
        u.set(0, 0, 0, time - 999)
      }
    }
  }

  const setTime = (t: number): void => {
    uniforms.uTime.value = t
    uniforms.uFlowA.value.set(Math.sin(t * 0.31) * 0.08 + t * 0.045, t * 0.038)
    uniforms.uFlowB.value.set(-t * 0.028, Math.cos(t * 0.27) * 0.06 + t * 0.032)
    while (ripples.length > 0 && t - ripples[0]!.birth > 5.5) ripples.shift()
    syncRippleUniforms(t)
  }

  const pushRipple = (worldX: number, worldZ: number, strength: number): void => {
    const birth = uniforms.uTime.value
    ripples.push({ x: worldX, z: worldZ, birth, strength })
    while (ripples.length > MAX_RIPPLES) ripples.shift()
    syncRippleUniforms(birth)
  }

  const setBobber = (worldX: number, worldZ: number, active: boolean): void => {
    uniforms.uBobber.value.set(worldX, worldZ)
    uniforms.uBobberActive.value = active ? 1 : 0
  }

  return { surface, setTime, setBobber, pushRipple }
}
