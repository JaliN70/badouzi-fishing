import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { buildBadouziEnvironment } from './badouziEnvironment.ts'

export type CameraPreset = 'overview' | 'pier' | 'sea' | 'museum'

export interface SceneVisualState {
  phase: string
  bobberPhase: number
  wavePhase: number
  castQuality: number
  castMeter: number
  reelProgress: number
  tension: number
}

const PRESETS: Record<CameraPreset, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
  overview: { pos: new THREE.Vector3(2, 26, 14), target: new THREE.Vector3(2, 0, 0) },
  pier: { pos: new THREE.Vector3(-4, 6, 8), target: new THREE.Vector3(-2, 0.5, 0) },
  sea: { pos: new THREE.Vector3(14, 8, -6), target: new THREE.Vector3(4, 0, 0) },
  museum: { pos: new THREE.Vector3(-8, 12, 12), target: new THREE.Vector3(-10, 1, 6) },
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

export class BadouziScene3D {
  private canvas: HTMLCanvasElement
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private sun: THREE.DirectionalLight
  private water: THREE.Mesh
  private waterBaseY: Float32Array
  private shuaiGroup: THREE.Group
  private grandpaGroup: THREE.Group
  private bobber: THREE.Group
  private fishingLine: THREE.Line
  private lineGeo: THREE.BufferGeometry
  private boats: THREE.Group[] = []
  private resizeObs: ResizeObserver
  private controlsEnabled = false
  private pierFocus = new THREE.Vector3(1.5, 0, 0.5)
  private animatingCamera = false
  private cameraFrom = new THREE.Vector3()
  private cameraTo = new THREE.Vector3()
  private targetFrom = new THREE.Vector3()
  private targetTo = new THREE.Vector3()
  private cameraT = 1

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
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#8ecae6')
    this.scene.fog = new THREE.FogExp2('#b8d9ee', 0.018)

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 160)
    this.camera.position.copy(PRESETS.overview.pos)

    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.enabled = false
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.06
    this.controls.target.copy(PRESETS.overview.target)
    this.controls.minDistance = 4
    this.controls.maxDistance = 48
    this.controls.minPolarAngle = 0.12
    this.controls.maxPolarAngle = Math.PI * 0.48
    const hemi = new THREE.HemisphereLight('#e0f2fe', '#3f4f3a', 0.9)
    this.scene.add(hemi)

    this.sun = new THREE.DirectionalLight('#fff4e0', 1.25)
    this.sun.position.set(-12, 22, 8)
    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(2048, 2048)
    this.sun.shadow.camera.near = 2
    this.sun.shadow.camera.far = 60
    this.sun.shadow.camera.left = -22
    this.sun.shadow.camera.right = 22
    this.sun.shadow.camera.top = 22
    this.sun.shadow.camera.bottom = -22
    this.sun.shadow.bias = -0.0004
    this.scene.add(this.sun)

    const env = buildBadouziEnvironment(this.scene)
    this.boats = env.boats
    this.water = env.waterSurface
    this.pierFocus.copy(env.pierFocus)
    this.controls.target.copy(this.pierFocus)

    const posAttr = this.water.geometry.attributes.position
    this.waterBaseY = new Float32Array(posAttr.count)
    for (let i = 0; i < posAttr.count; i++) {
      this.waterBaseY[i] = posAttr.getY(i)
    }

    this.grandpaGroup = this.buildGrandpa()
    this.shuaiGroup = this.buildShuaiShuai()
    this.bobber = this.buildBobber()
    this.lineGeo = new THREE.BufferGeometry()
    const lineMat = new THREE.LineBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.9 })
    this.fishingLine = new THREE.Line(this.lineGeo, lineMat)
    this.scene.add(this.fishingLine)

    this.bobber.visible = false
    this.fishingLine.visible = false

    this.resizeObs = new ResizeObserver(() => this.resize())
    this.resizeObs.observe(canvas)
    this.resize()
  }

  dispose(): void {
    this.resizeObs.disconnect()
    this.controls.dispose()
    this.renderer.dispose()
  }

  setControlsEnabled(on: boolean): void {
    this.controlsEnabled = on
    this.controls.enabled = on
    this.canvas.classList.toggle('camera-active', on)
  }

  isControlsEnabled(): boolean {
    return this.controlsEnabled
  }

  applyCameraPreset(preset: CameraPreset): void {
    const p = PRESETS[preset]
    this.cameraFrom.copy(this.camera.position)
    this.targetFrom.copy(this.controls.target)
    this.cameraTo.copy(p.pos)
    this.targetTo.copy(p.target)
    this.cameraT = 0
    this.animatingCamera = true
  }

  resetCamera(): void {
    this.applyCameraPreset('overview')
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect()
    const w = Math.max(rect.width, 320)
    const h = Math.max(rect.height, 400)
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  render(state: SceneVisualState, dt: number): void {
    this.updateCameraTween(dt)
    if (this.controls.enabled) this.controls.update()
    this.updateAnim(state)
    this.renderer.render(this.scene, this.camera)
  }

  private updateCameraTween(dt: number): void {
    if (!this.animatingCamera) return
    this.cameraT = Math.min(1, this.cameraT + dt * 1.8)
    const e = 1 - (1 - this.cameraT) ** 3
    this.camera.position.lerpVectors(this.cameraFrom, this.cameraTo, e)
    this.controls.target.lerpVectors(this.targetFrom, this.targetTo, e)
    if (this.cameraT >= 1) this.animatingCamera = false
  }

  private updateAnim(state: SceneVisualState): void {
    const { phase, bobberPhase, wavePhase, castQuality, castMeter, reelProgress, tension } = state
    const fishing = ['waiting', 'bite', 'reeling'].includes(phase)

    this.animateWater(wavePhase)

    const waterMat = this.water.material as THREE.MeshStandardMaterial
    waterMat.emissiveIntensity = 0.1 + Math.sin(wavePhase * 2) * 0.04

    for (let i = 0; i < this.boats.length; i++) {
      const boat = this.boats[i]!
      boat.position.y = 0.02 + Math.sin(wavePhase * 1.1 + i) * 0.04
      boat.rotation.z = Math.sin(wavePhase * 0.85 + i) * 0.035
      boat.rotation.x = Math.sin(wavePhase * 0.6 + i * 0.5) * 0.02
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
      this.lineGeo.setFromPoints([tip, mid, bob])
    }

    this.grandpaGroup.rotation.y = Math.sin(wavePhase * 0.3) * 0.05
  }

  private animateWater(wavePhase: number): void {
    const pos = this.water.geometry.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const base = this.waterBaseY[i]!
      const wave =
        Math.sin(x * 0.35 + wavePhase * 1.4) * 0.06 +
        Math.cos(z * 0.28 + wavePhase * 1.1) * 0.05
      pos.setY(i, base + wave)
    }
    pos.needsUpdate = true
    this.water.geometry.computeVertexNormals()
  }

  private buildGrandpa(): THREE.Group {
    const g = new THREE.Group()
    g.position.set(-3.2, 0.35, -1.2)

    const jacket = new THREE.Mesh(
      new THREE.BoxGeometry(0.78, 0.58, 0.58),
      new THREE.MeshStandardMaterial({ color: '#57534e', roughness: 0.88 }),
    )
    jacket.position.y = 0.35
    jacket.castShadow = true
    g.add(jacket)
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 20, 20),
      new THREE.MeshStandardMaterial({ color: '#fecaca', roughness: 0.72 }),
    )
    head.position.y = 0.78
    head.castShadow = true
    g.add(head)
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.29, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: '#e7e5e4' }),
    )
    hair.position.y = 0.82
    g.add(hair)
    const bucket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.18, 0.28, 14),
      new THREE.MeshStandardMaterial({ color: '#854d0e', roughness: 0.65, metalness: 0.2 }),
    )
    bucket.position.set(0.55, 0.18, 0.35)
    g.add(bucket)
    const stool = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.22, 0.08, 12),
      new THREE.MeshStandardMaterial({ color: '#44403c' }),
    )
    stool.position.set(-0.15, 0.08, 0.1)
    g.add(stool)
    g.add(labelSprite('爺爺', '#fde68a'))
    this.scene.add(g)
    return g
  }

  private buildShuaiShuai(): THREE.Group {
    const g = new THREE.Group()
    g.position.set(-2.35, 0.35, 0.8)
    g.rotation.y = Math.PI / 2

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.5, 0.45),
      new THREE.MeshStandardMaterial({ color: '#2563eb', roughness: 0.75 }),
    )
    body.position.y = 0.32
    body.castShadow = true
    g.add(body)
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 20, 20),
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
    const vest = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.22, 0.42),
      new THREE.MeshStandardMaterial({ color: '#fcd34d' }),
    )
    vest.position.y = 0.42
    g.add(vest)

    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.04, 1.65, 10),
      new THREE.MeshStandardMaterial({ color: '#292524', roughness: 0.6, metalness: 0.15 }),
    )
    rod.position.set(0.15, 0.75, 0.55)
    rod.rotation.x = -0.55
    rod.rotation.z = 0.15
    g.add(rod)
    const reel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12),
      new THREE.MeshStandardMaterial({ color: '#64748b', metalness: 0.55, roughness: 0.35 }),
    )
    reel.rotation.z = Math.PI / 2
    reel.position.set(0.05, 0.62, 0.48)
    g.add(reel)

    const tackle = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.12, 0.22),
      new THREE.MeshStandardMaterial({ color: '#15803d' }),
    )
    tackle.position.set(-0.35, 0.12, -0.35)
    g.add(tackle)

    g.add(labelSprite('帥帥', '#bfdbfe'))
    this.scene.add(g)
    return g
  }

  private buildBobber(): THREE.Group {
    const g = new THREE.Group()
    const float = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 16),
      new THREE.MeshStandardMaterial({
        color: '#ef4444',
        emissive: '#7f1d1d',
        emissiveIntensity: 0.35,
        roughness: 0.35,
      }),
    )
    float.position.y = 0.08
    g.add(float)
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.14, 8),
      new THREE.MeshStandardMaterial({ color: '#292524' }),
    )
    stem.position.y = 0.16
    g.add(stem)
    this.scene.add(g)
    return g
  }
}
