import * as THREE from 'three'

export interface HorizonAmbience {
  update: (time: number) => void
  dispose: () => void
}

/** 外海漁火／漁船燈，緩慢閃爍 */
export function createHorizonAmbience(parent: THREE.Object3D): HorizonAmbience {
  const group = new THREE.Group()
  parent.add(group)

  type Lamp = {
    mesh: THREE.Mesh
    light: THREE.PointLight
    phase: number
    speed: number
  }
  const lamps: Lamp[] = []

  const spots: [number, number, number][] = [
    [-80, 195, 0.9],
    [-35, 210, 1.1],
    [20, 185, 0.85],
    [65, 220, 1.2],
    [110, 200, 0.95],
    [-120, 175, 0.75],
    [40, 165, 0.8],
    [95, 188, 1.05],
  ]

  for (const [x, z, speed] of spots) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 8, 8),
      new THREE.MeshBasicMaterial({ color: '#fef3c7' }),
    )
    mesh.position.set(x, 1.2 + Math.random() * 0.8, z)
    group.add(mesh)

    const light = new THREE.PointLight('#fcd34d', 0, 55, 1.6)
    light.position.copy(mesh.position)
    group.add(light)

    lamps.push({ mesh, light, phase: Math.random() * Math.PI * 2, speed })
  }

  return {
    update(time: number) {
      for (const l of lamps) {
        const flicker =
          0.55 +
          0.25 * Math.sin(time * l.speed * 2.3 + l.phase) +
          0.2 * Math.sin(time * l.speed * 5.7 + l.phase * 1.7)
        l.light.intensity = 1.2 * flicker
        const s = 0.85 + flicker * 0.35
        l.mesh.scale.setScalar(s)
      }
    },
    dispose() {
      parent.remove(group)
      for (const l of lamps) {
        l.mesh.geometry.dispose()
        ;(l.mesh.material as THREE.Material).dispose()
        l.light.dispose()
      }
    },
  }
}

/** 碼頭水線濕潤反光 */
export function addPierWetGleam(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  length: number,
  rotY = 0,
): void {
  const geo = new THREE.PlaneGeometry(length, 0.45)
  geo.rotateX(-Math.PI / 2)
  const mat = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    emissive: '#64748b',
    emissiveIntensity: 0.35,
    roughness: 0.12,
    metalness: 0.72,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  })
  const strip = new THREE.Mesh(geo, mat)
  strip.position.set(x, y, z)
  strip.rotation.y = rotY
  strip.renderOrder = 2
  parent.add(strip)
}
