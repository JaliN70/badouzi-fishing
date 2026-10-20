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

export interface JiufenRidgeAmbience {
  update: (time: number) => void
  dispose: () => void
}

/** 九份／基隆山方向遠景燈海（山城階梯燈帶） */
export function createJiufenRidgeLights(parent: THREE.Object3D): JiufenRidgeAmbience {
  const root = new THREE.Group()
  root.position.set(-52, 0, -102)
  parent.add(root)

  const ridgeMat = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    emissive: '#1e293b',
    emissiveIntensity: 0.08,
    roughness: 0.98,
  })

  const m1 = new THREE.Mesh(new THREE.ConeGeometry(95, 42, 7), ridgeMat)
  m1.position.set(-18, 18, 8)
  root.add(m1)
  const m2 = new THREE.Mesh(new THREE.ConeGeometry(70, 32, 6), ridgeMat)
  m2.position.set(28, 14, 14)
  root.add(m2)
  const m3 = new THREE.Mesh(new THREE.BoxGeometry(140, 22, 55), ridgeMat)
  m3.position.set(5, 8, 22)
  root.add(m3)

  type Lamp = { mesh: THREE.Mesh; phase: number; speed: number; base: number }
  const lamps: Lamp[] = []
  const lampMat = new THREE.MeshBasicMaterial({
    color: '#fde68a',
    transparent: true,
    opacity: 0.95,
  })

  const ridgePath: [number, number, number][] = [
    [-55, 26, 0],
    [-42, 30, 4],
    [-28, 34, 8],
    [-12, 37, 12],
    [4, 39, 16],
    [18, 38, 20],
    [32, 35, 24],
    [44, 31, 28],
  ]

  for (let s = 0; s < ridgePath.length - 1; s++) {
    const a = ridgePath[s]!
    const b = ridgePath[s + 1]!
    const steps = 7 + s
    for (let i = 0; i < steps; i++) {
      const t = i / steps
      const x = THREE.MathUtils.lerp(a[0], b[0], t) + (Math.random() - 0.5) * 2.2
      const y = THREE.MathUtils.lerp(a[1], b[1], t) + (Math.random() - 0.5) * 1.2
      const z = THREE.MathUtils.lerp(a[2], b[2], t) + (Math.random() - 0.5) * 1.5
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.22 + Math.random() * 0.18, 6, 6),
        lampMat.clone(),
      )
      ;(mesh.material as THREE.MeshBasicMaterial).color.setHSL(
        0.11 + Math.random() * 0.05,
        0.85,
        0.55 + Math.random() * 0.25,
      )
      mesh.position.set(x, y, z)
      root.add(mesh)
      lamps.push({
        mesh,
        phase: Math.random() * Math.PI * 2,
        speed: 0.7 + Math.random() * 1.4,
        base: 0.75 + Math.random() * 0.5,
      })
    }
  }

  for (let i = 0; i < 18; i++) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), lampMat.clone())
    mesh.position.set(-20 + Math.random() * 70, 22 + Math.random() * 16, 6 + Math.random() * 22)
    ;(mesh.material as THREE.MeshBasicMaterial).color.setHSL(0.08, 0.7, 0.45 + Math.random() * 0.2)
    root.add(mesh)
    lamps.push({ mesh, phase: Math.random() * 6, speed: 0.5 + Math.random(), base: 0.5 })
  }

  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 3.2),
    new THREE.MeshBasicMaterial({
      color: '#fef3c7',
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    }),
  )
  label.position.set(-8, 44, 18)
  label.rotation.y = 0.35
  root.add(label)

  return {
    update(time: number) {
      for (const l of lamps) {
        const flick =
          l.base *
          (0.65 +
            0.2 * Math.sin(time * l.speed * 2.1 + l.phase) +
            0.15 * Math.sin(time * l.speed * 6.3 + l.phase * 2))
        const s = 0.7 + flick * 0.55
        l.mesh.scale.setScalar(s)
        const m = l.mesh.material as THREE.MeshBasicMaterial
        m.opacity = Math.min(1, 0.55 + flick * 0.45)
      }
    },
    dispose() {
      parent.remove(root)
      for (const l of lamps) {
        l.mesh.geometry.dispose()
        ;(l.mesh.material as THREE.MeshBasicMaterial).dispose()
      }
      m1.geometry.dispose()
      m2.geometry.dispose()
      m3.geometry.dispose()
      ridgeMat.dispose()
      label.geometry.dispose()
      ;(label.material as THREE.MeshBasicMaterial).dispose()
    },
  }
}
