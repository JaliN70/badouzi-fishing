import * as THREE from 'three'

export interface SceneVisualState {
  phase: string
  bobberPhase: number
  wavePhase: number
  castQuality: number
  castMeter: number
  reelProgress: number
  tension: number
}

function labelSprite(text: string, color = '#ffffff', bg = 'rgba(15, 23, 42, 0.75)'): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 96
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = bg
  ctx.roundRect(8, 16, 240, 56, 20)
  ctx.fill()
  ctx.fillStyle = color
  ctx.font = 'bold 42px "PingFang TC", "Noto Sans TC", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 128, 48)
  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.LinearFilter
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.set(2.2, 0.82, 1)
  sprite.position.y = 1.35
  return sprite
}

function box(w: number, h: number, d: number, color: string | number): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0.05 }),
  )
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

export class BadouziScene3D {
  private canvas: HTMLCanvasElement
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private sun: THREE.DirectionalLight
  private water: THREE.Mesh
  private waterMat: THREE.MeshStandardMaterial
  private shuaiGroup: THREE.Group
  private grandpaGroup: THREE.Group
  private bobber: THREE.Group
  private fishingLine: THREE.Line
  private lineGeo: THREE.BufferGeometry
  private boats: THREE.Group[] = []
  private resizeObs: ResizeObserver

  /** 世界座標：+X 為海面，堤岸在 -X */
  private readonly rodTip = new THREE.Vector3(-0.55, 0.95, 0.15)

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    })
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#87ceeb')
    this.scene.fog = new THREE.Fog('#a8d4f0', 28, 55)

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120)
    this.camera.position.set(-6, 22, 14)
    this.camera.lookAt(2, 0, 0)

    const hemi = new THREE.HemisphereLight('#dff4ff', '#3d5c4a', 0.85)
    this.scene.add(hemi)

    this.sun = new THREE.DirectionalLight('#fff7e6', 1.15)
    this.sun.position.set(-8, 18, 10)
    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(1024, 1024)
    this.sun.shadow.camera.near = 2
    this.sun.shadow.camera.far = 50
    this.sun.shadow.camera.left = -18
    this.sun.shadow.camera.right = 18
    this.sun.shadow.camera.top = 18
    this.sun.shadow.camera.bottom = -18
    this.scene.add(this.sun)

    this.buildTerrain()
    this.buildHarbor()
    this.grandpaGroup = this.buildGrandpa()
    this.shuaiGroup = this.buildShuaiShuai()
    this.bobber = this.buildBobber()
    this.lineGeo = new THREE.BufferGeometry()
    const lineMat = new THREE.LineBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.85 })
    this.fishingLine = new THREE.Line(this.lineGeo, lineMat)
    this.scene.add(this.fishingLine)

    this.waterMat = new THREE.MeshStandardMaterial({
      color: '#0e7490',
      emissive: '#0c4a6e',
      emissiveIntensity: 0.18,
      roughness: 0.25,
      metalness: 0.35,
      transparent: true,
      opacity: 0.92,
    })
    const waterGeo = new THREE.PlaneGeometry(36, 28, 1, 1)
    waterGeo.rotateX(-Math.PI / 2)
    this.water = new THREE.Mesh(waterGeo, this.waterMat)
    this.water.position.set(10, -0.02, 0)
    this.water.receiveShadow = true
    this.scene.add(this.water)

    this.bobber.visible = false
    this.fishingLine.visible = false

    this.resizeObs = new ResizeObserver(() => this.resize())
    this.resizeObs.observe(canvas)
    this.resize()
  }

  dispose(): void {
    this.resizeObs.disconnect()
    this.renderer.dispose()
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect()
    const w = Math.max(rect.width, 320)
    const h = Math.max(rect.height, 400)
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  render(state: SceneVisualState): void {
    this.updateAnim(state)
    this.renderer.render(this.scene, this.camera)
  }

  private updateAnim(state: SceneVisualState): void {
    const { phase, bobberPhase, wavePhase, castQuality, castMeter, reelProgress, tension } = state
    const fishing = ['waiting', 'bite', 'reeling'].includes(phase)

    this.waterMat.emissiveIntensity = 0.12 + Math.sin(wavePhase * 2) * 0.05

    for (let i = 0; i < this.boats.length; i++) {
      const boat = this.boats[i]!
      boat.position.x += Math.sin(wavePhase + i) * 0.002
      boat.rotation.z = Math.sin(wavePhase * 0.8 + i) * 0.03
    }

    const castLean = phase === 'casting' ? (castMeter - 0.5) * 0.35 : 0
    this.shuaiGroup.rotation.z = castLean
    if (phase === 'reeling') {
      this.shuaiGroup.rotation.x = -0.08 - (tension / 100) * 0.12
    } else {
      this.shuaiGroup.rotation.x = THREE.MathUtils.lerp(this.shuaiGroup.rotation.x, 0, 0.1)
    }

    this.bobber.visible = fishing
    this.fishingLine.visible = fishing

    if (fishing) {
      const bx = 1.8 + castQuality * 4.2
      const bz = 0.35 + Math.sin(bobberPhase) * 0.25
      const sink = phase === 'bite' ? 0.35 + Math.sin(bobberPhase * 2) * 0.08 : 0.06
      this.bobber.position.set(bx, sink, bz)
      if (phase === 'reeling') {
        const t = reelProgress / 100
        this.bobber.position.x = THREE.MathUtils.lerp(bx, this.rodTip.x + 1.2, t * 0.85)
        this.bobber.position.z = THREE.MathUtils.lerp(bz, this.rodTip.z, t * 0.85)
      }

      const tip = this.rodTip.clone()
      this.shuaiGroup.localToWorld(tip)
      const bob = this.bobber.position.clone()
      bob.y += 0.12
      const mid = new THREE.Vector3().lerpVectors(tip, bob, 0.5)
      mid.y += 0.35
      const points = [tip, mid, bob]
      this.lineGeo.setFromPoints(points)
      this.lineGeo.attributes.position.needsUpdate = true
    }

    this.grandpaGroup.rotation.y = Math.sin(wavePhase * 0.3) * 0.05
  }

  private buildTerrain(): void {
    const land = box(14, 0.6, 22, '#6b7280')
    land.position.set(-7, -0.25, 0)
    land.receiveShadow = true
    this.scene.add(land)

    const hill = new THREE.Mesh(
      new THREE.CylinderGeometry(7, 9, 3.5, 6),
      new THREE.MeshStandardMaterial({ color: '#3d6b4f', roughness: 0.95 }),
    )
    hill.position.set(-12, 1.2, -6)
    hill.receiveShadow = true
    this.scene.add(hill)

    const sign = labelSprite('基隆 · 八斗子', '#fef3c7', 'rgba(12, 74, 110, 0.82)')
    sign.position.set(-3, 0.1, -7.5)
    sign.scale.set(3, 1.1, 1)
    this.scene.add(sign)
  }

  private buildHarbor(): void {
    const pier = box(5.5, 0.35, 16, '#9ca3af')
    pier.position.set(-2.2, 0.05, 0)
    pier.receiveShadow = true
    this.scene.add(pier)

    for (let z = -6; z <= 6; z += 2) {
      const plank = box(5.2, 0.05, 0.12, '#78716c')
      plank.position.set(-2.2, 0.28, z)
      this.scene.add(plank)
    }

    const breakwater = box(1.2, 0.9, 14, '#64748b')
    breakwater.position.set(0.8, 0.1, 0)
    this.scene.add(breakwater)

    const lighthouse = box(0.5, 2.2, 0.5, '#e2e8f0')
    lighthouse.position.set(0.8, 1.2, -5)
    this.scene.add(lighthouse)
    const lamp = box(0.55, 0.35, 0.55, '#ef4444')
    lamp.position.set(0.8, 2.45, -5)
    this.scene.add(lamp)

    this.spawnBoat(6, -3, '#dc2626')
    this.spawnBoat(8.5, 2.5, '#1d4ed8')
    this.spawnBoat(5.5, 5, '#059669')
  }

  private spawnBoat(x: number, z: number, color: string): void {
    const g = new THREE.Group()
    const hull = box(2.8, 0.45, 1.1, color)
    hull.position.y = 0.2
    g.add(hull)
    const cabin = box(0.9, 0.55, 0.75, '#f8fafc')
    cabin.position.set(-0.35, 0.65, 0)
    g.add(cabin)
    g.position.set(x, 0.05, z)
    this.scene.add(g)
    this.boats.push(g)
  }

  private buildGrandpa(): THREE.Group {
    const g = new THREE.Group()
    g.position.set(-3.2, 0.35, -1.2)

    const body = box(0.75, 0.55, 0.55, '#78716c')
    body.position.y = 0.35
    g.add(body)
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 16, 16),
      new THREE.MeshStandardMaterial({ color: '#fecaca', roughness: 0.7 }),
    )
    head.position.y = 0.78
    head.castShadow = true
    g.add(head)
    const bucket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.18, 0.28, 12),
      new THREE.MeshStandardMaterial({ color: '#854d0e' }),
    )
    bucket.position.set(0.55, 0.18, 0.35)
    g.add(bucket)
    g.add(labelSprite('爺爺', '#fde68a'))
    this.scene.add(g)
    return g
  }

  private buildShuaiShuai(): THREE.Group {
    const g = new THREE.Group()
    g.position.set(-2.35, 0.35, 0.8)
    g.rotation.y = Math.PI / 2

    const body = box(0.55, 0.5, 0.45, '#2563eb')
    body.position.y = 0.32
    g.add(body)
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 16, 16),
      new THREE.MeshStandardMaterial({ color: '#fde68a', roughness: 0.65 }),
    )
    head.position.y = 0.72
    head.castShadow = true
    g.add(head)
    const hat = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.22, 4),
      new THREE.MeshStandardMaterial({ color: '#f97316' }),
    )
    hat.position.y = 0.92
    hat.rotation.y = Math.PI / 4
    g.add(hat)

    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.04, 1.6, 8),
      new THREE.MeshStandardMaterial({ color: '#44403c' }),
    )
    rod.position.set(0.15, 0.75, 0.55)
    rod.rotation.x = -0.55
    rod.rotation.z = 0.15
    g.add(rod)

    g.add(labelSprite('帥帥', '#bfdbfe'))
    this.scene.add(g)
    return g
  }

  private buildBobber(): THREE.Group {
    const g = new THREE.Group()
    const float = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 12, 12),
      new THREE.MeshStandardMaterial({
        color: '#ef4444',
        emissive: '#7f1d1d',
        emissiveIntensity: 0.35,
      }),
    )
    float.position.y = 0.08
    g.add(float)
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.14, 6),
      new THREE.MeshStandardMaterial({ color: '#292524' }),
    )
    stem.position.y = 0.16
    g.add(stem)
    this.scene.add(g)
    return g
  }
}
