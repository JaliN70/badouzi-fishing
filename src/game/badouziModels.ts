import * as THREE from 'three'
import type { HarborLayout } from './harborLayout.ts'
import {
  asphaltTexture,
  basaltRockTexture,
  concreteTexture,
  grassTexture,
  stdMat,
} from './sceneTextures.ts'
import { addPierWetGleam } from './sceneAmbience.ts'
import { createSeaWater } from './seaWater.ts'
import { mesh, roadSign } from './sceneUtils.ts'

function tetrapod(parent: THREE.Object3D, x: number, z: number, scale = 1.35): void {
  const g = new THREE.Group()
  const mat = stdMat(null, '#64748b', { roughness: 0.95 })
  for (let i = 0; i < 4; i++) {
    const leg = mesh(new THREE.CylinderGeometry(0.12 * scale, 0.18 * scale, 0.9 * scale, 6), mat)
    leg.rotation.z = Math.PI / 2.6
    leg.rotation.y = (i / 4) * Math.PI * 2
    leg.position.y = 0.25 * scale
    g.add(leg)
  }
  g.add(mesh(new THREE.DodecahedronGeometry(0.28 * scale, 0), mat))
  g.position.set(x, 0.05, z)
  g.rotation.y = Math.random() * Math.PI
  parent.add(g)
}

function fishingBoat(length = 11): THREE.Group {
  const g = new THREE.Group()
  const beam = length * 0.32
  g.add(
    mesh(
      new THREE.BoxGeometry(length * 0.85, 1.1, beam),
      stdMat(null, '#b91c1c', { roughness: 0.55, metalness: 0.12 }),
    ).translateX(length * 0.05).translateY(0.45),
  )
  const bow = mesh(new THREE.ConeGeometry(beam * 0.55, length * 0.28, 4), stdMat(null, '#b91c1c'))
  bow.rotation.z = -Math.PI / 2
  bow.position.set(length * 0.48, 0.45, 0)
  g.add(bow)
  const cabin = mesh(
    new THREE.BoxGeometry(length * 0.22, 1.8, beam * 0.72),
    stdMat(null, '#f8fafc', { roughness: 0.5 }),
  )
  cabin.position.set(-length * 0.18, 1.35, 0)
  g.add(cabin)
  const mast = mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.2, 8), stdMat(null, '#78350f'))
  mast.position.set(length * 0.05, 2.8, 0)
  g.add(mast)

  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 8),
    new THREE.MeshBasicMaterial({ color: '#fef08a' }),
  )
  lamp.position.set(-length * 0.18, 1.55, beam * 0.38)
  g.add(lamp)
  const boatLight = new THREE.PointLight('#fde68a', 1.4, 14, 1.4)
  boatLight.position.copy(lamp.position)
  g.add(boatLight)
  g.userData.boatLight = boatLight

  return g
}

/** 海科館主題館：白量體 + 藍色曲面屋頂 + IMAX 圓筒（簡化） */
function buildNmmstCampus(): THREE.Group {
  const g = new THREE.Group()
  const white = stdMat(null, '#f8fafc', { roughness: 0.32, metalness: 0.15 })
  const blue = stdMat(null, '#0ea5e9', { roughness: 0.2, metalness: 0.45 })

  const main = mesh(new THREE.BoxGeometry(88, 18, 52), white)
  main.position.y = 9
  g.add(main)

  for (let i = 0; i < 3; i++) {
    const wave = mesh(
      new THREE.CylinderGeometry(16 - i * 2, 16 - i * 2, 28, 3, 1, false, 0, Math.PI),
      blue,
    )
    wave.rotation.z = Math.PI / 2
    wave.position.set(-8 + i * 14, 20 + i * 1.5, -6 + i * 8)
    g.add(wave)
  }

  const imax = mesh(new THREE.CylinderGeometry(11, 11, 14, 24), white)
  imax.position.set(38, 7, 18)
  g.add(imax)
  const imaxRoof = mesh(
    new THREE.SphereGeometry(11.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    stdMat(null, '#64748b', { metalness: 0.5, roughness: 0.35 }),
  )
  imaxRoof.position.set(38, 14, 18)
  g.add(imaxRoof)

  const explore = mesh(new THREE.BoxGeometry(42, 10, 28), stdMat(null, '#e2e8f0'))
  explore.position.set(-42, 5, 22)
  g.add(explore)
  return g
}

/**
 * 八斗子漁港實比例簡化（參考漁業署港區配置）：
 * - 西海堤、東防波堤（549m）、北向外港水域
 * - 北寧路沿岸、突堤碼頭、魚市場
 * - 海科館在北寧路東段（367 號方向）
 * - 西側為碧砂／海大方向
 */
export function buildModeledBadouziHarbor(parent: THREE.Object3D): HarborLayout {
  const boats: THREE.Group[] = []
  const lampPositions: THREE.Vector3[] = []
  const pierDeckY = 1.2
  const castDirection = new THREE.Vector3(0.08, 0, 0.996).normalize()

  const concrete = concreteTexture()
  const asphalt = asphaltTexture()
  const grass = grassTexture()
  const basalt = basaltRockTexture()
  const pierMat = stdMat(concrete, '#b8c0c8', { repeat: [2, 12], roughness: 0.9 })
  const dikeMat = stdMat(concrete, '#9ca3af', { repeat: [3, 8], roughness: 0.92 })
  const dikeRock = stdMat(basalt, '#4b5563', { repeat: [2, 6], roughness: 0.94 })

  const hill = mesh(
    new THREE.BoxGeometry(320, 45, 120),
    stdMat(grass, '#3f6212', { repeat: [32, 12], roughness: 0.98 }),
  )
  hill.position.set(20, 10, -95)
  parent.add(hill)
  const hillTop = mesh(new THREE.CylinderGeometry(35, 48, 28, 8), stdMat(grass, '#4d7c0f', { repeat: [4, 4] }))
  hillTop.position.set(15, 38, -88)
  parent.add(hillTop)

  const road = mesh(new THREE.BoxGeometry(340, 0.22, 14), stdMat(asphalt, '#374151', { repeat: [20, 1] }))
  road.position.set(30, 0.12, -42)
  parent.add(road)
  roadSign(parent, '北寧路 · 台2線', 10, 3.2, -38, 0.1)

  const westDike = mesh(new THREE.BoxGeometry(12, 2.8, 95), dikeRock)
  westDike.position.set(-72, 1.3, 5)
  parent.add(westDike)
  const innerQuay = mesh(new THREE.BoxGeometry(8, 1.8, 42), pierMat)
  innerQuay.position.set(-66, 0.85, -22)
  parent.add(innerQuay)

  const northBreak = mesh(new THREE.BoxGeometry(155, 2.6, 10), dikeMat)
  northBreak.position.set(-5, 1.1, 78)
  parent.add(northBreak)
  for (let x = -72; x <= 58; x += 2.5) {
    for (let row = 0; row < 2; row++) {
      tetrapod(parent, x, 72 + row * 1.5, 1.3)
    }
  }

  const eastBreak = mesh(new THREE.BoxGeometry(11, 3.2, 165), dikeRock)
  eastBreak.position.set(118, 1.4, 8)
  parent.add(eastBreak)
  for (let z = -70; z <= 70; z += 2.4) {
    tetrapod(parent, 112, z, 1.35)
    tetrapod(parent, 124, z + 0.8, 1.35)
  }
  const lighthouse = mesh(new THREE.CylinderGeometry(1.2, 1.6, 14, 10), stdMat(null, '#f8fafc'))
  lighthouse.position.set(118, 8.5, -62)
  parent.add(lighthouse)
  const lamp = mesh(
    new THREE.SphereGeometry(1.4, 16, 16),
    stdMat(null, '#fef08a', { emissive: '#ca8a04', emissiveIntensity: 1.1 }),
    false,
  )
  lamp.position.set(118, 16.2, -62)
  parent.add(lamp)
  lampPositions.push(new THREE.Vector3(118, 16, -62))

  const pierLen = 38
  const pierW = 6
  const pier = mesh(new THREE.BoxGeometry(pierW, 0.32, pierLen), pierMat)
  pier.position.set(-58, pierDeckY, 12)
  parent.add(pier)

  for (let z = -pierLen / 2 + 1; z <= pierLen / 2 - 1; z += 0.5) {
    const plank = mesh(new THREE.BoxGeometry(pierW - 0.35, 0.04, 0.09), stdMat(null, '#78716c'))
    plank.position.set(-58, pierDeckY + 0.2, 12 + z)
    parent.add(plank)
  }

  for (let z = -14; z <= 16; z += 7) {
    const post = mesh(
      new THREE.CylinderGeometry(0.065, 0.075, 1.05, 10),
      stdMat(null, '#374151', { metalness: 0.45 }),
    )
    post.position.set(-55.1, pierDeckY + 0.65, 12 + z)
    parent.add(post)
    lampPositions.push(new THREE.Vector3(-55, pierDeckY + 2.2, 12 + z))
  }
  const rail = mesh(new THREE.BoxGeometry(0.09, 0.09, pierLen - 1), stdMat(null, '#facc15'))
  rail.position.set(-55.05, pierDeckY + 1.05, 12)
  parent.add(rail)
  roadSign(parent, '八斗子漁港 · 突堤 · 夜釣', -54, pierDeckY + 2.4, 28, -0.35)
  addPierWetGleam(parent, -54.2, 0.06, 22, 28, 0)
  addPierWetGleam(parent, -52.5, 0.05, 12, 14, Math.PI / 2)

  const harborOffice = mesh(new THREE.BoxGeometry(14, 5.5, 10), stdMat(null, '#e7e5e4'))
  harborOffice.position.set(-52, 3.2, -8)
  parent.add(harborOffice)
  const officeRoof = mesh(new THREE.BoxGeometry(15, 0.35, 11), stdMat(null, '#57534e'))
  officeRoof.position.set(-52, 6.1, -8)
  parent.add(officeRoof)

  const fishMarket = mesh(new THREE.BoxGeometry(36, 7.5, 22), stdMat(null, '#94a3b8'))
  fishMarket.position.set(-48, 4.2, -52)
  parent.add(fishMarket)
  const fishRoof = mesh(new THREE.BoxGeometry(38, 0.5, 24), stdMat(null, '#475569'))
  fishRoof.position.set(-48, 8.2, -52)
  parent.add(fishRoof)

  const unionHall = mesh(new THREE.BoxGeometry(28, 12, 16), stdMat(null, '#cbd5e1'))
  unionHall.position.set(-18, 6.5, -58)
  parent.add(unionHall)

  const parking = mesh(new THREE.PlaneGeometry(55, 32), stdMat(asphalt, '#52525b', { repeat: [4, 3] }))
  parking.rotation.x = -Math.PI / 2
  parking.position.set(-5, 0.02, -58)
  parent.add(parking)

  const railway = mesh(new THREE.BoxGeometry(140, 0.15, 4.5), stdMat(null, '#64748b'))
  railway.position.set(95, 0.18, -41)
  parent.add(railway)
  for (let x = 40; x <= 150; x += 5) {
    const tie = mesh(new THREE.BoxGeometry(0.35, 0.12, 4.8), stdMat(null, '#44403c'))
    tie.position.set(x, 0.08, -41)
    parent.add(tie)
  }
  const station = mesh(new THREE.BoxGeometry(16, 4, 8), stdMat(null, '#e2e8f0'))
  station.position.set(118, 2.2, -41)
  parent.add(station)
  roadSign(parent, '海科館站', 118, 3.2, -34, -0.4)

  const nmmst = buildNmmstCampus()
  nmmst.position.set(175, 0, -28)
  nmmst.rotation.y = -Math.PI / 2 + 0.15
  parent.add(nmmst)

  const bisanzHint = mesh(new THREE.BoxGeometry(40, 6, 18), stdMat(null, '#a8a29e'))
  bisanzHint.position.set(-130, 3.5, -20)
  parent.add(bisanzHint)
  roadSign(parent, '碧砂漁港方向', -125, 3.2, -30, Math.PI / 2)
  roadSign(parent, '→ 潮境公園', -95, 3.2, -18, 0.35, 0.85)

  const spawnBoat = (x: number, z: number, len: number, rot: number) => {
    const boat = fishingBoat(len)
    boat.position.set(x, 0, z)
    boat.rotation.y = rot
    parent.add(boat)
    boats.push(boat)
  }
  spawnBoat(15, 25, 12, 0.05)
  spawnBoat(45, 40, 10.5, -0.35)
  spawnBoat(70, 5, 11, 0.25)
  spawnBoat(-15, 45, 9, 0.6)

  const pierFocus = new THREE.Vector3(-48, 0, 38)
  const sea = createSeaWater({
    width: 300,
    depth: 260,
    position: new THREE.Vector3(15, 0, 25),
    shoreCenter: pierFocus,
    foamRadius: 36,
    shallowColor: '#0f766e',
    deepColor: '#042f3a',
  })
  parent.add(sea.surface)
  const waterSurface = sea.surface

  const keelungIsle = mesh(new THREE.ConeGeometry(45, 28, 6), stdMat(null, '#334155', { roughness: 0.95 }))
  keelungIsle.position.set(-20, 6, 240)
  parent.add(keelungIsle)

  const deckTopY = pierDeckY + 0.16
  const shuaiPosition = new THREE.Vector3(-55.8, deckTopY, 17)
  const grandpaPosition = new THREE.Vector3(-56.2, deckTopY, 11)

  return {
    boats,
    waterSurface,
    pierFocus,
    shuaiPosition,
    grandpaPosition,
    pierDeckY,
    castDirection,
    lampPositions,
    seaWater: sea,
  }
}
