const STORAGE_KEY = 'aurora-rush-best'

export type GamePhase = 'menu' | 'playing' | 'gameover'

interface Meteor {
  x: number
  y: number
  r: number
  vy: number
  vx: number
  rot: number
  rotSpeed: number
}

function loadBest(): number {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v ? Math.max(0, parseInt(v, 10) || 0) : 0
  } catch {
    return 0
  }
}

function saveBest(score: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(score))
  } catch {
    /* ignore */
  }
}

export class AuroraRushGame {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private phase: GamePhase = 'menu'
  private score = 0
  private best = loadBest()
  private lives = 3
  private elapsed = 0
  private spawnTimer = 0
  private invuln = 0
  private playerX = 0
  private targetX = 0
  private meteors: Meteor[] = []
  private stars: { x: number; y: number; s: number; sp: number }[] = []
  private raf = 0
  private lastTs = 0
  private width = 0
  private height = 0
  private dpr = 1
  private lastHudScore = -1

  private onPhaseChange: (phase: GamePhase) => void
  private onHudUpdate: (data: {
    score: number
    best: number
    lives: number
  }) => void

  constructor(
    canvas: HTMLCanvasElement,
    callbacks: {
      onPhaseChange: (phase: GamePhase) => void
      onHudUpdate: (data: { score: number; best: number; lives: number }) => void
    },
  ) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('無法初始化畫布')
    this.canvas = canvas
    this.ctx = ctx
    this.onPhaseChange = callbacks.onPhaseChange
    this.onHudUpdate = callbacks.onHudUpdate
    this.bindInput()
  }

  init(): void {
    this.resize()
    this.initStars()
    window.addEventListener('resize', this.handleResize)
    this.emitHud()
    this.onPhaseChange('menu')
    this.lastTs = performance.now()
    this.loop(this.lastTs)
  }

  destroy(): void {
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.handleResize)
  }

  startGame(): void {
    this.phase = 'playing'
    this.score = 0
    this.lives = 3
    this.elapsed = 0
    this.spawnTimer = 0
    this.invuln = 0
    this.meteors = []
    this.lastHudScore = -1
    this.playerX = this.width / 2
    this.targetX = this.playerX
    this.onPhaseChange('playing')
    this.emitHud()
  }

  getPhase(): GamePhase {
    return this.phase
  }

  getScore(): number {
    return this.score
  }

  getBest(): number {
    return this.best
  }

  private handleResize = (): void => {
    this.resize()
    this.initStars()
  }

  private bindInput(): void {
    const setTarget = (clientX: number) => {
      if (this.phase !== 'playing') return
      const rect = this.canvas.getBoundingClientRect()
      this.targetX = ((clientX - rect.left) / rect.width) * this.width
    }

    this.canvas.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault()
        if (e.touches[0]) setTarget(e.touches[0].clientX)
      },
      { passive: false },
    )
    this.canvas.addEventListener(
      'touchmove',
      (e) => {
        e.preventDefault()
        if (e.touches[0]) setTarget(e.touches[0].clientX)
      },
      { passive: false },
    )
    this.canvas.addEventListener('mousemove', (e) => {
      if (e.buttons) setTarget(e.clientX)
    })
  }

  private resize(): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    const rect = this.canvas.getBoundingClientRect()
    this.width = Math.max(rect.width, 320)
    this.height = Math.max(rect.height, 400)
    this.canvas.width = Math.floor(this.width * this.dpr)
    this.canvas.height = Math.floor(this.height * this.dpr)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    if (this.playerX === 0) {
      this.playerX = this.width / 2
      this.targetX = this.playerX
    }
  }

  private initStars(): void {
    const count = Math.floor((this.width * this.height) / 3500)
    this.stars = Array.from({ length: count }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      s: Math.random() * 2 + 0.5,
      sp: Math.random() * 0.4 + 0.15,
    }))
  }

  private emitHud(): void {
    this.onHudUpdate({ score: this.score, best: this.best, lives: this.lives })
  }

  private loop = (ts: number): void => {
    const dt = Math.min((ts - this.lastTs) / 1000, 0.05)
    this.lastTs = ts
    this.update(dt)
    this.draw()
    this.raf = requestAnimationFrame(this.loop)
  }

  private difficulty(): number {
    return 1 + this.elapsed / 45
  }

  private update(dt: number): void {
    for (const star of this.stars) {
      star.y += star.sp * 60 * dt
      if (star.y > this.height) {
        star.y = 0
        star.x = Math.random() * this.width
      }
    }

    if (this.phase !== 'playing') return

    this.elapsed += dt
    this.score += Math.floor(dt * 10 * this.difficulty())
    this.spawnTimer -= dt
    if (this.spawnTimer <= 0) {
      this.spawnMeteor()
      this.spawnTimer = Math.max(0.35, 1.1 - this.elapsed * 0.012)
    }

    const shipR = this.shipRadius()
    const margin = shipR + 8
    this.targetX = Math.max(margin, Math.min(this.width - margin, this.targetX))
    this.playerX += (this.targetX - this.playerX) * Math.min(1, dt * 14)

    if (this.invuln > 0) this.invuln -= dt

    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i]!
      m.x += m.vx * dt
      m.y += m.vy * dt
      m.rot += m.rotSpeed * dt
      if (m.y - m.r > this.height + 20) {
        this.meteors.splice(i, 1)
        continue
      }
      if (this.invuln <= 0 && this.hitTest(m, shipR)) {
        this.meteors.splice(i, 1)
        this.lives -= 1
        this.invuln = 1.2
        this.emitHud()
        if (this.lives <= 0) {
          this.endGame()
        }
      }
    }

    const scoreInt = Math.floor(this.score)
    if (scoreInt !== this.lastHudScore) {
      this.lastHudScore = scoreInt
      this.emitHud()
    }
  }

  private spawnMeteor(): void {
    const diff = this.difficulty()
    const r = 14 + Math.random() * 22 * Math.min(diff, 2)
    const x = r + Math.random() * (this.width - 2 * r)
    this.meteors.push({
      x,
      y: -r - 10,
      r,
      vy: (120 + Math.random() * 80) * diff,
      vx: (Math.random() - 0.5) * 40 * diff,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 4,
    })
  }

  private shipRadius(): number {
    return Math.min(22, this.width * 0.06)
  }

  private hitTest(m: Meteor, shipR: number): boolean {
    const py = this.height - 56
    const dx = m.x - this.playerX
    const dy = m.y - py
    return dx * dx + dy * dy < (m.r + shipR * 0.75) ** 2
  }

  private endGame(): void {
    if (this.score > this.best) {
      this.best = this.score
      saveBest(this.best)
    }
    this.phase = 'gameover'
    this.onPhaseChange('gameover')
    this.emitHud()
  }

  private draw(): void {
    const { ctx, width, height } = this
    ctx.clearRect(0, 0, width, height)

    for (const star of this.stars) {
      ctx.fillStyle = `rgba(255,255,255,${0.25 + star.s * 0.2})`
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.s * 0.6, 0, Math.PI * 2)
      ctx.fill()
    }

    const grad = ctx.createLinearGradient(0, height * 0.6, 0, height)
    grad.addColorStop(0, 'rgba(88, 28, 135, 0)')
    grad.addColorStop(1, 'rgba(88, 28, 135, 0.25)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)

    for (const m of this.meteors) {
      ctx.save()
      ctx.translate(m.x, m.y)
      ctx.rotate(m.rot)
      const g = ctx.createRadialGradient(-m.r * 0.3, -m.r * 0.3, 0, 0, 0, m.r)
      g.addColorStop(0, '#64748b')
      g.addColorStop(0.6, '#334155')
      g.addColorStop(1, '#1e293b')
      ctx.fillStyle = g
      ctx.beginPath()
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        const rr = m.r * (0.85 + (i % 2) * 0.15)
        const px = Math.cos(a) * rr
        const py = Math.sin(a) * rr
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    this.drawShip()

    if (this.phase === 'menu') {
      ctx.fillStyle = 'rgba(5, 8, 16, 0.35)'
      ctx.fillRect(0, 0, width, height)
    }
  }

  private drawShip(): void {
    const { ctx, width, height } = this
    const x = this.playerX
    const y = height - 56
    const r = this.shipRadius()
    const blink = this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 0
    if (blink) return

    ctx.save()
    ctx.translate(x, y)

    ctx.shadowColor = 'rgba(125, 211, 252, 0.8)'
    ctx.shadowBlur = 16

    const body = ctx.createLinearGradient(0, -r, 0, r)
    body.addColorStop(0, '#e0f2fe')
    body.addColorStop(0.5, '#7dd3fc')
    body.addColorStop(1, '#6366f1')
    ctx.fillStyle = body
    ctx.beginPath()
    ctx.moveTo(0, -r * 1.2)
    ctx.lineTo(r * 0.95, r * 0.85)
    ctx.lineTo(0, r * 0.45)
    ctx.lineTo(-r * 0.95, r * 0.85)
    ctx.closePath()
    ctx.fill()

    ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.beginPath()
    ctx.ellipse(0, -r * 0.15, r * 0.22, r * 0.35, 0, 0, Math.PI * 2)
    ctx.fill()

    const flame = 0.5 + Math.sin(this.elapsed * 18) * 0.25
    const fg = ctx.createLinearGradient(0, r * 0.5, 0, r * 1.4)
    fg.addColorStop(0, `rgba(251, 191, 36, ${flame})`)
    fg.addColorStop(1, 'rgba(249, 115, 22, 0)')
    ctx.fillStyle = fg
    ctx.beginPath()
    ctx.moveTo(-r * 0.35, r * 0.55)
    ctx.lineTo(0, r * (1.1 + flame * 0.3))
    ctx.lineTo(r * 0.35, r * 0.55)
    ctx.closePath()
    ctx.fill()

    ctx.restore()

    if (width > 0) {
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.08)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(width * 0.1, y + r)
      ctx.lineTo(width * 0.9, y + r)
      ctx.stroke()
    }
  }
}
