export interface FishSpecies {
  id: string
  name: string
  emoji: string
  minKg: number
  maxKg: number
  rarity: number
  /** 圖鑑簡介 */
  dexNote: string
  grandpaLine: string
}

/** 八斗子近海常見魚種（遊戲用簡化） */
export const FISH_TABLE: FishSpecies[] = [
  {
    id: 'sand-borer',
    name: '沙吻',
    emoji: '🐟',
    minKg: 0.05,
    maxKg: 0.25,
    rarity: 0.32,
    dexNote: '八斗子防波堤與沙灘底質常見的小型魚，夜釣湯品常用。',
    grandpaLine: '這個大小最適合晚上煮湯，記得放點九層塔。',
  },
  {
    id: 'mackerel',
    name: '鯭魚',
    emoji: '🐟',
    minKg: 0.3,
    maxKg: 0.9,
    rarity: 0.24,
    dexNote: '近海群游魚，清晨港外水道常見，肉質適合乾煎。',
    grandpaLine: '鯭魚新鮮的話，煎一下皮會很脆。',
  },
  {
    id: 'goby',
    name: '蝦虎魚',
    emoji: '🐠',
    minKg: 0.02,
    maxKg: 0.12,
    rarity: 0.18,
    dexNote: '棲息潮間與礫底，體型小但咬餌積極，是入門常釣對象。',
    grandpaLine: '別小看蝦虎魚，八斗子岸邊常常一竿好幾尾。',
  },
  {
    id: 'black-porgy',
    name: '黑鲷',
    emoji: '🐟',
    minKg: 0.4,
    maxKg: 1.8,
    rarity: 0.14,
    dexNote: '礁岩與消波塊邊緣有機會中標，拉力強，是港邊人氣目標魚。',
    grandpaLine: '黑鲷有上來！帥帥，穩住，別讓牠鑽石頭。',
  },
  {
    id: 'scad',
    name: '竹筴魚',
    emoji: '🐟',
    minKg: 0.25,
    maxKg: 0.7,
    rarity: 0.08,
    dexNote: '隨海流群游，偶爾繞進八斗子外港，中魚時收線要穩。',
    grandpaLine: '竹筴魚群有時會從防波堤外繞進來，運氣不錯。',
  },
  {
    id: 'squid',
    name: '小管',
    emoji: '🦑',
    minKg: 0.15,
    maxKg: 0.55,
    rarity: 0.04,
    dexNote: '夜間或曙暮光時較易上鉤，八斗子近海偶見的頭足類驚喜。',
    grandpaLine: '小管！晚上回去白灼就對了，海科館那邊也常有人討論這個。',
  },
]

export function pickFish(castQuality: number): { species: FishSpecies; kg: number } {
  const weights = FISH_TABLE.map((species) => ({
    species,
    w: species.rarity * (species.rarity < 0.12 ? 1 + castQuality * 2 : 1),
  }))
  const total = weights.reduce((sum, item) => sum + item.w, 0)
  let r = Math.random() * total
  for (const { species, w } of weights) {
    r -= w
    if (r <= 0) {
      const span = species.maxKg - species.minKg
      const kg =
        species.minKg + span * (0.35 + Math.random() * 0.65 * (0.45 + castQuality * 0.55))
      return { species, kg: Math.round(kg * 100) / 100 }
    }
  }
  const fallback = FISH_TABLE[0]!
  return { species: fallback, kg: fallback.minKg }
}

export function formatKg(kg: number): string {
  return kg < 1 ? `${Math.round(kg * 1000)} 公克` : `${kg.toFixed(2)} 公斤`
}
