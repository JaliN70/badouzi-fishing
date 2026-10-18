import './style.css'
import { formatKg } from './game/fish.ts'
import { BadouziFishingGame, type FishingPhase, type GameUiState } from './game/fishingGame.ts'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `
  <div class="game-shell">
    <div class="loading" id="loading">
      <div class="spinner" aria-hidden="true"></div>
      <span>載入八斗子海邊…</span>
    </div>
    <div class="error-banner" id="error" hidden></div>
    <canvas class="game-canvas" id="canvas" aria-label="基隆八斗子釣魚場景"></canvas>

    <header class="hud" id="hud">
      <div class="hud-block">
        <span class="hud-label">基隆 · 八斗子</span>
        <span class="hud-value hud-value--small" id="catch-count">0 尾</span>
      </div>
      <div class="hud-block hud-block--end">
        <span class="hud-label">累計重量</span>
        <span class="hud-value" id="total-kg">0 公克</span>
      </div>
    </header>

    <div class="dialogue" id="dialogue" hidden>
      <span class="dialogue-speaker" id="speaker"></span>
      <p class="dialogue-text" id="dialogue-text"></p>
    </div>

    <div class="action-panel" id="action-panel" hidden>
      <div class="meters" id="meters" hidden>
        <div class="meter" id="cast-meter-wrap" hidden>
          <span class="meter-label">拋竿力道</span>
          <div class="meter-track">
            <div class="meter-sweet"></div>
            <div class="meter-thumb" id="cast-thumb"></div>
          </div>
        </div>
        <div class="meter" id="hook-meter-wrap" hidden>
          <span class="meter-label">刺魚倒數</span>
          <div class="meter-track meter-track--plain">
            <div class="meter-fill meter-fill--urgent" id="hook-fill"></div>
          </div>
        </div>
        <div class="meter" id="reel-meter-wrap" hidden>
          <span class="meter-label">收線進度</span>
          <div class="meter-track meter-track--plain">
            <div class="meter-fill meter-fill--good" id="reel-fill"></div>
          </div>
          <span class="meter-label">線張力（太高會斷）</span>
          <div class="meter-track meter-track--plain">
            <div class="meter-fill meter-fill--tension" id="tension-fill"></div>
          </div>
        </div>
      </div>
      <button type="button" class="btn-primary" id="action-btn">開始</button>
    </div>

    <div class="overlay" id="menu">
      <p class="overlay-kicker">基隆八斗子 · 漁港晨釣</p>
      <h1 class="overlay-title">帥帥與爺爺<br/>釣魚記</h1>
      <p class="overlay-sub">跟著爺爺在防波堤邊學釣魚：拋竿、看浮標、刺魚、收線。魚種參考八斗子近海常見的魚。</p>
      <button type="button" class="btn-primary" id="btn-menu-start">開始故事</button>
      <p class="hint">單指操作 · 紀錄保存在本機</p>
    </div>

    <div class="overlay" id="intro" hidden>
      <h1 class="overlay-title overlay-title--sm">八斗子的早晨</h1>
      <p class="overlay-sub overlay-story">
        帥帥提著小桶，跟在爺爺後面走上八斗子漁港旁的堤岸。遠處有船出港，海科館方向的海風帶著一點鹹味。
        爺爺說：「今天不拼紀錄，先把基本功練好。」
      </p>
      <button type="button" class="btn-primary" id="btn-intro-go">跟爺爺一起釣</button>
    </div>

    <div class="overlay overlay--result" id="result" hidden>
      <div class="catch-card" id="catch-card">
        <span class="catch-emoji" id="catch-emoji">🐟</span>
        <h2 class="catch-name" id="catch-name">—</h2>
        <p class="catch-weight" id="catch-weight"></p>
      </div>
      <p class="overlay-sub" id="result-msg"></p>
      <button type="button" class="btn-primary" id="btn-again">再釣一竿</button>
    </div>
  </div>
`

const loadingEl = document.querySelector<HTMLDivElement>('#loading')!
const errorEl = document.querySelector<HTMLDivElement>('#error')!
const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!
const menuEl = document.querySelector<HTMLDivElement>('#menu')!
const introEl = document.querySelector<HTMLDivElement>('#intro')!
const resultEl = document.querySelector<HTMLDivElement>('#result')!
const dialogueEl = document.querySelector<HTMLDivElement>('#dialogue')!
const actionPanelEl = document.querySelector<HTMLDivElement>('#action-panel')!
const metersEl = document.querySelector<HTMLDivElement>('#meters')!
const actionBtn = document.querySelector<HTMLButtonElement>('#action-btn')!
const catchCountEl = document.querySelector<HTMLSpanElement>('#catch-count')!
const totalKgEl = document.querySelector<HTMLSpanElement>('#total-kg')!
const speakerEl = document.querySelector<HTMLSpanElement>('#speaker')!
const dialogueTextEl = document.querySelector<HTMLParagraphElement>('#dialogue-text')!

function showError(message: string): void {
  errorEl.textContent = message
  errorEl.hidden = false
}

function setOverlays(phase: FishingPhase): void {
  menuEl.hidden = phase !== 'menu'
  introEl.hidden = phase !== 'intro'
  resultEl.hidden = phase !== 'result'
  const inGame = !['menu', 'intro', 'result'].includes(phase)
  dialogueEl.hidden = !inGame
  actionPanelEl.hidden = !inGame
}

function applyUi(state: GameUiState): void {
  setOverlays(state.phase)

  catchCountEl.textContent = `${state.stats.totalCatch} 尾`
  totalKgEl.textContent =
    state.stats.totalKg >= 1
      ? `${state.stats.totalKg.toFixed(2)} 公斤`
      : `${Math.round(state.stats.totalKg * 1000)} 公克`

  if (!['menu', 'intro', 'result'].includes(state.phase)) {
    speakerEl.textContent = state.dialogueSpeaker
    dialogueTextEl.textContent = state.dialogueText
  }

  const castWrap = document.querySelector<HTMLDivElement>('#cast-meter-wrap')!
  const hookWrap = document.querySelector<HTMLDivElement>('#hook-meter-wrap')!
  const reelWrap = document.querySelector<HTMLDivElement>('#reel-meter-wrap')!

  castWrap.hidden = state.phase !== 'casting'
  hookWrap.hidden = state.phase !== 'bite'
  reelWrap.hidden = state.phase !== 'reeling'
  metersEl.hidden = state.phase !== 'casting' && state.phase !== 'bite' && state.phase !== 'reeling'

  const castThumb = document.querySelector<HTMLDivElement>('#cast-thumb')!
  castThumb.style.left = `${state.castMeter * 100}%`

  const hookFill = document.querySelector<HTMLDivElement>('#hook-fill')!
  hookFill.style.width = `${Math.max(0, (state.hookTimer / 1.4) * 100)}%`

  const reelFill = document.querySelector<HTMLDivElement>('#reel-fill')!
  reelFill.style.width = `${state.reelProgress}%`

  const tensionFill = document.querySelector<HTMLDivElement>('#tension-fill')!
  tensionFill.style.width = `${state.tension}%`

  if (state.phase === 'result') {
    const card = document.querySelector<HTMLDivElement>('#catch-card')!
    const emoji = document.querySelector<HTMLSpanElement>('#catch-emoji')!
    const name = document.querySelector<HTMLHeadingElement>('#catch-name')!
    const weight = document.querySelector<HTMLParagraphElement>('#catch-weight')!
    const msg = document.querySelector<HTMLParagraphElement>('#result-msg')!
    if (state.resultSuccess && state.lastCatch) {
      card.hidden = false
      emoji.textContent = state.lastCatch.species.emoji
      name.textContent = state.lastCatch.species.name
      weight.textContent = formatKg(state.lastCatch.kg)
      msg.textContent = '帥帥把魚放進桶裡，爺爺點點頭。'
    } else {
      card.hidden = true
      msg.textContent = state.dialogueText
    }
    return
  }

  switch (state.phase) {
    case 'idle':
      actionBtn.textContent = '拋竿'
      actionBtn.dataset.action = 'cast'
      break
    case 'casting':
      actionBtn.textContent = '拋竿！'
      actionBtn.dataset.action = 'confirm-cast'
      break
    case 'waiting':
      actionBtn.textContent = '等待咬餌…'
      actionBtn.disabled = true
      actionBtn.dataset.action = 'wait'
      break
    case 'bite':
      actionBtn.textContent = '刺魚！'
      actionBtn.disabled = false
      actionBtn.dataset.action = 'hook'
      break
    case 'reeling':
      actionBtn.textContent = '收線'
      actionBtn.disabled = false
      actionBtn.dataset.action = 'reel'
      break
    default:
      actionBtn.disabled = false
  }

  if (state.phase !== 'waiting') {
    actionBtn.disabled = false
  }
}

let game: BadouziFishingGame

try {
  game = new BadouziFishingGame(canvas, applyUi)
  game.init()
  setOverlays('menu')
  loadingEl.hidden = true
} catch (e) {
  loadingEl.hidden = true
  showError(e instanceof Error ? e.message : '遊戲初始化失敗，請重新整理頁面')
}

document.querySelector('#btn-menu-start')!.addEventListener('click', () => {
  game.goIntro()
})

document.querySelector('#btn-intro-go')!.addEventListener('click', () => {
  game.startFishing()
})

document.querySelector('#btn-again')!.addEventListener('click', () => {
  game.backToIdle()
})

actionBtn.addEventListener('click', () => {
  const action = actionBtn.dataset.action
  if (action === 'cast') game.beginCast()
  else if (action === 'confirm-cast') game.confirmCast()
  else if (action === 'hook') game.hookFish()
  else if (action === 'reel') game.reelTap()
})
