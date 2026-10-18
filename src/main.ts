import './style.css'
import { formatKg } from './game/fish.ts'
import { BadouziFishingGame, type FishingPhase, type GameUiState } from './game/fishingGame.ts'
import {
  buildDexCards,
  formatRecordWeight,
  getDexProgress,
  getGlobalBestRecord,
  getRankedWeightRecords,
  harborLabel,
  rarityLabel,
} from './game/fishDex.ts'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `
  <div class="game-shell">
    <div class="loading" id="loading">
      <div class="spinner" aria-hidden="true"></div>
      <span id="loading-text">載入八斗子 3D 場景…</span>
    </div>
    <div class="error-banner" id="error" hidden></div>
    <canvas class="game-canvas" id="canvas" aria-label="基隆八斗子俯視3D釣魚場景"></canvas>

    <header class="hud" id="hud">
      <div class="hud-block">
        <span class="hud-label">基隆 · 八斗子</span>
        <span class="hud-value hud-value--small" id="catch-count">0 尾</span>
      </div>
      <button type="button" class="btn-dex-fab" id="btn-dex" aria-label="魚類圖鑑">
        <span class="btn-dex-fab__icon" aria-hidden="true">📖</span>
        <span class="btn-dex-fab__label" id="dex-progress">0/0</span>
      </button>
      <div class="hud-block hud-block--end">
        <span class="hud-label">累計重量</span>
        <span class="hud-value" id="total-kg">0 公克</span>
      </div>
    </header>

    <div class="view-toolbar" id="view-toolbar" hidden>
      <p class="view-ref">實比例模型：1 單位 = 1 公尺 · 八斗子漁港／海科館配置參考</p>
      <div class="view-row">
        <button type="button" class="btn-chip" id="btn-view-toggle" aria-pressed="false">調整視角</button>
        <button type="button" class="btn-chip" data-preset="overview">俯瞰</button>
        <button type="button" class="btn-chip" data-preset="pier">堤岸</button>
        <button type="button" class="btn-chip" data-preset="sea">海面</button>
        <button type="button" class="btn-chip" data-preset="museum">海科館</button>
        <button type="button" class="btn-chip" id="btn-view-reset">重置</button>
      </div>
      <p class="view-hint" id="view-hint" hidden>單指旋轉 · 雙指縮放／平移</p>
    </div>

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
      <h1 class="overlay-title">帥帥與阿公<br/>釣魚記</h1>
      <p class="overlay-sub">跟著阿公在防波堤邊學釣魚：拋竿、看浮標、刺魚、收線。魚種參考八斗子、碧砂漁港近海常見的魚。</p>
      <button type="button" class="btn-primary" id="btn-menu-start">開始故事</button>
      <button type="button" class="btn-dex-link" id="btn-dex-menu">魚類圖鑑 · <span id="dex-progress-menu">0/0</span></button>
      <p class="hint">釣魚按鈕在下方 · 遊戲中可開「調整視角」瀏覽 3D 場景</p>
    </div>

    <div class="overlay" id="intro" hidden>
      <h1 class="overlay-title overlay-title--sm">八斗子的早晨</h1>
      <p class="overlay-sub overlay-story">
        帥帥提著小桶，跟在阿公後面走上八斗子漁港旁的堤岸。遠處有船出港，海科館方向的海風帶著一點鹹味。
        阿公說：「今天不拼紀錄，先把基本功練好。」
      </p>
      <button type="button" class="btn-primary" id="btn-intro-go">跟阿公一起釣</button>
    </div>

    <div class="overlay overlay--result" id="result" hidden>
      <div class="catch-card" id="catch-card">
        <span class="catch-emoji" id="catch-emoji">🐟</span>
        <h2 class="catch-name" id="catch-name">—</h2>
        <p class="catch-weight" id="catch-weight"></p>
        <p class="dex-badge" id="dex-new-badge" hidden>圖鑑新登錄！</p>
        <p class="dex-badge dex-badge--record" id="dex-record-badge" hidden>此魚種最大紀錄！</p>
        <p class="dex-badge dex-badge--global" id="dex-global-badge" hidden>全圖鑑最大紀錄！</p>
      </div>
      <p class="overlay-sub" id="result-msg"></p>
      <button type="button" class="btn-primary" id="btn-again">再釣一竿</button>
    </div>

    <div class="overlay overlay--dex" id="dex-overlay" hidden>
      <div class="dex-panel" role="dialog" aria-labelledby="dex-title">
        <header class="dex-header">
          <h2 class="dex-title" id="dex-title">八斗子魚類圖鑑</h2>
          <p class="dex-summary" id="dex-summary">已收集 0 / 0 種</p>
          <p class="dex-record-global" id="dex-record-global">最大釣獲紀錄：尚無</p>
          <ol class="dex-record-list" id="dex-record-list" hidden></ol>
          <p class="dex-hint">八斗子、碧砂漁港魚種 · 成功釣起後自動登錄 · 本機保存</p>
        </header>
        <div class="dex-grid" id="dex-grid"></div>
        <button type="button" class="btn-primary" id="btn-dex-close">關閉</button>
      </div>
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
const dexOverlayEl = document.querySelector<HTMLDivElement>('#dex-overlay')!
const dexGridEl = document.querySelector<HTMLDivElement>('#dex-grid')!
const dexSummaryEl = document.querySelector<HTMLParagraphElement>('#dex-summary')!
const dexRecordGlobalEl = document.querySelector<HTMLParagraphElement>('#dex-record-global')!
const dexRecordListEl = document.querySelector<HTMLOListElement>('#dex-record-list')!
const dexProgressEl = document.querySelector<HTMLSpanElement>('#dex-progress')!
const dexProgressMenuEl = document.querySelector<HTMLSpanElement>('#dex-progress-menu')!
const hudEl = document.querySelector<HTMLElement>('#hud')!

function formatDexProgressText(progress: { unlocked: number; total: number }): string {
  return `${progress.unlocked}/${progress.total}`
}

function renderFishDex(): void {
  const progress = getDexProgress()
  dexSummaryEl.textContent = `已收集 ${progress.unlocked} / ${progress.total} 種`
  dexProgressEl.textContent = formatDexProgressText(progress)
  dexProgressMenuEl.textContent = formatDexProgressText(progress)

  const globalBest = getGlobalBestRecord()
  if (globalBest) {
    dexRecordGlobalEl.textContent = `最大釣獲紀錄：${globalBest.species.name} · ${formatRecordWeight(globalBest.kg)}`
  } else {
    dexRecordGlobalEl.textContent = '最大釣獲紀錄：尚無'
  }

  const ranked = getRankedWeightRecords(5)
  if (ranked.length === 0) {
    dexRecordListEl.hidden = true
    dexRecordListEl.innerHTML = ''
  } else {
    dexRecordListEl.hidden = false
    dexRecordListEl.innerHTML = ranked
      .map(
        (row, i) =>
          `<li><span class="dex-record-list__rank">${i + 1}</span><span class="dex-record-list__name">${row.species.name}</span><span class="dex-record-list__kg">${formatRecordWeight(row.bestKg)}</span></li>`,
      )
      .join('')
  }

  const globalBestId = globalBest?.species.id ?? null

  dexGridEl.innerHTML = buildDexCards()
    .map((card) => {
      if (!card.unlocked) {
        return `
          <article class="dex-card dex-card--locked">
            <span class="dex-card__emoji dex-card__emoji--silhouette" aria-hidden="true">？</span>
            <h3 class="dex-card__name">未解鎖</h3>
            <p class="dex-card__note">釣起後解鎖名稱與說明。</p>
            <span class="dex-card__tag dex-card__tag--rarity">${rarityLabel(card.species.rarity)}</span>
            <span class="dex-card__harbor dex-card__harbor--muted">${harborLabel(card.species)}</span>
          </article>
        `
      }
      const best = formatRecordWeight(card.bestKg)
      const isGlobal = globalBestId === card.species.id
      return `
        <article class="dex-card dex-card--unlocked${isGlobal ? ' dex-card--record-top' : ''}">
          <span class="dex-card__emoji" aria-hidden="true">${card.species.emoji}</span>
          <h3 class="dex-card__name">${card.species.name}</h3>
          <p class="dex-card__note">${card.species.dexNote}</p>
          <div class="dex-card__record">
            <span class="dex-card__record-label">最大釣獲</span>
            <span class="dex-card__record-value">${best}</span>
          </div>
          <dl class="dex-card__stats">
            <div><dt>釣獲次數</dt><dd>${card.count} 次</dd></div>
          </dl>
          <span class="dex-card__tag dex-card__tag--rarity">${rarityLabel(card.species.rarity)}</span>
          <span class="dex-card__harbor">${harborLabel(card.species)}</span>
        </article>
      `
    })
    .join('')
}

function openFishDex(): void {
  renderFishDex()
  dexOverlayEl.hidden = false
}

function closeFishDex(): void {
  dexOverlayEl.hidden = true
}

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
  document.querySelector<HTMLDivElement>('#view-toolbar')!.hidden = !inGame
  hudEl.hidden = phase === 'menu'
  document.querySelector<HTMLButtonElement>('#btn-dex')!.hidden = !inGame
}

function applyUi(state: GameUiState): void {
  setOverlays(state.phase)

  catchCountEl.textContent = `${state.stats.totalCatch} 尾`
  dexProgressEl.textContent = formatDexProgressText(state.dexProgress)
  dexProgressMenuEl.textContent = formatDexProgressText(state.dexProgress)
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
    const dexBadge = document.querySelector<HTMLParagraphElement>('#dex-new-badge')!
    const recordBadge = document.querySelector<HTMLParagraphElement>('#dex-record-badge')!
    const globalBadge = document.querySelector<HTMLParagraphElement>('#dex-global-badge')!
    if (state.resultSuccess && state.lastCatch) {
      card.hidden = false
      emoji.textContent = state.lastCatch.species.emoji
      name.textContent = state.lastCatch.species.name
      weight.textContent = formatKg(state.lastCatch.kg)
      dexBadge.hidden = !state.resultNewDex
      recordBadge.hidden =
        !state.resultSpeciesRecord || state.resultGlobalRecord || state.resultNewDex
      globalBadge.hidden = !state.resultGlobalRecord
      msg.textContent = '帥帥把魚放進桶裡，阿公點點頭。'
    } else {
      card.hidden = true
      dexBadge.hidden = true
      recordBadge.hidden = true
      globalBadge.hidden = true
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
  setOverlays('menu')
  renderFishDex()
  game.init(
    () => {
      loadingEl.hidden = true
    },
    (message) => {
      loadingEl.hidden = true
      showError(message)
    },
  )
} catch (e) {
  loadingEl.hidden = true
  showError(e instanceof Error ? e.message : '遊戲初始化失敗，請重新整理頁面')
}

document.querySelector('#btn-menu-start')!.addEventListener('click', () => {
  game.goIntro()
})

document.querySelector('#btn-dex-menu')!.addEventListener('click', () => {
  openFishDex()
})

document.querySelector('#btn-dex')!.addEventListener('click', () => {
  openFishDex()
})

document.querySelector('#btn-dex-close')!.addEventListener('click', () => {
  closeFishDex()
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

const viewToggle = document.querySelector<HTMLButtonElement>('#btn-view-toggle')!
const viewHint = document.querySelector<HTMLParagraphElement>('#view-hint')!

viewToggle.addEventListener('click', () => {
  if (!game) return
  const next = !game.isViewControlsEnabled()
  game.setViewControls(next)
  viewToggle.setAttribute('aria-pressed', String(next))
  viewToggle.classList.toggle('btn-chip--active', next)
  viewHint.hidden = !next
})

document.querySelector('#btn-view-reset')!.addEventListener('click', () => {
  game?.resetCameraView()
})

document.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const preset = btn.dataset.preset as 'overview' | 'pier' | 'sea' | 'museum'
    game?.applyCameraPreset(preset)
  })
})
