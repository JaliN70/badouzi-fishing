import * as THREE from 'three'

function limbCanvas(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  w = 128,
  h = 256,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  draw(ctx, w, h)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/** 夜釣仍清楚：Basic + 貼圖（可選色調） */
export function charTexMat(
  map: THREE.Texture,
  tint?: string,
): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    map,
    color: tint ?? '#ffffff',
  })
}

/** 褲管：摺痕、褲腳、鞋面 */
export function shuaiPantLegTexture(): THREE.CanvasTexture {
  return limbCanvas((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0)
    g.addColorStop(0, '#2563eb')
    g.addColorStop(0.5, '#3b82f6')
    g.addColorStop(1, '#1d4ed8')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(30,58,138,0.45)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(w * 0.35, 0)
    ctx.lineTo(w * 0.38, h * 0.72)
    ctx.stroke()
    ctx.fillStyle = '#1e3a8a'
    ctx.fillRect(0, h * 0.72, w, h * 0.06)
    ctx.fillStyle = '#f8fafc'
    ctx.beginPath()
    ctx.roundRect(w * 0.08, h * 0.78, w * 0.84, h * 0.18, 8)
    ctx.fill()
    ctx.strokeStyle = '#cbd5e1'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = '#ef4444'
    ctx.fillRect(w * 0.42, h * 0.84, w * 0.16, h * 0.04)
  })
}

export function shuaiUpperArmTexture(): THREE.CanvasTexture {
  return limbCanvas((ctx, w, h) => {
    ctx.fillStyle = '#3b82f6'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.fillRect(w * 0.2, 0, w * 0.15, h)
    ctx.fillStyle = '#fde68a'
    ctx.fillRect(0, h * 0.82, w, h * 0.18)
  }, 96, 160)
}

export function shuaiForearmTexture(): THREE.CanvasTexture {
  return limbCanvas((ctx, w, h) => {
    ctx.fillStyle = '#fde68a'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth = 1.5
    for (let i = 1; i <= 3; i++) {
      const y = h * (0.25 + i * 0.18)
      ctx.beginPath()
      ctx.moveTo(w * 0.15, y)
      ctx.lineTo(w * 0.85, y)
      ctx.stroke()
    }
    ctx.fillStyle = '#fcd34d'
    ctx.fillRect(0, 0, w, h * 0.12)
  }, 88, 140)
}

export function shuaiHandTexture(): THREE.CanvasTexture {
  return limbCanvas(
    (ctx, w, h) => {
      ctx.fillStyle = '#fde68a'
      ctx.beginPath()
      ctx.roundRect(w * 0.1, h * 0.35, w * 0.8, h * 0.55, 10)
      ctx.fill()
      ctx.fillStyle = '#fbbf24'
      const fw = w * 0.14
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(w * 0.14 + i * (fw + 2), h * 0.08, fw, h * 0.32)
      }
      ctx.fillRect(w * 0.55, h * 0.02, fw * 0.9, h * 0.28)
    },
    96,
    96,
  )
}

export function shuaiVestTexture(): THREE.CanvasTexture {
  return limbCanvas(
    (ctx, w, h) => {
      ctx.fillStyle = '#fcd34d'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#ca8a04'
      ctx.lineWidth = 3
      ctx.strokeRect(4, 4, w - 8, h - 8)
      ctx.fillStyle = '#f59e0b'
      ctx.fillRect(w * 0.42, h * 0.15, w * 0.16, h * 0.7)
    },
    128,
    128,
  )
}

export function grandpaPantTexture(): THREE.CanvasTexture {
  return limbCanvas((ctx, w, h) => {
    ctx.fillStyle = '#57534e'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#44403c'
    ctx.fillRect(0, h * 0.75, w, h * 0.25)
    ctx.fillStyle = '#292524'
    ctx.beginPath()
    ctx.roundRect(w * 0.1, h * 0.8, w * 0.8, h * 0.16, 6)
    ctx.fill()
  })
}

export function grandpaArmTexture(): THREE.CanvasTexture {
  return limbCanvas((ctx, w, h) => {
    ctx.fillStyle = '#78716c'
    ctx.fillRect(0, 0, w, h * 0.55)
    ctx.fillStyle = '#fecaca'
    ctx.fillRect(0, h * 0.55, w, h * 0.45)
    ctx.strokeStyle = '#f87171'
    ctx.lineWidth = 1.2
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.moveTo(w * 0.2, h * (0.62 + i * 0.1))
      ctx.lineTo(w * 0.8, h * (0.62 + i * 0.1))
      ctx.stroke()
    }
  }, 88, 180)
}

export function skinHeadTexture(tone: string, hair: string): THREE.CanvasTexture {
  return limbCanvas(
    (ctx, w, h) => {
      ctx.fillStyle = tone
      ctx.beginPath()
      ctx.ellipse(w / 2, h * 0.55, w * 0.42, h * 0.38, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = hair
      ctx.beginPath()
      ctx.ellipse(w / 2, h * 0.32, w * 0.44, h * 0.22, 0, Math.PI, 0)
      ctx.fill()
      ctx.fillStyle = '#1e293b'
      ctx.beginPath()
      ctx.ellipse(w * 0.38, h * 0.52, w * 0.06, h * 0.04, 0, 0, Math.PI * 2)
      ctx.ellipse(w * 0.62, h * 0.52, w * 0.06, h * 0.04, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#64748b'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(w / 2, h * 0.58, w * 0.08, 0.15 * Math.PI, 0.85 * Math.PI)
      ctx.stroke()
    },
    128,
    128,
  )
}
