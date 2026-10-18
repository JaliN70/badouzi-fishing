import * as THREE from 'three'
import { asphaltTexture, concreteTexture, stdMat } from './sceneTextures.ts'

/** 場景 1 單位 = 1 公尺 */
export const M = 1

export interface HarborLayout {
  boats: THREE.Group[]
  waterSurface: THREE.Mesh
  pierFocus: THREE.Vector3
  shuaiPosition: THREE.Vector3
  grandpaPosition: THREE.Vector3
  pierDeckY: number
  castDirection: THREE.Vector3
}

function m(
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  cast = true,
  receive = true,
): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, mat)
  mesh.castShadow = cast
  mesh.receiveShadow = receive
  return mesh
}

function tetrapod(parent: THREE.Object3D, x: number, z: number, scale = 1.4): void {
  const g = new THREE.Group()
  const mat = stdMat(null, '#64748b', { roughness: 0.95 })
  for (let i = 0; i < 4; i++) {
    const leg = m(new THREE.CylinderGeometry(0.12 * scale, 0.18 * scale, 0.9 * scale, 6), mat)
    leg.rotation.z = Math.PI / 2.6
    leg.rotation.y = (i / 4) * Math.PI * 2
    leg.position.y = 0.25 * scale
    g.add(leg)
  }
  g.add(m(new THREE.DodecahedronGeometry(0.28 * scale, 0), mat))
  g.position.set(x, 0.05, z)
  g.rotation.y = Math.random() * Math.PI
  parent.add(g)
}

function fishingBoat(length = 11): THREE.Group {
  const g = new THREE.Group()
  const beam = length * 0.32
  const hull = m(
    new THREE.BoxGeometry(length * 0.85, 1.1, beam),
    stdMat(null, '#b91c1c', { roughness: 0.55, metalness: 0.12 }),
  )
  hull.position.set(length * 0.05, 0.45, 0)
  g.add(hull)
  const bow = m(new THREE.ConeGeometry(beam * 0.55, length * 0.28, 4), stdMat(null, '#b91c1c'))
  bow.rotation.z = -Math.PI / 2
  bow.position.set(length * 0.48, 0.45, 0)
  g.add(bow)
  const cabin = m(
    new THREE.BoxGeometry(length * 0.22, 1.8, beam * 0.72),
    stdMat(null, '#f8fafc', { roughness: 0.5 }),
  )
  cabin.position.set(-length * 0.18, 1.35, 0)
  g.add(cabin)
  const mast = m(new THREE.CylinderGeometry(0.06, 0.08, 3.2, 8), stdMat(null, '#78350f'))
  mast.position.set(length * 0.05, 2.8, 0)
  g.add(mast)
  return g
}

function buildNmmst(): THREE.Group {
  const g = new THREE.Group()
  const hall = m(
    new THREE.BoxGeometry(72, 14, 38),
    stdMat(null, '#f1f5f9', { roughness: 0.35, metalness: 0.12 }),
  )
  hall.position.y = 7
  g.add(hall)
  const roof = m(
    new THREE.CylinderGeometry(18, 18, 42, 3, 1, false, 0, Math.PI),
    stdMat(null, '#38bdf8', { roughness: 0.22, metalness: 0.4 }),
  )
  roof.rotation.z = Math.PI / 2
  roof.position.y = 16
  g.add(roof)
  const tower = m(new THREE.CylinderGeometry(3, 4, 22, 10), stdMat(null, '#e2e8f0'))
  tower.position.set(-24, 11, 0)
  g.add(tower)
  return g
}

/**
 * 八斗子漁港簡化實比例模型（參考港區尺度：堤岸寬約 5–6m、近海漁船 9–12m、
 * 防波堤與海科館方位與實地配置一致，可玩區域約 220m × 180m）。
 */
export function buildModeledBadouziHarbor(scene: THREE.Scene): HarborLayout {
  const boats: THREE.Group[] = []
  const pierDeckY = 1.15
  const castDirection = new THREE.Vector3(1, 0, 0.12).normalize()

  const concrete = concreteTexture()
  const asphalt = asphaltTexture()
  const pierMat = stdMat(concrete, '#b8c0c8', { repeat: [2, 12], roughness: 0.9 })
  const quayMat = stdMat(concrete, '#9ca3af', { repeat: [1, 4], roughness: 0.92 })

  const land = m(new THREE.BoxGeometry(90, 3, 140), stdMat(asphalt, '#52525b', { repeat: [8, 12] }))
  land.position.set(-52, 1.2, 0)
  scene.add(land)

  const slope = m(new THREE.BoxGeometry(28, 8, 120), stdMat(null, '#4b5563', { roughness: 1 }))
  slope.position.set(-28, 2.5, 0)
  slope.rotation.z = 0.12
  scene.add(slope)

  const pierLength = 42
  const pierWidth = 5.8
  const pier = m(new THREE.BoxGeometry(pierLength, 0.35, pierWidth), pierMat)
  pier.position.set(-4, pierDeckY, 0)
  scene.add(pier)

  for (let z = -pierWidth / 2 + 0.3; z <= pierWidth / 2 - 0.3; z += 0.45) {
    const plank = m(new THREE.BoxGeometry(pierLength - 0.4, 0.04, 0.08), stdMat(null, '#78716c'))
    plank.position.set(-4, pierDeckY + 0.2, z)
    scene.add(plank)
  }

  const quayWall = m(new THREE.BoxGeometry(0.6, 1.15, pierWidth + 0.4), quayMat)
  quayWall.position.set(-26.5, pierDeckY / 2 + 0.05, 0)
  scene.add(quayWall)

  for (let x = -24; x <= 14; x += 6) {
    const post = m(
      new THREE.CylinderGeometry(0.06, 0.07, 1.05, 10),
      stdMat(null, '#374151', { metalness: 0.45, roughness: 0.4 }),
    )
    post.position.set(x, pierDeckY + 0.65, pierWidth / 2 - 0.15)
    scene.add(post)
  }
  const rail = m(new THREE.BoxGeometry(pierLength + 4, 0.08, 0.08), stdMat(null, '#facc15'))
  rail.position.set(-4, pierDeckY + 1.05, pierWidth / 2 - 0.12)
  scene.add(rail)

  for (let x = -20; x <= 10; x += 10) {
    const bollard = m(
      new THREE.CylinderGeometry(0.14, 0.16, 0.42, 12),
      stdMat(null, '#1f2937', { metalness: 0.55, roughness: 0.35 }),
    )
    bollard.position.set(x, pierDeckY + 0.25, -pierWidth / 2 + 0.35)
    scene.add(bollard)
  }

  const breakwater = m(new THREE.BoxGeometry(8, 2.4, 118), stdMat(null, '#57534e', { roughness: 0.98 }))
  breakwater.position.set(38, 0.9, 0)
  scene.add(breakwater)
  for (let z = -52; z <= 52; z += 2.2) {
    for (let row = 0; row < 3; row++) {
      tetrapod(scene, 34 + row * 1.6, z + row * 0.4, 1.35)
    }
  }

  const lighthouse = m(new THREE.CylinderGeometry(1.1, 1.4, 8.5, 12), stdMat(null, '#e5e7eb'))
  lighthouse.position.set(38, 5.2, -48)
  scene.add(lighthouse)
  const lamp = m(
    new THREE.CylinderGeometry(1.3, 1.3, 1.2, 12),
    stdMat(null, '#ef4444', { emissive: '#991b1b', emissiveIntensity: 0.4 }),
  )
  lamp.position.set(38, 10.2, -48)
  scene.add(lamp)

  const shed = m(new THREE.BoxGeometry(14, 5.5, 9), stdMat(null, '#94a3b8'))
  shed.position.set(-32, 3.8, -28)
  scene.add(shed)

  const nmmst = buildNmmst()
  nmmst.position.set(-95, 0, 55)
  nmmst.rotation.y = 0.45
  scene.add(nmmst)

  const spawnBoat = (x: number, z: number, len: number, rot: number) => {
    const boat = fishingBoat(len)
    boat.position.set(x, 0, z)
    boat.rotation.y = rot
    scene.add(boat)
    boats.push(boat)
  }
  spawnBoat(28, -18, 11, -0.2)
  spawnBoat(42, 8, 9.5, 0.35)
  spawnBoat(22, 22, 10.5, 0.1)

  const waterGeo = new THREE.PlaneGeometry(220, 180, 88, 72)
  waterGeo.rotateX(-Math.PI / 2)
  const waterMat = new THREE.MeshStandardMaterial({
    color: '#0e7490',
    emissive: '#0c4a6e',
    emissiveIntensity: 0.12,
    roughness: 0.12,
    metalness: 0.55,
    transparent: true,
    opacity: 0.92,
  })
  const waterSurface = m(waterGeo, waterMat, false, true)
  waterSurface.position.set(18, 0, 0)
  scene.add(waterSurface)

  const shuaiPosition = new THREE.Vector3(6, pierDeckY, 1.2)
  const grandpaPosition = new THREE.Vector3(2, pierDeckY, -1.1)
  const pierFocus = new THREE.Vector3(18, 0, 1.5)

  return {
    boats,
    waterSurface,
    pierFocus,
    shuaiPosition,
    grandpaPosition,
    pierDeckY,
    castDirection,
  }
}
