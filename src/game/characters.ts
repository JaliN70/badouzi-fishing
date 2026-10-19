import * as THREE from 'three'
import {
  charTexMat,
  grandpaArmTexture,
  grandpaPantTexture,
  shuaiForearmTexture,
  shuaiHandTexture,
  shuaiPantLegTexture,
  shuaiUpperArmTexture,
  shuaiVestTexture,
  skinHeadTexture,
} from './characterTextures.ts'

function labelSprite(text: string, color: string): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)'
  ctx.roundRect(6, 10, 244, 44, 14)
  ctx.fill()
  ctx.strokeStyle = '#fbbf24'
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.fillStyle = color
  ctx.font = 'bold 32px "PingFang TC", "Noto Sans TC", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 128, 32)
  const tex = new THREE.CanvasTexture(canvas)
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
  const sprite = new THREE.Sprite(mat)
  sprite.renderOrder = 999
  sprite.scale.set(1.45, 0.42, 1)
  return sprite
}

function limbBox(
  w: number,
  h: number,
  d: number,
  mat: THREE.MeshBasicMaterial,
): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
}

/** 阿公：坐高約 1.05m，總高約 1.55m */
export function buildGrandpaCharacter(): THREE.Group {
  const g = new THREE.Group()
  const cloth = charTexMat(
    limbCanvasSolid('#78716c'),
  )
  const pantTex = grandpaPantTexture()
  const armTex = grandpaArmTexture()
  const headTex = skinHeadTexture('#fecaca', '#78716c')

  const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.08, 12), cloth)
  stool.position.y = 0.04
  g.add(stool)

  const torso = limbBox(0.42, 0.48, 0.34, cloth)
  torso.position.y = 0.38
  g.add(torso)

  const legL = limbBox(0.16, 0.28, 0.16, charTexMat(pantTex))
  legL.position.set(-0.12, 0.18, 0.12)
  legL.rotation.x = 0.55
  const legR = legL.clone()
  legR.position.x = 0.12
  g.add(legL, legR)

  const armL = limbBox(0.12, 0.36, 0.12, charTexMat(armTex))
  armL.position.set(-0.28, 0.42, 0.08)
  armL.rotation.set(0.4, 0, 0.35)
  const armR = limbBox(0.12, 0.34, 0.12, charTexMat(armTex))
  armR.position.set(0.26, 0.44, 0.18)
  armR.rotation.set(-0.25, -0.15, -0.45)
  g.add(armL, armR)

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 24), charTexMat(headTex))
  head.position.y = 0.72
  g.add(head)

  const bucket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.13, 0.22, 14),
    charTexMat(limbCanvasSolid('#ca8a04')),
  )
  bucket.position.set(0.32, 0.12, 0.22)
  g.add(bucket)

  const tag = labelSprite('阿公', '#fde68a')
  tag.position.y = 1.05
  g.add(tag)

  addCharacterMarker(g, '#fbbf24')
  return g
}

function limbCanvasSolid(color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 8
  canvas.height = 8
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 8, 8)
  return new THREE.CanvasTexture(canvas)
}

/** 帥帥：身高約 1.32m（孩童）— 四肢分段 + 貼圖 */
export function buildShuaiShuaiCharacter(): THREE.Group {
  const g = new THREE.Group()
  const pantTex = shuaiPantLegTexture()
  const upperArmTex = shuaiUpperArmTexture()
  const foreTex = shuaiForearmTexture()
  const handTex = shuaiHandTexture()
  const vestTex = shuaiVestTexture()
  const headTex = skinHeadTexture('#fde68a', '#1e293b')
  const shirtSolid = charTexMat(limbCanvasSolid('#3b82f6'))

  const addLeg = (x: number): void => {
    const upper = limbBox(0.15, 0.38, 0.15, charTexMat(pantTex))
    upper.position.set(x, 0.35, 0)
    const lower = limbBox(0.14, 0.32, 0.14, charTexMat(pantTex))
    lower.position.set(x, 0.08, 0.02)
    g.add(upper, lower)
  }
  addLeg(-0.09)
  addLeg(0.09)

  const torso = limbBox(0.32, 0.36, 0.2, shirtSolid)
  torso.position.y = 0.62
  g.add(torso)

  const vestMesh = limbBox(0.34, 0.16, 0.22, charTexMat(vestTex))
  vestMesh.position.y = 0.7
  g.add(vestMesh)

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 24), charTexMat(headTex))
  head.position.y = 0.92
  g.add(head)

  const hat = new THREE.Mesh(
    new THREE.ConeGeometry(0.13, 0.1, 4),
    charTexMat(limbCanvasSolid('#fb923c')),
  )
  hat.position.y = 1.05
  hat.rotation.y = Math.PI / 4
  g.add(hat)

  const addArm = (side: 1 | -1): void => {
    const sx = side * 0.22
    const upper = limbBox(0.11, 0.28, 0.11, charTexMat(upperArmTex))
    upper.position.set(sx, 0.68, 0)
    upper.rotation.z = side * 0.35
    const fore = limbBox(0.1, 0.26, 0.1, charTexMat(foreTex))
    fore.position.set(sx + side * 0.06, 0.5, 0.04)
    fore.rotation.z = side * 0.55
    const hand = limbBox(0.09, 0.1, 0.06, charTexMat(handTex))
    hand.position.set(sx + side * 0.1, 0.38, 0.06)
    hand.rotation.z = side * 0.4
    g.add(upper, fore, hand)
  }
  addArm(-1)
  addArm(1)

  const rod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.018, 3.4, 10),
    charTexMat(limbCanvasSolid('#292524')),
  )
  rod.position.set(0.06, 0.95, 0.22)
  rod.rotation.x = -0.48
  rod.rotation.y = 0.06
  g.add(rod)

  const reel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.05, 12),
    charTexMat(limbCanvasSolid('#94a3b8')),
  )
  reel.rotation.z = Math.PI / 2
  reel.position.set(0.02, 0.82, 0.22)
  g.add(reel)

  const tag = labelSprite('帥帥', '#bfdbfe')
  tag.position.y = 1.35
  g.add(tag)

  addCharacterMarker(g, '#38bdf8')
  return g
}

function addCharacterMarker(group: THREE.Group, color: string): void {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.38, 0.58, 32),
    new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, depthTest: false }),
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.04
  ring.renderOrder = 998
  group.add(ring)
}

/** 掛在角色身上的小補光（隨人物移動） */
export function attachCharacterLights(group: THREE.Group): void {
  const key = new THREE.PointLight('#fff7ed', 4, 10, 1.2)
  key.position.set(0.35, 1, 0.85)
  group.add(key)
}

/** 本地座標：竿尖（帥帥面向 +Z／外海時） */
export const SHUAI_ROD_TIP = new THREE.Vector3(0.1, 1.04, 1.62)
