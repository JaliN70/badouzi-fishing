import * as THREE from 'three'

export interface NightLightingHandles {
  hemi: THREE.HemisphereLight
  moon: THREE.DirectionalLight
  ambient: THREE.AmbientLight
  lampGroup: THREE.Group
}

export function applyNightSky(scene: THREE.Scene, renderer: THREE.WebGLRenderer): void {
  scene.background = new THREE.Color('#142238')
  scene.fog = new THREE.FogExp2('#1a2d45', 0.0026)
  renderer.toneMappingExposure = 1.18
}

export function createNightLighting(scene: THREE.Scene): NightLightingHandles {
  const hemi = new THREE.HemisphereLight('#5a7a9a', '#1e293b', 0.95)
  scene.add(hemi)

  const ambient = new THREE.AmbientLight('#334155', 0.52)
  scene.add(ambient)

  const moon = new THREE.DirectionalLight('#dbeafe', 0.78)
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

  const harborGlow = new THREE.DirectionalLight('#64748b', 0.38)
  harborGlow.position.set(80, 35, -50)
  scene.add(harborGlow)

  const fill = new THREE.DirectionalLight('#94a3b8', 0.28)
  fill.position.set(-20, 40, 60)
  scene.add(fill)

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
    const pl = new THREE.PointLight('#fef3c7', 0, 32, 1.6)
    lampGroup.add(pl)
    existing.push(pl)
  }
  for (let i = 0; i < positions.length; i++) {
    const p = positions[i]!
    const pl = existing[i]!
    pl.position.copy(p)
    pl.intensity = 2.4
    pl.color.set('#fef9c3')
  }
  return existing
}

export function setWaterNightLook(water: THREE.Mesh, wavePhase: number): void {
  const mat = water.material as THREE.MeshStandardMaterial
  mat.color.set('#15627a')
  mat.emissive.set('#0284c7')
  mat.emissiveIntensity = 0.28 + Math.sin(wavePhase * 1.6) * 0.06
}
