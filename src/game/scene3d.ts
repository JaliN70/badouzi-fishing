import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { buildFishingEnvironment } from './environmentBuild.ts'
import type { HarborLayout } from './harborLayout.ts'
import {
  SHUAI_ROD_TIP,
  attachCharacterLights,
  buildGrandpaCharacter,
  buildShuaiShuaiCharacter,
} from './characters.ts'
import { FISHING_SPOTS, type FishingSpotId } from './fishingSpot.ts'
import {
  applyNightSky,
  createNightLighting,
  setWaterNightLook,
  syncParkLamps,
  type NightLightingHandles,
} from './sceneNight.ts'

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

const PRESETS_BADOUZI: Record<CameraPreset, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
  overview: { pos: new THREE.Vector3(52, 78, -62), target: new THREE.Vector3(-38, 1.2, 30) },
  pier: { pos: new THREE.Vector3(-70, 6, 26), target: new THREE.Vector3(-52, 1.2, 34) },
  sea: { pos: new THREE.Vector3(-44, 10, 62), target: new THREE.Vector3(-48, 0.6, 38) },
  museum: { pos: new THREE.Vector3(98, 32, 8), target: new THREE.Vector3(168, 10, -28) },
}

const PRESETS_CHAOJING: Record<CameraPreset, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
  overview: { pos: new THREE.Vector3(55, 72, -58), target: new THREE.Vector3(15, 1.2, 28) },
  pier: { pos: new THREE.Vector3(-52, 6.5, 18), target: new THREE.Vector3(-32, 1.2, 38) },
  sea: { pos: new THREE.Vector3(-36, 11, 58), target: new THREE.Vector3(-32, 0.6, 42) },
  museum: { pos: new THREE.Vector3(62, 20, 32), target: new THREE.Vector3(48, 12, 22) },
}

export class BadouziScene3D {
  private canvas: HTMLCanvasElement
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private night!: NightLightingHandles
  private envRoot = new THREE.Group()
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
  private pierFocus = new THREE.Vector3(-48, 0, 38)
  private seaCastDir = new THREE.Vector3(0.08, 0, 0.996)
  private castFacingY = 0
  private sceneReady = false
  private animatingCamera = false
  private cameraFrom = new THREE.Vector3()
  private cameraTo = new THREE.Vector3()
  private targetFrom = new THREE.Vector3()
  private targetTo = new THREE.Vector3()
  private cameraT = 1
  private spotId: FishingSpotId = 'badouzi'
  private presets = PRESETS_BADOUZI
  private pointLights: THREE.PointLight[] = []
  private pierWorkLight!: THREE.PointLight
  private pierSpot!: THREE.SpotLight
  private pierRigLight!: THREE.PointLight

  private readonly rodTip = SHUAI_ROD_TIP.clone()

  constructor(canvas: HTMLCanvasElement, spotId: FishingSpotId = 'badouzi') {
    this.canvas = canvas
    this.spotId = spotId
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    })
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping

    this.scene = new THREE.Scene()
    applyNightSky(this.scene, this.renderer)
    this.night = createNightLighting(this.scene)
    this.pierWorkLight = new THREE.PointLight('#fffaf0', 9, 35, 1.2)
    this.pierWorkLight.position.set(0, 3, 0)
    this.scene.add(this.pierWorkLight)

    this.pierRigLight = new THREE.PointLight('#ffffff', 11, 24, 1.1)
    this.scene.add(this.pierRigLight)

    this.pierSpot = new THREE.SpotLight('#fffbeb', 14, 45, Math.PI / 3.2, 0.45, 1)
    this.pierSpot.castShadow = false
    this.scene.add(this.pierSpot)
    this.scene.add(this.pierSpot.target)

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.5, 420)
    this.presets = spotId === 'chaojing' ? PRESETS_CHAOJING : PRESETS_BADOUZI
    this.camera.position.copy(this.presets.overview.pos)

    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.enabled = false
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.06
    this.controls.target.copy(this.presets.overview.target)
    this.controls.minDistance = 4
    this.controls.maxDistance = 140
    this.controls.minPolarAngle = 0.1
    this.controls.maxPolarAngle = Math.PI * 0.48

    this.scene.add(this.envRoot)

    this.lineGeo = new THREE.BufferGeometry()
    this.fishingLine = new THREE.Line(
      this.lineGeo,
      new THREE.LineBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.85 }),
    )

    this.grandpaGroup = buildGrandpaCharacter()
    attachCharacterLights(this.grandpaGroup)
    this.scene.add(this.grandpaGroup)
    this.shuaiGroup = buildShuaiShuaiCharacter()
    attachCharacterLights(this.shuaiGroup)
    this.scene.add(this.shuaiGroup)
    this.bobber = this.buildBobber()
    this.scene.add(this.fishingLine)

    this.loadEnvironment()

    this.resizeObs = new ResizeObserver(() => this.resize())
    this.resizeObs.observe(canvas)
    this.resize()
  }

  getSpotId(): FishingSpotId {
    return this.spotId
  }

  setSpot(spotId: FishingSpotId): void {
    if (this.spotId === spotId) return
    this.spotId = spotId
    this.presets = spotId === 'chaojing' ? PRESETS_CHAOJING : PRESETS_BADOUZI
    this.clearEnvironment()
    this.loadEnvironment()
    this.resetCamera()
  }

  bootstrap(): Promise<void> {
    return Promise.resolve()
  }

  isReady(): boolean {
    return this.sceneReady
  }

  private clearEnvironment(): void {
    while (this.envRoot.children.length > 0) {
      const child = this.envRoot.children[0]!
      this.envRoot.remove(child)
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        const mat = child.material
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
        else mat.dispose()
      }
    }
    this.boats = []
    this.pointLights = syncParkLamps(this.night.lampGroup, [], this.pointLights)
  }

  private loadEnvironment(): void {
    const env = buildFishingEnvironment(this.spotId, this.envRoot)
    this.applyLayout(env)
    this.bobber.visible = false
    this.fishingLine.visible = false
    this.sceneReady = true
  }

  private applyLayout(env: HarborLayout): void {
    this.boats = env.boats
    this.water = env.waterSurface
    this.pierFocus.copy(env.pierFocus)
    this.seaCastDir.copy(env.castDirection)
    this.castFacingY = Math.atan2(env.castDirection.x, env.castDirection.z)
    this.controls.target.copy(this.pierFocus.clone().setY(1.2))

    this.pointLights = syncParkLamps(this.night.lampGroup, env.lampPositions, this.pointLights)

    const posAttr = this.water.geometry.attributes.position
    this.waterBaseY = new Float32Array(posAttr.count)
    for (let i = 0; i < posAttr.count; i++) {
      this.waterBaseY[i] = posAttr.getY(i)
    }

    if (this.grandpaGroup) {
      this.grandpaGroup.position.copy(env.grandpaPosition)
      this.grandpaGroup.rotation.y = this.castFacingY + 0.12
    }
    if (this.shuaiGroup) {
      this.shuaiGroup.position.copy(env.shuaiPosition)
      this.shuaiGroup.rotation.y = this.castFacingY
    }

    const rigCenter = new THREE.Vector3()
      .copy(env.shuaiPosition)
      .lerp(env.grandpaPosition, 0.45)
    this.pierWorkLight.position.copy(rigCenter).add(new THREE.Vector3(0.6, 3.8, -0.8))
    this.pierRigLight.position.copy(rigCenter).add(new THREE.Vector3(0, 2.6, 0.5))

    this.pierSpot.position.copy(rigCenter).add(new THREE.Vector3(-1.5, 7, -4))
    this.pierSpot.target.position.copy(rigCenter).add(new THREE.Vector3(0, 1.1, 0.8))
    this.pierSpot.target.updateMatrixWorld()
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
    const p = this.presets[preset]
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

  getViewRefLabel(): string {
    return FISHING_SPOTS[this.spotId].viewRef
  }

  getMuseumPresetLabel(): string {
    return this.spotId === 'chaojing' ? '海與空' : '海科館'
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
    setWaterNightLook(this.water, wavePhase)

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

    this.grandpaGroup.rotation.y =
      this.castFacingY + 0.12 + Math.sin(wavePhase * 0.3) * 0.04
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
        emissiveIntensity: 0.55,
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
