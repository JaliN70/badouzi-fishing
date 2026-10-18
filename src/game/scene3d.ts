import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { buildModeledBadouziHarbor } from './badouziModels.ts'
import {
  SHUAI_ROD_TIP,
  buildGrandpaCharacter,
  buildShuaiShuaiCharacter,
} from './characters.ts'

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
  overview: { pos: new THREE.Vector3(12, 58, 46), target: new THREE.Vector3(8, 1.2, 0) },
  pier: { pos: new THREE.Vector3(-2, 6.5, 9), target: new THREE.Vector3(6, 1.2, 0) },
  sea: { pos: new THREE.Vector3(48, 12, -10), target: new THREE.Vector3(24, 0, 2) },
  museum: { pos: new THREE.Vector3(-40, 22, 62), target: new THREE.Vector3(-70, 8, 48) },
}

export class BadouziScene3D {
  private canvas: HTMLCanvasElement
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private sun: THREE.DirectionalLight
  private water!: THREE.Mesh
  private waterBaseY!: Float32Array
  private shuaiGroup!: THREE.Group
  private grandpaGroup!: THREE.Group
  private bobber!: THREE.Group
  private fishingLine: THREE.Line
  private lineGeo: THREE.BufferGeometry
  private boats: THREE.Group[] = []
  private resizeObs: ResizeObserver
  private controlsEnabled = false
  private pierFocus = new THREE.Vector3(18, 0, 1.5)
  private seaCastDir = new THREE.Vector3(1, 0, 0.12)
  private sceneReady = false
  private animatingCamera = false
  private cameraFrom = new THREE.Vector3()
  private cameraTo = new THREE.Vector3()
  private targetFrom = new THREE.Vector3()
  private targetTo = new THREE.Vector3()
  private cameraT = 1

  private readonly rodTip = SHUAI_ROD_TIP.clone()

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
    this.renderer.toneMappingExposure = 1.08
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#93c5fd')
    this.scene.fog = new THREE.FogExp2('#bfdbfe', 0.0032)

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.5, 420)
    this.camera.position.copy(PRESETS.overview.pos)

    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.enabled = false
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.06
    this.controls.target.copy(PRESETS.overview.target)
    this.controls.minDistance = 4
    this.controls.maxDistance = 140
    this.controls.minPolarAngle = 0.1
    this.controls.maxPolarAngle = Math.PI * 0.48

    const hemi = new THREE.HemisphereLight('#e0f2fe', '#334155', 0.85)
    this.scene.add(hemi)

    this.sun = new THREE.DirectionalLight('#fff7ed', 1.3)
    this.sun.position.set(-45, 65, 25)
    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(2048, 2048)
    this.sun.shadow.camera.near = 4
    this.sun.shadow.camera.far = 220
    this.sun.shadow.camera.left = -90
    this.sun.shadow.camera.right = 90
    this.sun.shadow.camera.top = 90
    this.sun.shadow.camera.bottom = -90
    this.sun.shadow.bias = -0.00035
    this.scene.add(this.sun)

    this.lineGeo = new THREE.BufferGeometry()
    this.fishingLine = new THREE.Line(
      this.lineGeo,
      new THREE.LineBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.9 }),
    )

    this.setupScene()

    this.resizeObs = new ResizeObserver(() => this.resize())
    this.resizeObs.observe(canvas)
    this.resize()
  }

  bootstrap(): Promise<void> {
    return Promise.resolve()
  }

  isReady(): boolean {
    return this.sceneReady
  }

  private setupScene(): void {
    const env = buildModeledBadouziHarbor(this.scene)
    this.boats = env.boats
    this.water = env.waterSurface
    this.pierFocus.copy(env.pierFocus)
    this.seaCastDir.copy(env.castDirection)
    this.controls.target.copy(this.pierFocus.clone().setY(1.2))

    PRESETS.overview.target.set(8, 1.2, 0)
    PRESETS.pier.target.copy(env.shuaiPosition).setY(1.2)
    PRESETS.sea.target.copy(this.pierFocus)
    PRESETS.museum.target.set(-70, 8, 48)

    const posAttr = this.water.geometry.attributes.position
    this.waterBaseY = new Float32Array(posAttr.count)
    for (let i = 0; i < posAttr.count; i++) {
      this.waterBaseY[i] = posAttr.getY(i)
    }

    this.grandpaGroup = buildGrandpaCharacter()
    this.grandpaGroup.position.copy(env.grandpaPosition)
    this.scene.add(this.grandpaGroup)

    this.shuaiGroup = buildShuaiShuaiCharacter()
    this.shuaiGroup.position.copy(env.shuaiPosition)
    this.shuaiGroup.rotation.y = -Math.PI / 2 + 0.15
    this.scene.add(this.shuaiGroup)

    this.bobber = this.buildBobber()
    this.scene.add(this.fishingLine)
    this.bobber.visible = false
    this.fishingLine.visible = false
    this.sceneReady = true
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
    waterMat.emissiveIntensity = 0.08 + Math.sin(wavePhase * 2) * 0.03

    for (let i = 0; i < this.boats.length; i++) {
      const boat = this.boats[i]!
      boat.position.y = Math.sin(wavePhase * 1.1 + i) * 0.08
      boat.rotation.z = Math.sin(wavePhase * 0.85 + i) * 0.018
    }

    const castLean = phase === 'casting' ? (castMeter - 0.5) * 0.12 : 0
    this.shuaiGroup.rotation.z = castLean
    if (phase === 'reeling') {
      this.shuaiGroup.rotation.x = -0.04 - (tension / 100) * 0.06
    } else {
      this.shuaiGroup.rotation.x = THREE.MathUtils.lerp(this.shuaiGroup.rotation.x, 0, 0.1)
    }

    this.bobber.visible = fishing
    this.fishingLine.visible = fishing

    if (fishing) {
      const castDist = 12 + castQuality * 22
      const wobble = new THREE.Vector3(
        Math.sin(bobberPhase) * 0.25,
        0,
        Math.cos(bobberPhase * 0.9) * 0.18,
      )
      const sink = phase === 'bite' ? 0.08 + Math.sin(bobberPhase * 2) * 0.04 : 0.02
      this.bobber.position
        .copy(this.pierFocus)
        .add(this.seaCastDir.clone().multiplyScalar(castDist))
        .add(wobble)
      this.bobber.position.y = sink

      if (phase === 'reeling') {
        const t = reelProgress / 100
        const tipWorld = this.rodTip.clone()
        this.shuaiGroup.localToWorld(tipWorld)
        this.bobber.position.lerp(tipWorld, t * 0.88)
        this.bobber.position.y = THREE.MathUtils.lerp(sink, tipWorld.y - 0.5, t * 0.5)
      }

      const tip = this.rodTip.clone()
      this.shuaiGroup.localToWorld(tip)
      const bob = this.bobber.position.clone()
      bob.y += 0.06
      const mid = new THREE.Vector3().lerpVectors(tip, bob, 0.5)
      mid.y += Math.max(0.8, tip.distanceTo(bob) * 0.08)
      this.lineGeo.setFromPoints([tip, mid, bob])
    }

    this.grandpaGroup.rotation.y = Math.sin(wavePhase * 0.3) * 0.04
  }

  private animateWater(wavePhase: number): void {
    const pos = this.water.geometry.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const base = this.waterBaseY[i]!
      const wave =
        Math.sin(x * 0.08 + wavePhase * 1.4) * 0.12 +
        Math.cos(z * 0.07 + wavePhase * 1.1) * 0.1
      pos.setY(i, base + wave)
    }
    pos.needsUpdate = true
    this.water.geometry.computeVertexNormals()
  }

  private buildBobber(): THREE.Group {
    const g = new THREE.Group()
    const float = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 14, 14),
      new THREE.MeshStandardMaterial({
        color: '#ef4444',
        emissive: '#7f1d1d',
        emissiveIntensity: 0.35,
        roughness: 0.35,
      }),
    )
    float.position.y = 0.035
    g.add(float)
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.06, 6),
      new THREE.MeshStandardMaterial({ color: '#292524' }),
    )
    stem.position.y = 0.07
    g.add(stem)
    this.scene.add(g)
    return g
  }
}
