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

export function waterNormalTexture(): THREE.CanvasTexture {
  return canvasTexture((ctx, w, h) => {
    const img = ctx.createImageData(w, h)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const nx = Math.sin(x * 0.08) * 0.5 + 0.5
        const ny = Math.cos(y * 0.07) * 0.5 + 0.5
        const i = (y * w + x) * 4
        img.data[i] = nx * 255
        img.data[i + 1] = ny * 255
        img.data[i + 2] = 255
        img.data[i + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
  }, 256, 256)
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
