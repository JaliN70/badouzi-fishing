import * as THREE from 'three'
import { BADOUZI_HARBOR, NMMST, latLonToWorld } from './realWorldGround.ts'
import { stdMat } from './sceneTextures.ts'

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

export interface HarborBuildResult {
  boats: THREE.Group[]
  waterSurface: THREE.Mesh
  pierFocus: THREE.Vector3
  shuaiPosition: THREE.Vector3
  grandpaPosition: THREE.Vector3
}

/** 在衛星底圖上疊加釣魚玩法與地標（幾何對齊八斗子漁港／海科館） */
export async function buildRealWorldOverlay(
  scene: THREE.Scene,
  metersPerUnit: number,
): Promise<HarborBuildResult> {
  const boats: THREE.Group[] = []
  const origin = BADOUZI_HARBOR

  const pierFocus = latLonToWorld(25.14435, 121.7891, origin, metersPerUnit)
  const shuaiPosition = latLonToWorld(25.14428, 121.78885, origin, metersPerUnit)
  const grandpaPosition = latLonToWorld(25.14432, 121.78895, origin, metersPerUnit)

  const pier = mesh(
    new THREE.BoxGeometry(5.5, 0.25, 14),
    stdMat(null, '#cbd5e1', { roughness: 0.88, metalness: 0.08 }),
  )
  pier.position.set(shuaiPosition.x - 0.4, 0.14, shuaiPosition.z)
  scene.add(pier)

  for (let i = -6; i <= 6; i += 2) {
    const rail = mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 0.7, 8),
      stdMat(null, '#facc15', { metalness: 0.35, roughness: 0.5 }),
    )
    rail.position.set(pier.position.x + 2.4, 0.45, pier.position.z + i * 0.55)
    scene.add(rail)
  }

  const museumPos = latLonToWorld(NMMST.lat, NMMST.lon, origin, metersPerUnit)
  const museumPlate = mesh(
    new THREE.PlaneGeometry(10, 2.2),
    new THREE.MeshStandardMaterial({
      color: '#0c4a6e',
      emissive: '#0369a1',
      emissiveIntensity: 0.35,
      roughness: 0.4,
    }),
    false,
    true,
  )
  museumPlate.position.set(museumPos.x, 3.5, museumPos.z)
  museumPlate.rotation.y = -0.6
  scene.add(museumPlate)

  const marker = mesh(
    new THREE.ConeGeometry(0.35, 0.9, 4),
    stdMat(null, '#ef4444', { emissive: '#7f1d1d', emissiveIntensity: 0.3 }),
  )
  marker.position.set(pierFocus.x, 0.55, pierFocus.z)
  scene.add(marker)

  const spawnBoat = (lat: number, lon: number, color: string) => {
    const p = latLonToWorld(lat, lon, origin, metersPerUnit)
    const g = new THREE.Group()
    const hull = mesh(
      new THREE.BoxGeometry(2.6, 0.45, 1.05),
      stdMat(null, color, { roughness: 0.55, metalness: 0.15 }),
    )
    hull.position.y = 0.22
    g.add(hull)
    g.position.set(p.x, 0.08, p.z)
    g.rotation.y = 0.35
    scene.add(g)
    boats.push(g)
  }

  spawnBoat(25.1448, 121.7925, '#b91c1c')
  spawnBoat(25.1452, 121.794, '#1d4ed8')
  spawnBoat(25.1439, 121.7915, '#047857')

  const waterGeo = new THREE.PlaneGeometry(55, 42, 64, 48)
  waterGeo.rotateX(-Math.PI / 2)
  const waterMat = new THREE.MeshStandardMaterial({
    color: '#0891b2',
    emissive: '#0e7490',
    emissiveIntensity: 0.08,
    roughness: 0.08,
    metalness: 0.65,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  })
  const waterSurface = mesh(waterGeo, waterMat, false, true)
  const seaCenter = latLonToWorld(25.1445, 121.7945, origin, metersPerUnit)
  waterSurface.position.set(seaCenter.x, 0.06, seaCenter.z)
  scene.add(waterSurface)

  return { boats, waterSurface, pierFocus, shuaiPosition, grandpaPosition }
}
