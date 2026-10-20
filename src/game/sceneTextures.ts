import * as THREE from 'three'

function canvasTexture(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  w = 512,
  h = 512,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  draw(ctx, w, h)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 4
  return tex
}

export function concreteTexture(): THREE.CanvasTexture {
  return canvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#9ca3af'
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 8000; i++) {
      const g = 120 + Math.random() * 80
      ctx.fillStyle = `rgba(${g},${g},${g},0.08)`
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2)
    }
    ctx.strokeStyle = 'rgba(60,60,60,0.15)'
    for (let y = 0; y < h; y += 64) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
  })
}

export function asphaltTexture(): THREE.CanvasTexture {
  return canvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#374151'
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 6000; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`
      ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1)
    }
  })
}

export function grassTexture(): THREE.CanvasTexture {
  return canvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#3d6b2a'
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 12000; i++) {
      const g = 80 + Math.random() * 100
      ctx.strokeStyle = `rgba(${g * 0.6},${g},${g * 0.35},0.25)`
      ctx.beginPath()
      ctx.moveTo(Math.random() * w, Math.random() * h)
      ctx.lineTo(Math.random() * w, Math.random() * h)
      ctx.stroke()
    }
    for (let i = 0; i < 4000; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`
      ctx.fillRect(Math.random() * w, Math.random() * h, 1, 2)
    }
  }, 512, 512)
}

export function woodDeckTexture(): THREE.CanvasTexture {
  return canvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#8b6914'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(40,30,10,0.35)'
    for (let y = 0; y < h; y += 28) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
    for (let x = 0; x < w; x += 64) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
  }, 512, 512)
}

export function basaltRockTexture(): THREE.CanvasTexture {
  return canvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#2f3338'
    ctx.fillRect(0, 0, w, h)
    const cols = 8
    const rows = 16
    const cw = w / cols
    const rh = h / rows
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const shade = 45 + ((row + col) % 3) * 18 + Math.random() * 12
        ctx.fillStyle = `rgb(${shade},${shade + 4},${shade + 8})`
        const inset = 2
        ctx.fillRect(col * cw + inset, row * rh + inset, cw - inset * 2, rh - inset * 2)
      }
    }
  }, 512, 512)
}

export function brickPathTexture(): THREE.CanvasTexture {
  return canvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#78716c'
    ctx.fillRect(0, 0, w, h)
    const bw = 48
    const bh = 22
    for (let y = 0; y < h; y += bh) {
      const off = (y / bh) % 2 ? bw / 2 : 0
      for (let x = -bw; x < w + bw; x += bw) {
        const s = 110 + Math.random() * 40
        ctx.fillStyle = `rgb(${s},${s - 8},${s - 12})`
        ctx.fillRect(x + off + 2, y + 2, bw - 4, bh - 4)
      }
    }
  }, 512, 512)
}

export function steelTexture(): THREE.CanvasTexture {
  return canvasTexture((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0)
    g.addColorStop(0, '#64748b')
    g.addColorStop(0.5, '#94a3b8')
    g.addColorStop(1, '#475569')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    for (let x = 0; x < w; x += 32) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
  }, 256, 256)
}

export function glassFloorTexture(): THREE.CanvasTexture {
  return canvasTexture((ctx, w, h) => {
    ctx.fillStyle = 'rgba(120, 200, 230, 0.35)'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'
    ctx.lineWidth = 2
    for (let x = 0; x <= w; x += 64) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    for (let y = 0; y <= h; y += 64) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
  }, 512, 512)
}

export function roofTileTexture(): THREE.CanvasTexture {
  return canvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#57534e'
    ctx.fillRect(0, 0, w, h)
    for (let y = 0; y < h; y += 18) {
      for (let x = (y / 18) % 2 ? 0 : 14; x < w; x += 28) {
        ctx.fillStyle = `rgba(0,0,0,${0.15 + Math.random() * 0.1})`
        ctx.beginPath()
        ctx.arc(x + 14, y + 9, 14, Math.PI, 0)
        ctx.fill()
      }
    }
  }, 512, 256)
}

export function hullPaintTexture(): THREE.CanvasTexture {
  return canvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#991b1b'
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 6000; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`
      ctx.fillRect(Math.random() * w, Math.random() * h, 1, 2)
    }
    ctx.strokeStyle = 'rgba(30,30,30,0.25)'
    for (let y = 0; y < h; y += 48) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
    ctx.fillStyle = 'rgba(0,0,0,0.12)'
    ctx.fillRect(0, h * 0.7, w, h * 0.3)
  }, 512, 256)
}

export function ropeTexture(): THREE.CanvasTexture {
  return canvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#d6d3d1'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#a8a29e'
    ctx.lineWidth = 2
    for (let x = 0; x < w; x += 6) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x + 3, h)
      ctx.stroke()
    }
  }, 64, 64)
}

export function pebbleTexture(): THREE.CanvasTexture {
  return canvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#57534e'
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 400; i++) {
      const g = 90 + Math.random() * 60
      ctx.fillStyle = `rgb(${g},${g - 5},${g - 10})`
      ctx.beginPath()
      ctx.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 5, 0, Math.PI * 2)
      ctx.fill()
    }
  }, 128, 128)
}

export function corrugatedMetalTexture(): THREE.CanvasTexture {
  return canvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#64748b'
    for (let x = 0; x < w; x += 14) {
      const g = 100 + (x % 28 ? 0 : 25)
      ctx.fillStyle = `rgb(${g - 20},${g - 10},${g})`
      ctx.fillRect(x, 0, 14, h)
    }
  }, 256, 256)
}

export function waterNormalTexture(): THREE.CanvasTexture {
  return canvasTexture((ctx, w, h) => {
    const img = ctx.createImageData(w, h)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const u = x / w
        const v = y / h
        const n1x = Math.sin(u * Math.PI * 6 + v * 3) * 0.35
        const n1y = Math.cos(v * Math.PI * 5 + u * 2) * 0.35
        const n2x = Math.sin(u * 22 + v * 18) * 0.12
        const n2y = Math.cos(v * 19 - u * 15) * 0.12
        const nx = n1x + n2x
        const ny = n1y + n2y
        const nz = Math.sqrt(Math.max(0.02, 1 - nx * nx - ny * ny))
        const i = (y * w + x) * 4
        img.data[i] = (nx * 0.5 + 0.5) * 255
        img.data[i + 1] = (ny * 0.5 + 0.5) * 255
        img.data[i + 2] = (nz * 0.5 + 0.5) * 255
        img.data[i + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
  }, 256, 256)
}

export function glassMat(): THREE.MeshPhysicalMaterial {
  const map = glassFloorTexture()
  map.repeat.set(4, 8)
  return new THREE.MeshPhysicalMaterial({
    map,
    color: '#7dd3fc',
    metalness: 0.15,
    roughness: 0.08,
    transmission: 0.62,
    thickness: 0.35,
    transparent: true,
    opacity: 0.88,
    envMapIntensity: 0.6,
  })
}

export function stdMat(
  map: THREE.Texture | null,
  color: string,
  opts: {
    roughness?: number
    metalness?: number
    repeat?: [number, number]
    emissive?: string
    emissiveIntensity?: number
  } = {},
): THREE.MeshStandardMaterial {
  if (map && opts.repeat) {
    map.repeat.set(opts.repeat[0], opts.repeat[1])
  }
  return new THREE.MeshStandardMaterial({
    map: map ?? undefined,
    color,
    roughness: opts.roughness ?? 0.85,
    metalness: opts.metalness ?? 0.05,
    emissive: opts.emissive ? new THREE.Color(opts.emissive) : undefined,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
  })
}
