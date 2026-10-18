import * as THREE from 'three'
import { asphaltTexture, concreteTexture, stdMat } from './sceneTextures.ts'

function mesh(
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  cast = true,
  receive = true,
): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat)
  m.castShadow = cast
  m.receiveShadow = receive
  return m
}

function box(w: number, h: number, d: number, mat: THREE.Material): THREE.Mesh {
  return mesh(new THREE.BoxGeometry(w, h, d), mat)
}

export function addTetrapod(parent: THREE.Object3D, x: number, y: number, z: number, scale = 1): void {
  const g = new THREE.Group()
  const mat = stdMat(null, '#64748b', { roughness: 0.95 })
  for (let i = 0; i < 4; i++) {
    const leg = mesh(new THREE.CylinderGeometry(0.08 * scale, 0.12 * scale, 0.55 * scale, 6), mat)
    leg.rotation.z = Math.PI / 2.8
    leg.rotation.y = (i / 4) * Math.PI * 2
    leg.position.y = 0.15 * scale
    g.add(leg)
  }
  const core = mesh(new THREE.DodecahedronGeometry(0.18 * scale, 0), mat)
  core.position.y = 0.22 * scale
  g.add(core)
  g.position.set(x, y, z)
  g.rotation.y = Math.random() * Math.PI
  parent.add(g)
}

export interface HarborBuildResult {
  boats: THREE.Group[]
  waterSurface: THREE.Mesh
  pierFocus: THREE.Vector3
}

/** 參考基隆八斗子：渔港堤岸、消波塊、海科館方向陸域、港內漁船 */
export function buildBadouziEnvironment(scene: THREE.Scene): HarborBuildResult {
  const boats: THREE.Group[] = []
  const pierFocus = new THREE.Vector3(1.5, 0, 0.5)

  const concrete = concreteTexture()
  const asphalt = asphaltTexture()
  const pierMat = stdMat(concrete, '#a8b0ba', { repeat: [3, 8], roughness: 0.92 })
  const roadMat = stdMat(asphalt, '#4b5563', { repeat: [2, 6], roughness: 0.95 })

  const coast = box(16, 0.45, 24, stdMat(null, '#5c6b5a', { roughness: 1 }))
  coast.position.set(-8, -0.18, 0)
  scene.add(coast)

  for (let i = 0; i < 5; i++) {
    const ridge = mesh(
      new THREE.ConeGeometry(2.5 + i * 0.4, 2 + i * 0.6, 5),
      stdMat(null, i % 2 ? '#2f5238' : '#3d6b4f', { roughness: 0.98 }),
    )
    ridge.position.set(-14 - i * 1.2, 0.8, -5 + i * 2.5)
    scene.add(ridge)
  }

  const road = box(3.2, 0.08, 18, roadMat)
  road.position.set(-5.2, 0.02, 0)
  scene.add(road)

  const pierDeck = box(6, 0.32, 18, pierMat)
  pierDeck.position.set(-2.4, 0.08, 0)
  scene.add(pierDeck)

  for (let z = -8; z <= 8; z += 1.2) {
    const seam = box(5.6, 0.02, 0.06, stdMat(null, '#6b7280'))
    seam.position.set(-2.4, 0.26, z)
    scene.add(seam)
  }

  for (let z = -7.5; z <= 7.5; z += 3) {
    const railPost = mesh(
      new THREE.CylinderGeometry(0.05, 0.06, 0.85, 8),
      stdMat(null, '#374151', { metalness: 0.35, roughness: 0.45 }),
    )
    railPost.position.set(0.35, 0.55, z)
    scene.add(railPost)
  }
  const rail = box(0.08, 0.08, 16, stdMat(null, '#facc15'))
  rail.position.set(0.35, 0.88, 0)
  scene.add(rail)
  const rail2 = box(0.06, 0.06, 16, stdMat(null, '#111827'))
  rail2.position.set(0.42, 0.88, 0)
  scene.add(rail2)

  for (let z = -6; z <= 6; z += 4) {
    const bollard = mesh(
      new THREE.CylinderGeometry(0.12, 0.14, 0.35, 10),
      stdMat(null, '#1f2937', { metalness: 0.5, roughness: 0.4 }),
    )
    bollard.position.set(-0.5, 0.35, z)
    scene.add(bollard)
  }

  const shed = box(2.8, 1.6, 3.5, stdMat(null, '#94a3b8', { roughness: 0.75 }))
  shed.position.set(-4.8, 0.85, -5)
  scene.add(shed)
  const shedRoof = box(3, 0.12, 3.8, stdMat(null, '#475569'))
  shedRoof.position.set(-4.8, 1.72, -5)
  shedRoof.rotation.y = 0.04
  scene.add(shedRoof)

  const net = mesh(
    new THREE.PlaneGeometry(2.2, 1.2),
    new THREE.MeshStandardMaterial({
      color: '#cbd5e1',
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    }),
    false,
    true,
  )
  net.position.set(-4.2, 0.9, -3.2)
  net.rotation.y = -0.4
  scene.add(net)

  const breakCore = box(1.6, 1.1, 16, stdMat(null, '#57534e', { roughness: 0.98 }))
  breakCore.position.set(1.1, 0.15, 0)
  scene.add(breakCore)
  for (let z = -7; z <= 7; z += 1.4) {
    for (let row = 0; row < 2; row++) {
      addTetrapod(scene, 1.5 + row * 0.35, 0.05, z + row * 0.3, 0.85)
    }
  }

  const lighthouseBase = mesh(
    new THREE.CylinderGeometry(0.35, 0.45, 2.4, 10),
    stdMat(null, '#e5e7eb', { roughness: 0.6 }),
  )
  lighthouseBase.position.set(1.1, 1.35, -6.5)
  scene.add(lighthouseBase)
  const lampRoom = mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 0.45, 10),
    stdMat(null, '#ef4444', { emissive: '#991b1b', roughness: 0.35 }),
  )
  lampRoom.position.set(1.1, 2.65, -6.5)
  scene.add(lampRoom)

  const nmmst = new THREE.Group()
  const mainHall = box(8, 2.2, 4.5, stdMat(null, '#f1f5f9', { roughness: 0.35, metalness: 0.15 }))
  mainHall.position.y = 1.1
  nmmst.add(mainHall)
  const waveRoof = mesh(
    new THREE.CylinderGeometry(2, 2, 5, 3, 1, false, 0, Math.PI),
    stdMat(null, '#38bdf8', { roughness: 0.25, metalness: 0.35 }),
  )
  waveRoof.rotation.z = Math.PI / 2
  waveRoof.position.set(0, 2.5, 0)
  nmmst.add(waveRoof)
  nmmst.position.set(-11, 0.2, 7)
  nmmst.rotation.y = 0.35
  scene.add(nmmst)

  const sign = mesh(
    new THREE.PlaneGeometry(4.5, 1.1),
    new THREE.MeshStandardMaterial({
      color: '#0c4a6e',
      emissive: '#0369a1',
      emissiveIntensity: 0.25,
    }),
    false,
    true,
  )
  sign.position.set(-3, 2.2, -8)
  sign.rotation.x = -0.55
  scene.add(sign)

  const spawnBoat = (x: number, z: number, hullColor: string, name: string) => {
    const g = new THREE.Group()
    const hull = mesh(
      new THREE.BoxGeometry(3.2, 0.55, 1.25),
      stdMat(null, hullColor, { roughness: 0.55, metalness: 0.12 }),
    )
    hull.position.y = 0.25
    g.add(hull)
    const bow = mesh(new THREE.ConeGeometry(0.65, 1.2, 4), stdMat(null, hullColor))
    bow.rotation.z = -Math.PI / 2
    bow.position.set(1.85, 0.28, 0)
    g.add(bow)
    const cabin = box(1.1, 0.75, 0.85, stdMat(null, '#f8fafc'))
    cabin.position.set(-0.45, 0.75, 0)
    g.add(cabin)
    const mast = mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 1.5, 6),
      stdMat(null, '#78350f'),
    )
    mast.position.set(0.2, 1.35, 0)
    g.add(mast)
    g.position.set(x, 0.02, z)
    g.userData.name = name
    scene.add(g)
    boats.push(g)
  }

  spawnBoat(5.5, -2.5, '#b91c1c', '福旺號')
  spawnBoat(7.8, 1.8, '#1d4ed8', '八斗子號')
  spawnBoat(9.2, 5.2, '#047857', '基隆星')
  spawnBoat(4.2, 4.5, '#ea580c', '晨釣號')

  for (let i = 0; i < 6; i++) {
    const buoy = mesh(
      new THREE.SphereGeometry(0.18, 12, 12),
      stdMat(null, i % 2 === 0 ? '#ef4444' : '#f97316', { roughness: 0.4 }),
    )
    buoy.position.set(3 + i * 2.2, 0.12, -6 + i * 2.8)
    scene.add(buoy)
    const buoyPole = mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.35, 6),
      stdMat(null, '#292524'),
    )
    buoyPole.position.set(buoy.position.x, 0.05, buoy.position.z)
    scene.add(buoyPole)
  }

  const waterGeo = new THREE.PlaneGeometry(42, 32, 48, 36)
  waterGeo.rotateX(-Math.PI / 2)
  const waterMat = new THREE.MeshStandardMaterial({
    color: '#0c7a8a',
    emissive: '#0c4a6e',
    emissiveIntensity: 0.15,
    roughness: 0.15,
    metalness: 0.55,
    transparent: true,
    opacity: 0.94,
    flatShading: false,
  })
  const waterSurface = mesh(waterGeo, waterMat, false, true)
  waterSurface.position.set(11, -0.04, 0)
  scene.add(waterSurface)

  const seabed = mesh(
    new THREE.PlaneGeometry(42, 32),
    stdMat(null, '#1e3a2f', { roughness: 1 }),
    false,
    true,
  )
  seabed.rotation.x = -Math.PI / 2
  seabed.position.set(11, -1.8, 0)
  scene.add(seabed)

  return { boats, waterSurface, pierFocus }
}
