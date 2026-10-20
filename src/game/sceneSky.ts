import * as THREE from 'three'

function nightSkyTexture(): THREE.CanvasTexture {
  const w = 1024
  const h = 512
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#0a1628')
  g.addColorStop(0.45, '#1a3348')
  g.addColorStop(0.72, '#3d5a6e')
  g.addColorStop(1, '#5a7288')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  for (let i = 0; i < 420; i++) {
    const x = Math.random() * w
    const y = Math.random() * h * 0.72
    const r = Math.random() * 1.4 + 0.2
    const a = 0.25 + Math.random() * 0.75
    ctx.fillStyle = `rgba(255,255,255,${a})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = 'rgba(230,240,255,0.92)'
  ctx.beginPath()
  ctx.arc(w * 0.78, h * 0.22, 28, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(200,220,240,0.15)'
  ctx.beginPath()
  ctx.arc(w * 0.78, h * 0.22, 38, 0, Math.PI * 2)
  ctx.fill()

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** 替換純色背景：漸層夜空 + 星 + 月 */
export function attachNightSky(scene: THREE.Scene): THREE.Mesh {
  const tex = nightSkyTexture()
  const geo = new THREE.SphereGeometry(380, 32, 24)
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  })
  const dome = new THREE.Mesh(geo, mat)
  dome.renderOrder = -10
  scene.add(dome)
  scene.background = null
  return dome
}

export function createMoonReflectionLight(scene: THREE.Scene): THREE.DirectionalLight {
  const moon = new THREE.DirectionalLight('#c7ddff', 0.35)
  moon.position.set(-55, 80, 35)
  scene.add(moon)
  return moon
}
