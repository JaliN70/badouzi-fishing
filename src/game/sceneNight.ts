import * as THREE from 'three'

export interface NightLightingHandles {
  hemi: THREE.HemisphereLight
  moon: THREE.DirectionalLight
  ambient: THREE.AmbientLight
  lampGroup: THREE.Group
}

export function applyNightSky(scene: THREE.Scene, renderer: THREE.WebGLRenderer): void {
  scene.background = new THREE.Color('#060d18')
  scene.fog = new THREE.FogExp2('#0a1628', 0.0042)
  renderer.toneMappingExposure = 0.92
}

export function createNightLighting(scene: THREE.Scene): NightLightingHandles {
  const hemi = new THREE.HemisphereLight('#1e3a5f', '#020617', 0.55)
  scene.add(hemi)

  const ambient = new THREE.AmbientLight('#0f172a', 0.35)
  scene.add(ambient)

  const moon = new THREE.DirectionalLight('#c7d2fe', 0.42)
  moon.position.set(-60, 90, 40)
  moon.castShadow = true
  moon.shadow.mapSize.set(2048, 2048)
  moon.shadow.camera.near = 4
  moon.shadow.camera.far = 320
  moon.shadow.camera.left = -120
  moon.shadow.camera.right = 200
  moon.shadow.camera.top = 120
  moon.shadow.camera.bottom = -120
  moon.shadow.bias = -0.00035
  scene.add(moon)

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
    const pl = new THREE.PointLight('#fde68a', 0, 22, 2)
    lampGroup.add(pl)
    existing.push(pl)
  }
  for (let i = 0; i < positions.length; i++) {
    const p = positions[i]!
    const pl = existing[i]!
    pl.position.copy(p)
    pl.intensity = 1.15
    pl.color.set('#fef08a')
  }
  return existing
}

export function setWaterNightLook(water: THREE.Mesh, wavePhase: number): void {
  const mat = water.material as THREE.MeshStandardMaterial
  mat.color.set('#0a3d56')
  mat.emissive.set('#0369a1')
  mat.emissiveIntensity = 0.14 + Math.sin(wavePhase * 1.6) * 0.04
}
