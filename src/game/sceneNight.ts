import * as THREE from 'three'

export interface NightLightingHandles {
  hemi: THREE.HemisphereLight
  moon: THREE.DirectionalLight
  ambient: THREE.AmbientLight
  lampGroup: THREE.Group
}

export function applyNightSky(scene: THREE.Scene, renderer: THREE.WebGLRenderer): void {
  scene.background = new THREE.Color('#4a6278')
  scene.fog = new THREE.FogExp2('#5a7288', 0.0011)
  renderer.toneMappingExposure = 1.95
}

export function createNightLighting(scene: THREE.Scene): NightLightingHandles {
  const hemi = new THREE.HemisphereLight('#b8d4ef', '#5c6b7a', 1.75)
  scene.add(hemi)

  const ambient = new THREE.AmbientLight('#94a3b8', 1.15)
  scene.add(ambient)

  const moon = new THREE.DirectionalLight('#ffffff', 1.45)
  moon.position.set(-60, 90, 40)
  moon.castShadow = false
  moon.shadow.mapSize.set(2048, 2048)
  moon.shadow.camera.near = 4
  moon.shadow.camera.far = 320
  moon.shadow.camera.left = -120
  moon.shadow.camera.right = 200
  moon.shadow.camera.top = 120
  moon.shadow.camera.bottom = -120
  moon.shadow.bias = -0.00035
  scene.add(moon)

  const harborGlow = new THREE.DirectionalLight('#e2e8f0', 0.85)
  harborGlow.position.set(80, 35, -50)
  scene.add(harborGlow)

  const fill = new THREE.DirectionalLight('#f1f5f9', 0.75)
  fill.position.set(-20, 40, 60)
  scene.add(fill)

  const groundBounce = new THREE.DirectionalLight('#64748b', 0.55)
  groundBounce.position.set(0, 120, 0)
  scene.add(groundBounce)

  const lampGroup = new THREE.Group()
  scene.add(lampGroup)

  return { hemi, moon, ambient, lampGroup }
}

export function syncParkLamps(
  lampGroup: THREE.Group,
  positions: THREE.Vector3[],
  existing: THREE.PointLight[],
): THREE.PointLight[] {
  while (existing.length > positions.length) {
    const light = existing.pop()!
    lampGroup.remove(light)
    light.dispose()
  }
  while (existing.length < positions.length) {
    const pl = new THREE.PointLight('#fffbeb', 0, 45, 1.35)
    lampGroup.add(pl)
    existing.push(pl)
  }
  for (let i = 0; i < positions.length; i++) {
    const p = positions[i]!
    const pl = existing[i]!
    pl.position.copy(p)
    pl.intensity = 5.5
    pl.color.set('#fffbeb')
  }
  return existing
}

export function setWaterNightLook(water: THREE.Mesh, wavePhase: number): void {
  const mat = water.material as THREE.MeshStandardMaterial
  mat.color.set('#1d8aaa')
  mat.emissive.set('#38bdf8')
  mat.emissiveIntensity = 0.42 + Math.sin(wavePhase * 1.6) * 0.08
}
