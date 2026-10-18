import './style.css'
import { AuroraRushGame, type GamePhase } from './game/game.ts'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `
  <div class="game-shell">
    <div class="loading" id="loading">
      <div class="spinner" aria-hidden="true"></div>
      <span>載入中…</span>
    </div>
    <div class="error-banner" id="error" hidden></div>
    <canvas class="game-canvas" id="canvas" aria-label="極光衝刺遊戲畫面"></canvas>
    <div class="hud" id="hud">
      <div class="hud-block">
        <span class="hud-label">分數</span>
        <span class="hud-value" id="score">0</span>
      </div>
      <div class="hud-block" style="align-items: flex-end">
        <span class="hud-label">最高紀錄</span>
        <span class="hud-value hud-value--small" id="best">0</span>
        <div class="lives" id="lives" aria-label="剩餘生命"></div>
      </div>
    </div>
    <div class="overlay" id="menu">
      <h1 class="overlay-title">極光衝刺</h1>
      <p class="overlay-sub">拖曳手指左右移動飛船，閃避墜落的隕石。撐越久，分數越高、難度也會上升。</p>
      <button type="button" class="btn-primary" id="btn-start">開始遊戲</button>
      <p class="hint">最佳紀錄：<span id="menu-best">0</span> 分</p>
    </div>
    <div class="overlay" id="gameover" hidden>
      <h1 class="overlay-title">任務結束</h1>
      <div class="overlay-stats">
        <div class="stat">
          <div class="stat-label">本次分數</div>
          <div class="stat-value" id="final-score">0</div>
        </div>
        <div class="stat">
          <div class="stat-label">最高紀錄</div>
          <div class="stat-value" id="final-best">0</div>
        </div>
      </div>
      <button type="button" class="btn-primary" id="btn-retry">再玩一次</button>
      <p class="hint">拖曳螢幕控制方向</p>
    </div>
  </div>
`

const loadingEl = document.querySelector<HTMLDivElement>('#loading')!
const errorEl = document.querySelector<HTMLDivElement>('#error')!
const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!
const menuEl = document.querySelector<HTMLDivElement>('#menu')!
const gameoverEl = document.querySelector<HTMLDivElement>('#gameover')!
const scoreEl = document.querySelector<HTMLSpanElement>('#score')!
const bestEl = document.querySelector<HTMLSpanElement>('#best')!
const menuBestEl = document.querySelector<HTMLSpanElement>('#menu-best')!
const livesEl = document.querySelector<HTMLDivElement>('#lives')!
const finalScoreEl = document.querySelector<HTMLDivElement>('#final-score')!
const finalBestEl = document.querySelector<HTMLDivElement>('#final-best')!

function renderLives(count: number): void {
  livesEl.innerHTML = ''
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('span')
    dot.className = 'life' + (i < count ? '' : ' life--empty')
    dot.setAttribute('aria-hidden', 'true')
    livesEl.appendChild(dot)
  }
}

function setOverlay(phase: GamePhase): void {
  menuEl.hidden = phase !== 'menu'
  gameoverEl.hidden = phase !== 'gameover'
}

function showError(message: string): void {
  errorEl.textContent = message
  errorEl.hidden = false
}

let game: AuroraRushGame

try {
  game = new AuroraRushGame(canvas, {
    onPhaseChange(phase) {
      setOverlay(phase)
      if (phase === 'gameover') {
        finalScoreEl.textContent = String(game.getScore())
        finalBestEl.textContent = String(game.getBest())
      }
    },
    onHudUpdate({ score, best, lives }) {
      scoreEl.textContent = String(score)
      bestEl.textContent = String(best)
      menuBestEl.textContent = String(best)
      renderLives(lives)
    },
  })
  game.init()
  loadingEl.hidden = true
} catch (e) {
  loadingEl.hidden = true
  showError(e instanceof Error ? e.message : '遊戲初始化失敗，請重新整理頁面')
}

document.querySelector('#btn-start')!.addEventListener('click', () => {
  if (game) game.startGame()
})
document.querySelector('#btn-retry')!.addEventListener('click', () => {
  if (game) game.startGame()
})
