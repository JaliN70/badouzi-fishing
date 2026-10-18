import * as THREE from 'three'

export function mesh(
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

export function roadSign(
  parent: THREE.Object3D,
  text: string,
  x: number,
  y: number,
  z: number,
  rotY = 0,
  scale = 1,
): void {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#166534'
  ctx.fillRect(0, 0, 512, 128)
  ctx.strokeStyle = '#fefce8'
  ctx.lineWidth = 6
  ctx.strokeRect(8, 8, 496, 112)
  ctx.fillStyle = '#fefce8'
  ctx.font = 'bold 40px "PingFang TC", "Noto Sans TC", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 256, 64)
  const tex = new THREE.CanvasTexture(canvas)
  const sign = mesh(
    new THREE.PlaneGeometry(8 * scale, 2 * scale),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true }),
    false,
    true,
  )
  sign.position.set(x, y, z)
  sign.rotation.y = rotY
  sign.rotation.x = -0.06
  parent.add(sign)
}

export function bannerSign(
  parent: THREE.Object3D,
  title: string,
  subtitle: string,
  x: number,
  y: number,
  z: number,
  rotY = 0,
): void {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#0c4a6e'
  ctx.fillRect(0, 0, 512, 256)
  ctx.fillStyle = '#fde68a'
  ctx.fillRect(0, 0, 512, 8)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 52px "PingFang TC", "Noto Sans TC", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(title, 256, 98)
  ctx.fillStyle = '#bae6fd'
  ctx.font = '28px "PingFang TC", "Noto Sans TC", sans-serif'
  ctx.fillText(subtitle, 256, 168)
  const tex = new THREE.CanvasTexture(canvas)
  const sign = mesh(
    new THREE.PlaneGeometry(10, 5),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true }),
    false,
    true,
  )
  sign.position.set(x, y, z)
  sign.rotation.y = rotY
  parent.add(sign)
}
