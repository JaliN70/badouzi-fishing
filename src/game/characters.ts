import * as THREE from 'three'

function labelSprite(text: string, color: string): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.roundRect(6, 10, 244, 44, 14)
  ctx.fill()
  ctx.strokeStyle = 'rgba(253, 230, 138, 0.85)'
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.fillStyle = color
  ctx.font = 'bold 30px "PingFang TC", "Noto Sans TC", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 128, 32)
  const tex = new THREE.CanvasTexture(canvas)
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.set(1.25, 0.38, 1)
  return sprite
}

/** 夜釣場景：略提高底色 + emissive，避免人物融入暗部 */
function charMat(color: string, emissiveIntensity = 0.42): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.62,
    metalness: 0.02,
    emissive: new THREE.Color(color),
    emissiveIntensity,
  })
}

/** 阿公：坐高約 1.05m，總高約 1.55m */
export function buildGrandpaCharacter(): THREE.Group {
  const g = new THREE.Group()
  const skin = charMat('#fecaca', 0.48)
  const cloth = charMat('#78716c', 0.38)

  const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.08, 12), cloth)
  stool.position.y = 0.04
  g.add(stool)

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.34), cloth)
  torso.position.y = 0.38
  torso.castShadow = true
  g.add(torso)

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 20), skin)
  head.position.y = 0.72
  head.castShadow = true
  g.add(head)

  const bucket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.13, 0.22, 14),
    charMat('#ca8a04', 0.35),
  )
  bucket.position.set(0.32, 0.12, 0.22)
  g.add(bucket)

  const tag = labelSprite('阿公', '#fde68a')
  tag.position.y = 0.95
  g.add(tag)
  return g
}

/** 帥帥：身高約 1.32m（孩童） */
export function buildShuaiShuaiCharacter(): THREE.Group {
  const g = new THREE.Group()
  const skin = charMat('#fde68a', 0.5)
  const shirt = charMat('#3b82f6', 0.4)
  const vest = charMat('#fcd34d', 0.45)

  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.14), shirt)
  legL.position.set(-0.08, 0.21, 0)
  const legR = legL.clone()
  legR.position.x = 0.08
  g.add(legL, legR)

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 0.2), shirt)
  torso.position.y = 0.62
  torso.castShadow = true
  g.add(torso)

  const vestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.22), vest)
  vestMesh.position.y = 0.7
  g.add(vestMesh)

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 20), skin)
  head.position.y = 0.92
  head.castShadow = true
  g.add(head)

  const hat = new THREE.Mesh(
    new THREE.ConeGeometry(0.13, 0.1, 4),
    charMat('#fb923c', 0.42),
  )
  hat.position.y = 1.05
  hat.rotation.y = Math.PI / 4
  g.add(hat)

  const rod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.018, 3.4, 10),
    charMat('#44403c', 0.28),
  )
  rod.position.set(0.06, 0.95, 0.22)
  rod.rotation.x = -0.48
  rod.rotation.y = 0.06
  g.add(rod)

  const reel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.05, 12),
    new THREE.MeshStandardMaterial({
      color: '#94a3b8',
      metalness: 0.55,
      roughness: 0.35,
      emissive: '#64748b',
      emissiveIntensity: 0.35,
    }),
  )
  reel.rotation.z = Math.PI / 2
  reel.position.set(0.02, 0.82, 0.22)
  g.add(reel)

  const tag = labelSprite('帥帥', '#bfdbfe')
  tag.position.y = 1.22
  g.add(tag)

  return g
}

/** 掛在角色身上的小補光（隨人物移動） */
export function attachCharacterLights(group: THREE.Group): void {
  const key = new THREE.PointLight('#fff7ed', 5.5, 11, 1.15)
  key.position.set(0.35, 1, 0.85)
  group.add(key)

  const fill = new THREE.PointLight('#bfdbfe', 3.5, 9, 1.15)
  fill.position.set(-0.4, 1.35, 0.2)
  group.add(fill)
}

/** 本地座標：竿尖（帥帥面向 +Z／外海時） */
export const SHUAI_ROD_TIP = new THREE.Vector3(0.1, 1.04, 1.62)
