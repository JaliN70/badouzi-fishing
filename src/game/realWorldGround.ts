import * as THREE from 'three'

/** 八斗子漁港中心（Wikipedia / 漁業署參考） */
export const BADOUZI_HARBOR = { lat: 25.14444, lon: 121.78972 }
/** 國立海洋科技博物館區域 */
export const NMMST = { lat: 25.1419, lon: 121.796 }

const TILE_SIZE = 256
const ESRI_TILE =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

export interface RealGroundResult {
  mesh: THREE.Mesh
  metersPerUnit: number
  centerWorld: THREE.Vector3
}

function latLonToTileXY(lat: number, lon: number, zoom: number): { x: number; y: number } {
  const n = 2 ** zoom
  const x = Math.floor(((lon + 180) / 360) * n)
  const latRad = (lat * Math.PI) / 180
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n)
  return { x, y }
}

function tileXYToLon(x: number, z: number): number {
  const n = 2 ** z
  return (x / n) * 360 - 180
}

function tileXYToLat(y: number, z: number): number {
  const n = 2 ** z
  const rad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)))
  return (rad * 180) / Math.PI
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`無法載入影像：${url}`))
    img.src = url
  })
}

async function fetchTile(z: number, x: number, y: number): Promise<HTMLImageElement | null> {
  const url = ESRI_TILE.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y))
  try {
    return await loadImage(url)
  } catch {
    return null
  }
}

/**
 * 以 Esri 世界衛星圖（僅供遊戲場景參考）拼貼八斗子附近地形。
 * 1 單位 ≈ metersPerUnit 公尺。
 */
export async function createRealWorldGround(
  centerLat: number,
  centerLon: number,
  zoom = 17,
  tileRadius = 2,
): Promise<RealGroundResult> {
  const metersPerUnit = 8
  const { x: cx, y: cy } = latLonToTileXY(centerLat, centerLon, zoom)
  const side = tileRadius * 2 + 1
  const canvas = document.createElement('canvas')
  canvas.width = side * TILE_SIZE
  canvas.height = side * TILE_SIZE
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#1e293b'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const tasks: Promise<void>[] = []
  for (let dy = -tileRadius; dy <= tileRadius; dy++) {
    for (let dx = -tileRadius; dx <= tileRadius; dx++) {
      const tx = cx + dx
      const ty = cy + dy
      const px = (dx + tileRadius) * TILE_SIZE
      const py = (dy + tileRadius) * TILE_SIZE
      tasks.push(
        fetchTile(zoom, tx, ty).then((img) => {
          if (img) ctx.drawImage(img, px, py, TILE_SIZE, TILE_SIZE)
        }),
      )
    }
  }
  await Promise.all(tasks)

  const lonWest = tileXYToLon(cx - tileRadius, zoom)
  const lonEast = tileXYToLon(cx + tileRadius + 1, zoom)
  const latNorth = tileXYToLat(cy - tileRadius, zoom)
  const latSouth = tileXYToLat(cy + tileRadius + 1, zoom)

  const widthM = (lonEast - lonWest) * 111320 * Math.cos((centerLat * Math.PI) / 180)
  const heightM = (latNorth - latSouth) * 111320

  const worldW = widthM / metersPerUnit
  const worldH = heightM / metersPerUnit

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter

  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.95,
    metalness: 0.02,
  })
  const geo = new THREE.PlaneGeometry(worldW, worldH)
  geo.rotateX(-Math.PI / 2)
  const mesh = new THREE.Mesh(geo, mat)
  mesh.receiveShadow = true

  const centerLonOffset = centerLon - (lonWest + lonEast) / 2
  const centerLatOffset = centerLat - (latSouth + latNorth) / 2
  const offsetX = (centerLonOffset * 111320 * Math.cos((centerLat * Math.PI) / 180)) / metersPerUnit
  const offsetZ = (-centerLatOffset * 111320) / metersPerUnit
  mesh.position.set(-offsetX, 0.01, offsetZ)

  return {
    mesh,
    metersPerUnit,
    centerWorld: new THREE.Vector3(0, 0, 0),
  }
}

export function latLonToWorld(
  lat: number,
  lon: number,
  origin: { lat: number; lon: number },
  metersPerUnit: number,
): THREE.Vector3 {
  const dx =
    (lon - origin.lon) * 111320 * Math.cos((origin.lat * Math.PI) / 180)
  const dz = -(lat - origin.lat) * 111320
  return new THREE.Vector3(dx / metersPerUnit, 0, dz / metersPerUnit)
}

export async function loadPhotoBillboard(
  url: string,
  width: number,
  height: number,
): Promise<THREE.Mesh> {
  const tex = await new THREE.TextureLoader().loadAsync(url)
  tex.colorSpace = THREE.SRGBColorSpace
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat)
  return mesh
}
