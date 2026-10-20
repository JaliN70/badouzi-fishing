import * as THREE from 'three'
import type { HarborLayout } from './harborLayout.ts'
import {
  asphaltTexture,
  basaltRockTexture,
  brickPathTexture,
  glassMat,
  grassTexture,
  roofTileTexture,
  steelTexture,
  stdMat,
  woodDeckTexture,
} from './sceneTextures.ts'
import { createSeaWater } from './seaWater.ts'
import { bannerSign, mesh, roadSign } from './sceneUtils.ts'

function lampPost(
  parent: THREE.Object3D,
  x: number,
  z: number,
  lamps: THREE.Vector3[],
  h = 5.5,
): void {
  const pole = mesh(
    new THREE.CylinderGeometry(0.08, 0.1, h, 10),
    stdMat(steelTexture(), '#64748b', { metalness: 0.55, roughness: 0.35 }),
  )
  pole.position.set(x, h / 2, z)
  parent.add(pole)
  const head = mesh(
    new THREE.SphereGeometry(0.22, 12, 12),
    stdMat(null, '#fef9c3', { emissive: '#fde047', emissiveIntensity: 1.2 }),
    false,
  )
  head.position.set(x, h + 0.15, z)
  parent.add(head)
  lamps.push(new THREE.Vector3(x, h + 0.2, z))
}

/**
 * 潮境公園（基隆）實比例簡化：
 * - 海濱草地、磚道、遊客中心
 * - 「海與空」玻璃長廊（懸挑）
 * - 潮境燈塔、深澳線海科館站外觀
 * - 礫石岸釣魚平台（北向面海）
 */
export function buildChaojingPark(parent: THREE.Object3D): HarborLayout {
  const boats: THREE.Group[] = []
  const lampPositions: THREE.Vector3[] = []
  const pierDeckY = 1.35
  const castDirection = new THREE.Vector3(0.04, 0, 0.999).normalize()

  const grass = grassTexture()
  const basalt = basaltRockTexture()
  const wood = woodDeckTexture()
  const brick = brickPathTexture()
  const steel = steelTexture()
  const asphalt = asphaltTexture()

  const lawn = mesh(
    new THREE.BoxGeometry(220, 0.4, 130),
    stdMat(grass, '#4d7c0f', { repeat: [28, 16], roughness: 0.95 }),
  )
  lawn.position.set(35, 0.15, -55)
  parent.add(lawn)

  const pathMain = mesh(
    new THREE.BoxGeometry(140, 0.12, 6),
    stdMat(brick, '#a8a29e', { repeat: [18, 1], roughness: 0.88 }),
  )
  pathMain.position.set(25, 0.38, -28)
  parent.add(pathMain)

  const pathToCoast = mesh(
    new THREE.BoxGeometry(5, 0.12, 55),
    stdMat(brick, '#a8a29e', { repeat: [1, 10], roughness: 0.88 }),
  )
  pathToCoast.position.set(-8, 0.38, -5)
  parent.add(pathToCoast)

  bannerSign(parent, '潮境公園', 'Chao-Jing Park', 18, 5.5, -42, 0.15)
  roadSign(parent, '基隆市 · 中正區', 22, 3.2, -38, -0.2, 0.9)

  const visitor = mesh(new THREE.BoxGeometry(32, 8, 18), stdMat(null, '#f5f5f4', { roughness: 0.55 }))
  visitor.position.set(55, 4.2, -62)
  parent.add(visitor)
  const visitorRoof = mesh(
    new THREE.BoxGeometry(34, 0.6, 20),
    stdMat(roofTileTexture(), '#57534e', { repeat: [6, 2], roughness: 0.75 }),
  )
  visitorRoof.position.set(55, 8.6, -62)
  parent.add(visitorRoof)
  roadSign(parent, '遊客中心', 55, 6.8, -52, Math.PI, 0.75)

  const station = mesh(new THREE.BoxGeometry(22, 5, 10), stdMat(null, '#e7e5e4'))
  station.position.set(88, 2.8, -58)
  parent.add(station)
  const stationRoof = mesh(new THREE.BoxGeometry(24, 0.35, 12), stdMat(steel, '#64748b', { metalness: 0.4 }))
  stationRoof.position.set(88, 5.4, -58)
  parent.add(stationRoof)
  roadSign(parent, '海科館站 · 深澳線', 88, 4.2, -52, Math.PI, 0.85)

  const cliff = mesh(
    new THREE.BoxGeometry(95, 14, 22),
    stdMat(basalt, '#1f2937', { repeat: [12, 2], roughness: 0.92 }),
  )
  cliff.position.set(-18, 6, -28)
  parent.add(cliff)
  const cliffFace = mesh(
    new THREE.BoxGeometry(95, 16, 4),
    stdMat(basalt, '#111827', { repeat: [14, 1], roughness: 0.95 }),
  )
  cliffFace.position.set(-18, 5, -16)
  parent.add(cliffFace)

  const skywalk = new THREE.Group()
  for (let seg = 0; seg < 8; seg++) {
    const frame = mesh(
      new THREE.BoxGeometry(11, 0.45, 1.2),
      stdMat(steel, '#475569', { metalness: 0.65, roughness: 0.28 }),
    )
    frame.position.set(seg * 11.5, 0, 0)
    skywalk.add(frame)
    const glass = mesh(new THREE.BoxGeometry(10.6, 0.12, 3.8), glassMat(), false, true)
    glass.position.set(seg * 11.5, -0.15, 1.8)
    skywalk.add(glass)
    const railL = mesh(new THREE.BoxGeometry(11, 1.05, 0.08), stdMat(steel, '#334155', { metalness: 0.5 }))
    railL.position.set(seg * 11.5, 0.55, 3.85)
    skywalk.add(railL)
  }
  skywalk.position.set(5, 11.5, 18)
  skywalk.rotation.y = 0.08
  parent.add(skywalk)
  bannerSign(parent, '海與空 · 玻璃長廊', 'Skywalk', 48, 14.5, 22, 0.05)

  for (let x = 0; x <= 80; x += 16) {
    lampPost(parent, x, 14, lampPositions, 6)
  }

  const lighthouse = mesh(
    new THREE.CylinderGeometry(1.4, 2, 16, 12),
    stdMat(null, '#f8fafc', { roughness: 0.4 }),
  )
  lighthouse.position.set(108, 8.5, 8)
  parent.add(lighthouse)
  const lhBand = mesh(new THREE.CylinderGeometry(1.55, 1.55, 1.2, 12), stdMat(null, '#dc2626'))
  lhBand.position.set(108, 12, 8)
  parent.add(lhBand)
  const lhLamp = mesh(
    new THREE.SphereGeometry(1.6, 16, 16),
    stdMat(null, '#fef08a', { emissive: '#fbbf24', emissiveIntensity: 1.4 }),
    false,
  )
  lhLamp.position.set(108, 17.2, 8)
  parent.add(lhLamp)
  lampPositions.push(new THREE.Vector3(108, 17, 8))
  roadSign(parent, '潮境燈塔', 108, 6.5, 14, -0.5, 0.8)

  const deckX = 24
  const deckZ = 32
  const fishDeckLen = 26
  const fishDeck = mesh(
    new THREE.BoxGeometry(7.5, 0.35, fishDeckLen),
    stdMat(wood, '#92400e', { repeat: [2, 10], roughness: 0.82 }),
  )
  fishDeck.position.set(deckX, pierDeckY, deckZ)
  parent.add(fishDeck)
  for (let z = -fishDeckLen / 2 + 1; z < fishDeckLen / 2; z += 0.55) {
    const plank = mesh(new THREE.BoxGeometry(7, 0.05, 0.1), stdMat(wood, '#78350f', { repeat: [1, 1] }))
    plank.position.set(deckX, pierDeckY + 0.22, deckZ + z)
    parent.add(plank)
  }
  const rail = mesh(new THREE.BoxGeometry(0.1, 1, fishDeckLen - 0.5), stdMat(null, '#facc15'))
  rail.position.set(deckX + 3.55, pierDeckY + 0.85, deckZ)
  parent.add(rail)
  roadSign(parent, '釣魚平台 · 夜釣區', deckX + 1, pierDeckY + 2.6, deckZ + 10, -0.15, 0.85)

  const pathToDeck = mesh(
    new THREE.BoxGeometry(4.5, 0.12, 38),
    stdMat(brick, '#a8a29e', { repeat: [1, 7], roughness: 0.88 }),
  )
  pathToDeck.position.set(20, 0.38, 12)
  parent.add(pathToDeck)

  const rockShore = mesh(
    new THREE.BoxGeometry(45, 3, 35),
    stdMat(basalt, '#374151', { repeat: [5, 3], roughness: 0.96 }),
  )
  rockShore.position.set(-42, 0.35, 36)
  parent.add(rockShore)

  const parking = mesh(
    new THREE.PlaneGeometry(48, 28),
    stdMat(asphalt, '#44403c', { repeat: [5, 3] }),
  )
  parking.rotation.x = -Math.PI / 2
  parking.position.set(70, 0.02, -78)
  parent.add(parking)

  lampPost(parent, deckX, deckZ + 8, lampPositions)
  lampPost(parent, deckX, deckZ, lampPositions)
  lampPost(parent, deckX, deckZ - 7, lampPositions)

  const spawnBoat = (x: number, z: number, len: number, rot: number) => {
    const g = new THREE.Group()
    g.add(
      mesh(
        new THREE.BoxGeometry(len * 0.85, 1, len * 0.28),
        stdMat(null, '#1e3a5f', { roughness: 0.6 }),
      ).translateY(0.4),
    )
    g.position.set(x, 0, z)
    g.rotation.y = rot
    parent.add(g)
    boats.push(g)
  }
  spawnBoat(25, 48, 10, 0.2)
  spawnBoat(55, 62, 8, -0.15)

  const pierFocus = new THREE.Vector3(deckX + 4, 0, deckZ + 40)
  const sea = createSeaWater({
    width: 280,
    depth: 240,
    position: new THREE.Vector3(20, 0, 45),
    shoreCenter: pierFocus,
    foamRadius: 34,
    shallowColor: '#0d9488',
    deepColor: '#022c32',
  })
  parent.add(sea.surface)
  const waterSurface = sea.surface

  const distantHill = mesh(new THREE.ConeGeometry(55, 35, 8), stdMat(null, '#1e293b', { roughness: 0.98 }))
  distantHill.position.set(-30, 12, 200)
  parent.add(distantHill)

  const deckTopY = pierDeckY + 0.18
  const shuaiPosition = new THREE.Vector3(deckX - 0.6, deckTopY, deckZ + 5)
  const grandpaPosition = new THREE.Vector3(deckX - 0.6, deckTopY, deckZ - 2)
  return {
    boats,
    waterSurface,
    pierFocus,
    shuaiPosition,
    grandpaPosition,
    pierDeckY,
    castDirection,
    lampPositions,
    updateSea: sea.setTime,
  }
}
