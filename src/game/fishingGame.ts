import { pickFish, type FishSpecies } from './fish.ts'
import { getDexProgress, recordDexCatch } from './fishDex.ts'
import {
  FISHING_SPOTS,
  loadSavedSpot,
  saveSpot,
  type FishingSpotId,
} from './fishingSpot.ts'
import { BadouziScene3D, type CameraPreset } from './scene3d.ts'

const STORAGE_KEY = 'badouzi-fishing-stats'

export type FishingPhase =
  | 'menu'
  | 'intro'
  | 'idle'
  | 'casting'
  | 'waiting'
  | 'bite'
  | 'reeling'
  | 'result'

export interface SessionStats {
  totalCatch: number
  totalKg: number
  bestKg: number
}

export interface GameUiState {
  phase: FishingPhase
  dialogueSpeaker: '阿公' | '帥帥' | ''
  dialogueText: string
  castMeter: number
  castQuality: number
  waitPulse: number
  hookTimer: number
  reelProgress: number
  tension: number
  lastCatch: { species: FishSpecies; kg: number } | null
  resultSuccess: boolean
  stats: SessionStats
  bobberY: number
  dexProgress: { unlocked: number; total: number }
  resultNewDex: boolean
  resultSpeciesRecord: boolean
  resultGlobalRecord: boolean
  spotId: FishingSpotId
  viewRef: string
  museumPresetLabel: string
}

function loadStats(): SessionStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { totalCatch: 0, totalKg: 0, bestKg: 0 }
    return JSON.parse(raw) as SessionStats
  } catch {
    return { totalCatch: 0, totalKg: 0, bestKg: 0 }
  }
}

function saveStats(stats: SessionStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch {
    /* ignore */
  }
}

const GRANDPA_TIPS = [
  '帥帥，夜裡風大時線要拋穩，燈別直射水面嚇魚。',
  '看浮標，只有猛沉下去那一下才刺。',
  '魚在掙扎時別硬拉，張一下、放一下。',
  '潮境這邊浪聲大，更要專心看浮標。',
  '記得，釣完要把垃圾帶走，海邊才會一直漂亮。',
]

export class BadouziFishingGame {
  private scene3d: BadouziScene3D
  private phase: FishingPhase = 'menu'
  private stats = loadStats()
  private raf = 0
  private lastTs = 0

  private castMeter = 0
  private castDir = 1
  private castQuality = 0.5
  private waitTime = 0
  private waitTarget = 3
  private hookTimer = 0
  private hookWindow = 1.4
  private reelProgress = 0
  private tension = 0
  private tensionDecay = 18
  private pendingFish: { species: FishSpecies; kg: number } | null = null
  private lastCatch: { species: FishSpecies; kg: number } | null = null
  private resultSuccess = false
  private dialogueSpeaker: '阿公' | '帥帥' | '' = ''
  private dialogueText = ''
  private bobberPhase = 0
  private wavePhase = 0
  private resultNewDex = false
  private resultSpeciesRecord = false
  private resultGlobalRecord = false
  private spotId: FishingSpotId = loadSavedSpot()
  private onUi: (state: GameUiState) => void

  constructor(canvas: HTMLCanvasElement, onUi: (state: GameUiState) => void) {
    this.onUi = onUi
    this.scene3d = new BadouziScene3D(canvas, this.spotId)
  }

  getSpotId(): FishingSpotId {
    return this.spotId
  }

  selectSpot(spotId: FishingSpotId): void {
    if (this.phase !== 'menu') return
    this.spotId = spotId
    saveSpot(spotId)
    this.scene3d.setSpot(spotId)
    const spot = FISHING_SPOTS[spotId]
    this.setDialogue('阿公', `帥帥，今晚我們在${spot.shortLabel}夜釣。準備好了就按開始。`)
    this.emitUi()
  }

  init(onReady?: () => void, onError?: (message: string) => void): void {
    const spot = FISHING_SPOTS[this.spotId]
    this.setDialogue('阿公', `帥帥，今晚我們在${spot.shortLabel}夜釣。準備好了就按開始。`)
    this.emitUi()
    void this.scene3d.bootstrap().then(
      () => {
        if (!this.scene3d.isReady()) {
          onError?.('場景載入失敗')
          return
        }
        this.scene3d.focusPierCamera()
        onReady?.()
        this.lastTs = performance.now()
        this.loop(this.lastTs)
      },
      (e: unknown) => onError?.(e instanceof Error ? e.message : '場景載入失敗'),
    )
  }

  destroy(): void {
    cancelAnimationFrame(this.raf)
    this.scene3d.dispose()
  }

  getStats(): SessionStats {
    return { ...this.stats }
  }

  setViewControls(enabled: boolean): void {
    this.scene3d.setControlsEnabled(enabled)
  }

  isViewControlsEnabled(): boolean {
    return this.scene3d.isControlsEnabled()
  }

  resetCameraView(): void {
    this.scene3d.resetCamera()
  }

  applyCameraPreset(preset: CameraPreset): void {
    this.scene3d.applyCameraPreset(preset)
  }

  goIntro(): void {
    this.phase = 'intro'
    const spot = FISHING_SPOTS[this.spotId]
    this.setDialogue('阿公', `${spot.sceneTitle}夜風大，帥帥先學會拋竿與看浮標。`)
    this.emitUi()
  }

  startFishing(): void {
    this.phase = 'idle'
    this.scene3d.focusPierCamera()
    this.setDialogue('帥帥', '好！我要釣一尾大的給阿公看！')
    this.resetCast()
    this.emitUi()
  }

  beginCast(): void {
    if (this.phase !== 'idle' && this.phase !== 'result') return
    this.phase = 'casting'
    this.castMeter = 0
    this.castDir = 1
    this.setDialogue('阿公', '指標在綠區時按「拋竿」，落點會比較準。')
    this.emitUi()
  }

  confirmCast(): void {
    if (this.phase !== 'casting') return
    const center = 0.5
    const dist = Math.abs(this.castMeter - center)
    this.castQuality = Math.max(0.15, 1 - dist * 2.2)
    this.phase = 'waiting'
    this.waitTime = 0
    this.waitTarget = 1.8 + Math.random() * 4.5
    this.bobberPhase = 0
    this.setDialogue('阿公', '浮標穩了，耐心等。這裡的魚有時會慢半拍才咬。')
    this.emitUi()
  }

  hookFish(): void {
    if (this.phase !== 'bite') return
    this.phase = 'reeling'
    this.reelProgress = 0
    this.tension = 25
    this.setDialogue('帥帥', '中了！阿公，幫我看一下！')
    this.emitUi()
  }

  reelTap(): void {
    if (this.phase !== 'reeling') return
    this.reelProgress = Math.min(100, this.reelProgress + 7 + this.castQuality * 4)
    this.tension = Math.min(100, this.tension + 14 + Math.random() * 8)
    if (this.reelProgress >= 100) {
      this.finishCatch(true)
    } else if (this.tension >= 98) {
      this.finishCatch(false)
    }
    this.emitUi()
  }

  missHook(): void {
    if (this.phase !== 'bite') return
    this.finishCatch(false, true)
  }

  backToIdle(): void {
    this.phase = 'idle'
    this.lastCatch = null
    this.pendingFish = null
    this.resultNewDex = false
    this.resultSpeciesRecord = false
    this.resultGlobalRecord = false
    this.setDialogue('阿公', GRANDPA_TIPS[Math.floor(Math.random() * GRANDPA_TIPS.length)]!)
    this.emitUi()
  }

  private finishCatch(success: boolean, missedHook = false): void {
    this.phase = 'result'
    this.resultSuccess = success
    this.resultNewDex = false
    this.resultSpeciesRecord = false
    this.resultGlobalRecord = false
    if (success && this.pendingFish) {
      this.lastCatch = this.pendingFish
      this.stats.totalCatch += 1
      this.stats.totalKg = Math.round((this.stats.totalKg + this.pendingFish.kg) * 100) / 100
      if (this.pendingFish.kg > this.stats.bestKg) this.stats.bestKg = this.pendingFish.kg
      saveStats(this.stats)
      const dex = recordDexCatch(this.pendingFish.species.id, this.pendingFish.kg)
      this.resultNewDex = dex.isNew
      this.resultSpeciesRecord = dex.isSpeciesRecord
      this.resultGlobalRecord = dex.isGlobalRecord
      this.setDialogue('阿公', this.pendingFish.species.grandpaLine)
    } else if (missedHook) {
      this.lastCatch = null
      this.setDialogue('阿公', '慢了一點，魚把餌帶走了。沒關係，再拋一次。')
    } else {
      this.lastCatch = null
      this.setDialogue('阿公', '線太緊會斷，下次張一下、放一下。')
    }
    this.pendingFish = null
    this.emitUi()
  }

  private resetCast(): void {
    this.castMeter = 0
    this.castQuality = 0.5
    this.reelProgress = 0
    this.tension = 0
    this.hookTimer = 0
  }

  private setDialogue(speaker: '阿公' | '帥帥', text: string): void {
    this.dialogueSpeaker = speaker
    this.dialogueText = text
  }

  private emitUi(): void {
    this.onUi({
      phase: this.phase,
      dialogueSpeaker: this.dialogueSpeaker,
      dialogueText: this.dialogueText,
      castMeter: this.castMeter,
      castQuality: this.castQuality,
      waitPulse: this.bobberPhase,
      hookTimer: this.hookTimer,
      reelProgress: this.reelProgress,
      tension: this.tension,
      lastCatch: this.lastCatch,
      resultSuccess: this.resultSuccess,
      stats: { ...this.stats },
      bobberY: 0,
      dexProgress: getDexProgress(),
      resultNewDex: this.resultNewDex,
      resultSpeciesRecord: this.resultSpeciesRecord,
      resultGlobalRecord: this.resultGlobalRecord,
      spotId: this.spotId,
      viewRef: this.scene3d.getViewRefLabel(),
      museumPresetLabel: this.scene3d.getMuseumPresetLabel(),
    })
  }

  private loop = (ts: number): void => {
    if (!this.scene3d.isReady()) return
    const dt = Math.min((ts - this.lastTs) / 1000, 0.05)
    this.lastTs = ts
    this.update(dt)
    this.scene3d.render(
      {
        phase: this.phase,
        bobberPhase: this.bobberPhase,
        wavePhase: this.wavePhase,
        castQuality: this.castQuality,
        castMeter: this.castMeter,
        reelProgress: this.reelProgress,
        tension: this.tension,
      },
      dt,
    )
    this.raf = requestAnimationFrame(this.loop)
  }

  private update(dt: number): void {
    this.wavePhase += dt * 1.2
    this.bobberPhase += dt * (this.phase === 'bite' ? 9 : 2.5)

    if (this.phase === 'casting') {
      this.castMeter += this.castDir * dt * 0.85
      if (this.castMeter >= 1) {
        this.castMeter = 1
        this.castDir = -1
      } else if (this.castMeter <= 0) {
        this.castMeter = 0
        this.castDir = 1
      }
      this.emitUi()
    }

    if (this.phase === 'waiting') {
      this.waitTime += dt
      if (this.waitTime >= this.waitTarget) {
        this.phase = 'bite'
        this.hookTimer = this.hookWindow
        this.pendingFish = pickFish(this.castQuality)
        this.setDialogue('帥帥', '浮標下去了！快！')
        this.emitUi()
      }
    }

    if (this.phase === 'bite') {
      this.hookTimer -= dt
      if (this.hookTimer <= 0) {
        this.missHook()
      } else {
        this.emitUi()
      }
    }

    if (this.phase === 'reeling') {
      this.tension = Math.max(0, this.tension - this.tensionDecay * dt)
      this.reelProgress = Math.max(0, this.reelProgress - dt * 2.5)
      if (this.tension >= 95 && Math.random() < dt * 0.35) {
        this.finishCatch(false)
      }
      this.emitUi()
    }
  }
}
