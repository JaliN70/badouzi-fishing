import { FISH_TABLE, formatHarborSpots, type FishSpecies } from './fish.ts'

const STORAGE_KEY = 'badouzi-fishing-dex'

export interface FishDexEntry {
  count: number
  bestKg: number
  firstCaughtAt: number
}

export interface FishDexState {
  entries: Record<string, FishDexEntry>
}

export interface FishDexCard {
  species: FishSpecies
  unlocked: boolean
  count: number
  bestKg: number
  firstCaughtAt: number | null
}

export function loadFishDex(): FishDexState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { entries: {} }
    const parsed = JSON.parse(raw) as FishDexState
    if (!parsed.entries || typeof parsed.entries !== 'object') return { entries: {} }
    return parsed
  } catch {
    return { entries: {} }
  }
}

function saveFishDex(state: FishDexState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

export interface DexCatchResult {
  isNew: boolean
  /** 刷新此魚種個人最大釣獲 */
  isSpeciesRecord: boolean
  /** 刷新全圖鑑單尾最大重量 */
  isGlobalRecord: boolean
}

function globalBestFromState(state: FishDexState): { speciesId: string; kg: number } | null {
  let best: { speciesId: string; kg: number } | null = null
  for (const [speciesId, entry] of Object.entries(state.entries)) {
    if (!best || entry.bestKg > best.kg) {
      best = { speciesId, kg: entry.bestKg }
    }
  }
  return best
}

export function getGlobalBestRecord(): { species: FishSpecies; kg: number } | null {
  const state = loadFishDex()
  const raw = globalBestFromState(state)
  if (!raw) return null
  const species = FISH_TABLE.find((s) => s.id === raw.speciesId)
  if (!species) return null
  return { species, kg: raw.kg }
}

export function getRankedWeightRecords(limit = 5): { species: FishSpecies; bestKg: number }[] {
  const state = loadFishDex()
  const rows: { species: FishSpecies; bestKg: number }[] = []
  for (const species of FISH_TABLE) {
    const entry = state.entries[species.id]
    if (!entry) continue
    rows.push({ species, bestKg: entry.bestKg })
  }
  rows.sort((a, b) => b.bestKg - a.bestKg)
  return rows.slice(0, limit)
}

export function formatRecordWeight(kg: number): string {
  return kg >= 1 ? `${kg.toFixed(2)} 公斤` : `${Math.round(kg * 1000)} 公克`
}

export function recordDexCatch(speciesId: string, kg: number): DexCatchResult {
  const state = loadFishDex()
  const prevGlobal = globalBestFromState(state)
  const prev = state.entries[speciesId]
  const isNew = !prev
  const isSpeciesRecord = !prev || kg > prev.bestKg
  const willBeatGlobal = !prevGlobal || kg > prevGlobal.kg

  if (!prev) {
    state.entries[speciesId] = {
      count: 1,
      bestKg: kg,
      firstCaughtAt: Date.now(),
    }
  } else {
    prev.count += 1
    if (kg > prev.bestKg) prev.bestKg = kg
  }
  saveFishDex(state)

  return {
    isNew,
    isSpeciesRecord,
    isGlobalRecord: isSpeciesRecord && willBeatGlobal,
  }
}

export function getDexProgress(): { unlocked: number; total: number } {
  const state = loadFishDex()
  const unlocked = FISH_TABLE.filter((s) => state.entries[s.id]).length
  return { unlocked, total: FISH_TABLE.length }
}

export function buildDexCards(): FishDexCard[] {
  const state = loadFishDex()
  return FISH_TABLE.map((species) => {
    const entry = state.entries[species.id]
    return {
      species,
      unlocked: Boolean(entry),
      count: entry?.count ?? 0,
      bestKg: entry?.bestKg ?? 0,
      firstCaughtAt: entry?.firstCaughtAt ?? null,
    }
  })
}

export function rarityLabel(rarity: number): string {
  if (rarity >= 0.12) return '常見'
  if (rarity >= 0.06) return '少見'
  if (rarity >= 0.03) return '稀有'
  return '極稀有'
}

export function harborLabel(species: FishSpecies): string {
  return formatHarborSpots(species.harborSpots)
}
