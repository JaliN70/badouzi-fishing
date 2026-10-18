import * as THREE from 'three'

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

/** 不受場景光照影響，夜釣也清楚看見 */
function charBasic(color: string): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color })
}

/** 阿公：坐高約 1.05m，總高約 1.55m */
export function buildGrandpaCharacter(): THREE.Group {
  const g = new THREE.Group()
  const skin = charBasic('#fecaca')
  const cloth = charBasic('#78716c')

  const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.08, 12), cloth)
  stool.position.y = 0.04
  g.add(stool)

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.34), cloth)
  torso.position.y = 0.38
  g.add(torso)

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 20), skin)
  head.position.y = 0.72
  g.add(head)

  const bucket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.13, 0.22, 14),
    charBasic('#ca8a04'),
  )
  bucket.position.set(0.32, 0.12, 0.22)
  g.add(bucket)

  const tag = labelSprite('阿公', '#fde68a')
  tag.position.y = 1.05
  g.add(tag)

  addCharacterMarker(g, '#fbbf24')
  return g
}

/** 帥帥：身高約 1.32m（孩童） */
export function buildShuaiShuaiCharacter(): THREE.Group {
  const g = new THREE.Group()
  const skin = charBasic('#fde68a')
  const shirt = charBasic('#3b82f6')
  const vest = charBasic('#fcd34d')

  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.14), shirt)
  legL.position.set(-0.08, 0.21, 0)
  const legR = legL.clone()
  legR.position.x = 0.08
  g.add(legL, legR)

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 0.2), shirt)
  torso.position.y = 0.62
  g.add(torso)

  const vestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.22), vest)
  vestMesh.position.y = 0.7
  g.add(vestMesh)

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 20), skin)
  head.position.y = 0.92
  g.add(head)

  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.1, 4), charBasic('#fb923c'))
  hat.position.y = 1.05
  hat.rotation.y = Math.PI / 4
  g.add(hat)

  const rod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.018, 3.4, 10),
    charBasic('#292524'),
  )
  rod.position.set(0.06, 0.95, 0.22)
  rod.rotation.x = -0.48
  rod.rotation.y = 0.06
  g.add(rod)

  const reel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.05, 12),
    charBasic('#94a3b8'),
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
