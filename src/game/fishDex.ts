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

export function recordDexCatch(speciesId: string, kg: number): { isNew: boolean } {
  const state = loadFishDex()
  const prev = state.entries[speciesId]
  if (!prev) {
    state.entries[speciesId] = {
      count: 1,
      bestKg: kg,
      firstCaughtAt: Date.now(),
    }
    saveFishDex(state)
    return { isNew: true }
  }
  prev.count += 1
  if (kg > prev.bestKg) prev.bestKg = kg
  saveFishDex(state)
  return { isNew: false }
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
