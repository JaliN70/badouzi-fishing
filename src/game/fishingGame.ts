import { pickFish, type FishSpecies } from './fish.ts'

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
  dialogueSpeaker: '爺爺' | '帥帥' | ''
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
  '帥帥，八斗子早上風小，線拋穩一點就好。',
  '看浮標，只有猛沉下去那一下才刺。',
  '魚在掙扎時別硬拉，張一下、放一下。',
  '後面就是國立海洋科技博物館，海流從這裡轉進來。',
  '記得，釣完要把垃圾帶走，港邊才會一直漂亮。',
]

export class BadouziFishingGame {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private phase: FishingPhase = 'menu'
  private stats = loadStats()
  private raf = 0
  private lastTs = 0
  private width = 0
  private height = 0
  private dpr = 1

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
  private dialogueSpeaker: '爺爺' | '帥帥' | '' = ''
  private dialogueText = ''
  private bobberPhase = 0
  private wavePhase = 0

  private onUi: (state: GameUiState) => void

  constructor(canvas: HTMLCanvasElement, onUi: (state: GameUiState) => void) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('無法初始化畫布')
    this.canvas = canvas
    this.ctx = ctx
    this.onUi = onUi
  }

  init(): void {
    this.resize()
    window.addEventListener('resize', this.handleResize)
    this.setDialogue('爺爺', '帥帥，今天爺爺帶你來八斗子漁港邊。準備好了就按開始。')
    this.emitUi()
    this.lastTs = performance.now()
    this.loop(this.lastTs)
  }

  destroy(): void {
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.handleResize)
  }

  getStats(): SessionStats {
    return { ...this.stats }
  }

  goIntro(): void {
    this.phase = 'intro'
    this.setDialogue(
      '爺爺',
      '這裡是基隆八斗子，防波堤外就是船進出的水道。帥帥，先學會拋竿與看浮標。',
    )
    this.emitUi()
  }

  startFishing(): void {
    this.phase = 'idle'
    this.setDialogue('帥帥', '好！我要釣一尾大的給爺爺看！')
    this.resetCast()
    this.emitUi()
  }

  beginCast(): void {
    if (this.phase !== 'idle' && this.phase !== 'result') return
    this.phase = 'casting'
    this.castMeter = 0
    this.castDir = 1
    this.setDialogue('爺爺', '指標在綠區時按「拋竿」，落點會比較準。')
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
    this.setDialogue('爺爺', '浮標穩了，耐心等。八斗子的魚有時會慢半拍才咬。')
    this.emitUi()
  }

  hookFish(): void {
    if (this.phase !== 'bite') return
    this.phase = 'reeling'
    this.reelProgress = 0
    this.tension = 25
    this.setDialogue('帥帥', '中了！爺爺，幫我看一下！')
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
    this.setDialogue('爺爺', GRANDPA_TIPS[Math.floor(Math.random() * GRANDPA_TIPS.length)]!)
    this.emitUi()
  }

  private finishCatch(success: boolean, missedHook = false): void {
    this.phase = 'result'
    this.resultSuccess = success
    if (success && this.pendingFish) {
      this.lastCatch = this.pendingFish
      this.stats.totalCatch += 1
      this.stats.totalKg = Math.round((this.stats.totalKg + this.pendingFish.kg) * 100) / 100
      if (this.pendingFish.kg > this.stats.bestKg) this.stats.bestKg = this.pendingFish.kg
      saveStats(this.stats)
      this.setDialogue('爺爺', this.pendingFish.species.grandpaLine)
    } else if (missedHook) {
      this.lastCatch = null
      this.setDialogue('爺爺', '慢了一點，魚把餌帶走了。沒關係，再拋一次。')
    } else {
      this.lastCatch = null
      this.setDialogue('爺爺', '線太緊會斷，下次張一下、放一下。')
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

  private setDialogue(speaker: '爺爺' | '帥帥', text: string): void {
    this.dialogueSpeaker = speaker
    this.dialogueText = text
  }

  private handleResize = (): void => {
    this.resize()
  }

  private resize(): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    const rect = this.canvas.getBoundingClientRect()
    this.width = Math.max(rect.width, 320)
    this.height = Math.max(rect.height, 400)
    this.canvas.width = Math.floor(this.width * this.dpr)
    this.canvas.height = Math.floor(this.height * this.dpr)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
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
      bobberY: this.getBobberY(),
    })
  }

  private getBobberY(): number {
    const waterTop = this.height * 0.52
    return waterTop + 12 + Math.sin(this.bobberPhase) * (this.phase === 'bite' ? 6 : 3)
  }

  private loop = (ts: number): void => {
    const dt = Math.min((ts - this.lastTs) / 1000, 0.05)
    this.lastTs = ts
    this.update(dt)
    this.draw()
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

  private draw(): void {
    const { ctx, width, height } = this
    ctx.clearRect(0, 0, width, height)

    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.55)
    sky.addColorStop(0, '#7ec8e3')
    sky.addColorStop(0.45, '#c5e8f7')
    sky.addColorStop(1, '#f5e6c8')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, width, height)

    this.drawHills()
    this.drawHarbor()
    this.drawPier()
    this.drawCharacters()
    this.drawWater()
    this.drawFishingLine()
  }

  private drawHills(): void {
    const { ctx, width, height } = this
    const base = height * 0.38
    ctx.fillStyle = '#3d6b4f'
    ctx.beginPath()
    ctx.moveTo(0, base + 40)
    for (let x = 0; x <= width; x += 20) {
      const y = base + Math.sin(x * 0.008) * 18 + Math.cos(x * 0.015) * 10
      ctx.lineTo(x, y)
    }
    ctx.lineTo(width, height * 0.55)
    ctx.lineTo(0, height * 0.55)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    ctx.font = '600 11px system-ui, sans-serif'
    ctx.fillText('基隆 · 八斗子', width - 88, base - 8)
  }

  private drawHarbor(): void {
    const { ctx, width, height } = this
    const waterLine = height * 0.52
    ctx.fillStyle = '#5a6a7a'
    ctx.fillRect(0, waterLine - 28, width * 0.55, 8)

    ctx.fillStyle = '#8b4518'
    ctx.beginPath()
    ctx.moveTo(width * 0.08, waterLine - 20)
    ctx.lineTo(width * 0.22, waterLine - 20)
    ctx.lineTo(width * 0.2, waterLine + 5)
    ctx.lineTo(width * 0.06, waterLine + 5)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(width * 0.11, waterLine - 32, 14, 12)
    ctx.fillStyle = '#c0392b'
    ctx.fillRect(width * 0.13, waterLine - 30, 10, 8)

    ctx.fillStyle = '#4a5568'
    ctx.fillRect(width * 0.48, waterLine - 35, 3, 35)
    ctx.fillStyle = '#718096'
    ctx.beginPath()
    ctx.arc(width * 0.485, waterLine - 38, 6, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawPier(): void {
    const { ctx, width, height } = this
    const y = height * 0.58
    const grad = ctx.createLinearGradient(0, y, 0, height)
    grad.addColorStop(0, '#9ca3af')
    grad.addColorStop(0.15, '#6b7280')
    grad.addColorStop(1, '#4b5563')
    ctx.fillStyle = grad
    ctx.fillRect(0, y, width, height - y)

    ctx.strokeStyle = 'rgba(0,0,0,0.15)'
    ctx.lineWidth = 1
    for (let i = 0; i < 8; i++) {
      const py = y + 18 + i * 22
      ctx.beginPath()
      ctx.moveTo(0, py)
      ctx.lineTo(width, py)
      ctx.stroke()
    }

    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.font = '500 10px system-ui, sans-serif'
    ctx.fillText('漁港邊防波堤', 12, y + 16)
  }

  private drawCharacters(): void {
    const { width, height } = this
    const pierY = height * 0.58
    const gx = width * 0.22
    const sx = width * 0.42

    this.drawGrandpa(gx, pierY + 8)
    this.drawShuaiShuai(sx, pierY + 4)
  }

  private drawGrandpa(x: number, y: number): void {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(x, y)

    ctx.fillStyle = '#78716c'
    ctx.beginPath()
    ctx.ellipse(0, 38, 28, 10, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#57534e'
    ctx.fillRect(-18, 18, 36, 22)
    ctx.fillStyle = '#a8a29e'
    ctx.fillRect(-20, 8, 40, 14)

    ctx.fillStyle = '#fecaca'
    ctx.beginPath()
    ctx.arc(0, -2, 14, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#e7e5e4'
    ctx.beginPath()
    ctx.arc(0, -6, 15, Math.PI, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#44403c'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('爺爺', 0, -22)

    ctx.fillStyle = '#854d0e'
    ctx.fillRect(22, 28, 20, 14)
    ctx.fillStyle = '#57534e'
    ctx.fillText('水桶', 32, 50)

    ctx.restore()
  }

  private drawShuaiShuai(x: number, y: number): void {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(x, y)

    const lean = this.phase === 'reeling' ? -0.08 : this.phase === 'casting' ? 0.06 : 0
    ctx.rotate(lean)

    ctx.fillStyle = '#78716c'
    ctx.beginPath()
    ctx.ellipse(0, 42, 22, 8, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#2563eb'
    ctx.fillRect(-14, 22, 28, 20)
    ctx.fillStyle = '#fcd34d'
    ctx.fillRect(-14, 14, 28, 10)

    ctx.fillStyle = '#fde68a'
    ctx.beginPath()
    ctx.arc(0, 2, 13, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#f97316'
    ctx.beginPath()
    ctx.moveTo(-12, -4)
    ctx.lineTo(12, -4)
    ctx.lineTo(0, -18)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#1e3a8a'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('帥帥', 0, -24)

    const rodEndX = 55
    const rodEndY = -30
    ctx.strokeStyle = '#44403c'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(8, 10)
    ctx.quadraticCurveTo(30, -20, rodEndX, rodEndY)
    ctx.stroke()

    ctx.restore()
  }

  private drawWater(): void {
    const { ctx, width, height } = this
    const top = height * 0.52
    const pierTop = height * 0.58
    const grad = ctx.createLinearGradient(0, top, 0, pierTop)
    grad.addColorStop(0, '#0e7490')
    grad.addColorStop(1, '#155e75')
    ctx.fillStyle = grad
    ctx.fillRect(0, top, width, pierTop - top)

    ctx.strokeStyle = 'rgba(255,255,255,0.25)'
    ctx.lineWidth = 2
    for (let i = 0; i < 5; i++) {
      const wy = top + 8 + i * 5
      ctx.beginPath()
      for (let x = 0; x <= width; x += 8) {
        const yy = wy + Math.sin(x * 0.04 + this.wavePhase + i) * 2
        if (x === 0) ctx.moveTo(x, yy)
        else ctx.lineTo(x, yy)
      }
      ctx.stroke()
    }

    if (['waiting', 'bite', 'reeling'].includes(this.phase)) {
      const bx = this.width * 0.62
      const by = this.getBobberY()
      ctx.strokeStyle = '#292524'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(bx, by - 20)
      ctx.lineTo(bx, by - 4)
      ctx.stroke()
      ctx.fillStyle = this.phase === 'bite' ? '#ef4444' : '#dc2626'
      ctx.beginPath()
      ctx.ellipse(bx, by, 5, 7, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fef3c7'
      ctx.beginPath()
      ctx.arc(bx, by - 8, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  private drawFishingLine(): void {
    if (!['waiting', 'bite', 'reeling'].includes(this.phase)) return
    const { ctx, width, height } = this
    const sx = width * 0.42 + 55
    const sy = height * 0.58 + 4 - 30
    const bx = width * 0.62
    const by = this.getBobberY() - 8
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.quadraticCurveTo((sx + bx) / 2, sy + 40, bx, by)
    ctx.stroke()
  }
}
