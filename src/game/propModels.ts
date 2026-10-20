import * as THREE from 'three'
import {
  hullPaintTexture,
  pebbleTexture,
  ropeTexture,
  stdMat,
  woodDeckTexture,
} from './sceneTextures.ts'
import { mesh } from './sceneUtils.ts'

/** 消波塊（四腳錐體） */
export function createTetrapod(scale = 1.35): THREE.Group {
  const g = new THREE.Group()
  const mat = stdMat(null, '#64748b', { roughness: 0.94, metalness: 0.08 })
  for (let i = 0; i < 4; i++) {
    const leg = mesh(new THREE.CylinderGeometry(0.11 * scale, 0.2 * scale, 1.05 * scale, 10), mat)
    leg.rotation.z = Math.PI / 2.35
    leg.rotation.y = (i / 4) * Math.PI * 2 + 0.12
    leg.position.y = 0.22 * scale
    g.add(leg)
  }
  const core = mesh(new THREE.CylinderGeometry(0.18 * scale, 0.24 * scale, 0.35 * scale, 10), mat)
  core.position.y = 0.38 * scale
  g.add(core)
  return g
}

/** 突堤系船柱 */
export function createMooringBollard(): THREE.Group {
  const g = new THREE.Group()
  const metal = stdMat(null, '#374151', { metalness: 0.72, roughness: 0.38 })
  const base = mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.18, 12), metal)
  base.position.y = 0.09
  g.add(base)
  const post = mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.55, 12), metal)
  post.position.y = 0.45
  g.add(post)
  const cap = mesh(new THREE.TorusGeometry(0.16, 0.045, 8, 16), metal)
  cap.rotation.x = Math.PI / 2
  cap.position.y = 0.72
  g.add(cap)
  return g
}

/** 繫泊浮標 */
export function createNavigationBuoy(color = '#ef4444'): THREE.Group {
  const g = new THREE.Group()
  const body = mesh(
    new THREE.CylinderGeometry(0.35, 0.42, 1.2, 14),
    stdMat(null, color, { roughness: 0.45, metalness: 0.15 }),
  )
  body.position.y = 0.55
  g.add(body)
  const top = mesh(new THREE.SphereGeometry(0.28, 12, 12), stdMat(null, '#f8fafc', { roughness: 0.35 }))
  top.position.y = 1.25
  g.add(top)
  const ring = mesh(new THREE.TorusGeometry(0.38, 0.04, 8, 20), stdMat(null, '#1e293b', { metalness: 0.6 }))
  ring.rotation.x = Math.PI / 2
  ring.position.y = 0.85
  g.add(ring)
  return g
}

/** 漁船（船殼弧線、艙室、欄杆、舷外機） */
export function createDetailedFishingBoat(length = 11): THREE.Group {
  const g = new THREE.Group()
  const beam = length * 0.32
  const hullTex = hullPaintTexture()
  const hullMat = stdMat(hullTex, '#b91c1c', { repeat: [3, 2], roughness: 0.62, metalness: 0.18 })
  const deckMat = stdMat(woodDeckTexture(), '#78350f', { repeat: [2, 4], roughness: 0.88 })

  const hull = mesh(new THREE.BoxGeometry(length * 0.82, 0.95, beam), hullMat)
  hull.position.set(length * 0.04, 0.42, 0)
  g.add(hull)

  const bow = mesh(
    new THREE.CylinderGeometry(beam * 0.48, beam * 0.52, length * 0.26, 12, 1, false, 0, Math.PI),
    hullMat,
  )
  bow.rotation.z = -Math.PI / 2
  bow.position.set(length * 0.46, 0.42, 0)
  g.add(bow)

  const stern = mesh(new THREE.BoxGeometry(length * 0.12, 0.7, beam * 0.92), hullMat)
  stern.position.set(-length * 0.38, 0.38, 0)
  g.add(stern)

  const deck = mesh(new THREE.BoxGeometry(length * 0.7, 0.06, beam * 0.88), deckMat)
  deck.position.set(length * 0.02, 0.88, 0)
  g.add(deck)

  const cabin = mesh(
    new THREE.BoxGeometry(length * 0.24, 1.65, beam * 0.68),
    stdMat(null, '#f1f5f9', { roughness: 0.48, metalness: 0.12 }),
  )
  cabin.position.set(-length * 0.16, 1.42, 0)
  g.add(cabin)
  const roof = mesh(new THREE.BoxGeometry(length * 0.26, 0.08, beam * 0.72), stdMat(null, '#cbd5e1'))
  roof.position.set(-length * 0.16, 2.28, 0)
  g.add(roof)

  for (const side of [-1, 1]) {
    const win = mesh(
      new THREE.PlaneGeometry(length * 0.08, 0.45),
      stdMat(null, '#0c4a6e', { roughness: 0.15, metalness: 0.35, emissive: '#075985', emissiveIntensity: 0.15 }),
      false,
    )
    win.position.set(-length * 0.16, 1.45, side * beam * 0.345)
    win.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2
    g.add(win)
  }

  const railMat = stdMat(null, '#cbd5e1', { metalness: 0.55, roughness: 0.35 })
  for (const side of [-1, 1]) {
    const rail = mesh(new THREE.CylinderGeometry(0.025, 0.025, length * 0.75, 6), railMat)
    rail.rotation.z = Math.PI / 2
    rail.position.set(length * 0.05, 1.05, side * beam * 0.46)
    g.add(rail)
  }

  const mast = mesh(new THREE.CylinderGeometry(0.055, 0.075, 3.1, 10), stdMat(null, '#78350f', { roughness: 0.85 }))
  mast.position.set(length * 0.08, 2.65, 0)
  g.add(mast)
  const yard = mesh(new THREE.CylinderGeometry(0.03, 0.03, beam * 1.1, 6), stdMat(null, '#57534e'))
  yard.rotation.z = Math.PI / 2
  yard.position.set(length * 0.08, 3.5, 0)
  g.add(yard)

  const outboard = mesh(
    new THREE.BoxGeometry(0.35, 0.55, 0.28),
    stdMat(null, '#1e293b', { metalness: 0.4, roughness: 0.5 }),
  )
  outboard.position.set(-length * 0.42, 0.55, 0)
  g.add(outboard)

  for (let i = 0; i < 3; i++) {
    const fender = mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.55, 10), stdMat(null, '#0f172a', { roughness: 0.7 }))
    fender.position.set(length * (0.1 + i * 0.12), 0.55, beam * 0.48)
    g.add(fender)
  }

  const ropeMat = stdMat(ropeTexture(), '#d6d3d1', { repeat: [4, 1], roughness: 0.95 })
  const coil = mesh(new THREE.TorusGeometry(0.22, 0.05, 8, 18), ropeMat)
  coil.rotation.x = Math.PI / 2
  coil.position.set(-length * 0.05, 0.92, beam * 0.25)
  g.add(coil)

  const lamp = mesh(
    new THREE.SphereGeometry(0.11, 10, 10),
    new THREE.MeshBasicMaterial({ color: '#fef08a' }),
    false,
  )
  lamp.position.set(-length * 0.18, 1.62, beam * 0.36)
  g.add(lamp)
  const boatLight = new THREE.PointLight('#fde68a', 1.4, 14, 1.4)
  boatLight.position.copy(lamp.position)
  g.add(boatLight)
  g.userData.boatLight = boatLight

  return g
}

/** 燈塔（塔身、紅白帶、燈室、欄杆） */
export function createLighthouse(opts: { height?: number; redBand?: boolean } = {}): THREE.Group {
  const h = opts.height ?? 14
  const g = new THREE.Group()
  const wall = stdMat(null, '#f8fafc', { roughness: 0.42, metalness: 0.08 })
  const tower = mesh(new THREE.CylinderGeometry(1.15, 1.65, h, 14), wall)
  tower.position.y = h / 2
  g.add(tower)

  if (opts.redBand) {
    const band = mesh(new THREE.CylinderGeometry(1.22, 1.22, 1.15, 14), stdMat(null, '#dc2626', { roughness: 0.55 }))
    band.position.y = h * 0.72
    g.add(band)
  }

  const gallery = mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.35, 14), stdMat(null, '#64748b', { metalness: 0.5 }))
  gallery.position.y = h + 0.15
  g.add(gallery)

  const lantern = mesh(
    new THREE.CylinderGeometry(1.05, 1.05, 1.4, 14),
    stdMat(null, '#fef08a', { emissive: '#fbbf24', emissiveIntensity: 1.35, roughness: 0.2 }),
    false,
  )
  lantern.position.y = h + 1.05
  g.add(lantern)

  const roof = mesh(new THREE.ConeGeometry(1.25, 0.9, 14), stdMat(null, '#334155', { metalness: 0.35 }))
  roof.position.y = h + 1.95
  g.add(roof)

  return g
}

/** 碼頭釣具：桶、椅、竿架 */
export function addPierFishingKit(
  parent: THREE.Object3D,
  x: number,
  deckY: number,
  z: number,
): void {
  const bucket = mesh(
    new THREE.CylinderGeometry(0.18, 0.15, 0.28, 12),
    stdMat(null, '#ca8a04', { roughness: 0.55 }),
  )
  bucket.position.set(x + 0.35, deckY + 0.14, z + 0.25)
  parent.add(bucket)

  const stool = mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.08, 12), stdMat(null, '#57534e'))
  stool.position.set(x - 0.4, deckY + 0.04, z - 0.2)
  parent.add(stool)

  const rodRest = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), stdMat(null, '#292524'))
  rodRest.rotation.z = 0.35
  rodRest.position.set(x + 0.15, deckY + 0.45, z)
  parent.add(rodRest)
}

/** 礫石岸（instanced 卵石） */
export function scatterPebbles(
  parent: THREE.Object3D,
  cx: number,
  cz: number,
  width: number,
  depth: number,
  count = 140,
): void {
  const geo = new THREE.DodecahedronGeometry(0.12, 0)
  const mat = stdMat(pebbleTexture(), '#78716c', { repeat: [1, 1], roughness: 0.92 })
  const im = new THREE.InstancedMesh(geo, mat, count)
  const dummy = new THREE.Object3D()
  for (let i = 0; i < count; i++) {
    const s = 0.6 + Math.random() * 1.1
    dummy.position.set(
      cx + (Math.random() - 0.5) * width,
      0.08 + Math.random() * 0.12,
      cz + (Math.random() - 0.5) * depth,
    )
    dummy.rotation.set(Math.random(), Math.random(), Math.random())
    dummy.scale.setScalar(s)
    dummy.updateMatrix()
    im.setMatrixAt(i, dummy.matrix)
  }
  im.instanceMatrix.needsUpdate = true
  im.castShadow = true
  im.receiveShadow = true
  parent.add(im)
}

/** 基隆嶼之窗（裝置藝術框） */
export function createKeelungWindowSculpture(): THREE.Group {
  const g = new THREE.Group()
  const frame = stdMat(null, '#f8fafc', { metalness: 0.35, roughness: 0.45 })
  const left = mesh(new THREE.BoxGeometry(0.35, 8, 0.35), frame)
  left.position.set(-3.5, 4, 0)
  g.add(left)
  const right = left.clone()
  right.position.x = 3.5
  g.add(right)
  const top = mesh(new THREE.BoxGeometry(7.2, 0.35, 0.35), frame)
  top.position.y = 8
  g.add(top)
  const sill = mesh(new THREE.BoxGeometry(7.2, 0.25, 0.5), frame)
  g.add(sill)

  const view = mesh(
    new THREE.PlaneGeometry(6.5, 7.2),
    stdMat(null, '#38bdf8', { roughness: 0.2, metalness: 0.1, emissive: '#0ea5e9', emissiveIntensity: 0.12 }),
    false,
  )
  view.position.set(0, 4, -0.05)
  g.add(view)
  return g
}
