export type HarborSpot = '八斗子' | '碧砂' | '潮境公園'

export interface FishSpecies {
  id: string
  name: string
  emoji: string
  minKg: number
  maxKg: number
  rarity: number
  /** 常見釣點（兩港皆可時列兩者） */
  harborSpots: HarborSpot[]
  /** 圖鑑簡介 */
  dexNote: string
  grandpaLine: string
}

/** 八斗子、碧砂、潮境公園近海常見魚種（遊戲用簡化） */
export const FISH_TABLE: FishSpecies[] = [
  {
    id: 'sand-borer',
    name: '沙吻',
    emoji: '🐟',
    minKg: 0.05,
    maxKg: 0.25,
    rarity: 0.14,
    harborSpots: ['八斗子', '碧砂'],
    dexNote: '沙泥底常見小魚，兩港防波堤與淺岸夜釣都很常見。',
    grandpaLine: '這個大小最適合晚上煮湯，記得放點九層塔。',
  },
  {
    id: 'zebra-ponyfish',
    name: '斑馬姑',
    emoji: '🐟',
    minKg: 0.08,
    maxKg: 0.35,
    rarity: 0.16,
    harborSpots: ['八斗子', '碧砂', '潮境公園'],
    dexNote: '北部漁港最熟悉的雜魚之一，潮境夜釣也常連竿。',
    grandpaLine: '斑馬姑又來排隊了，帥帥記得竿尖別抬太高。',
  },
  {
    id: 'mackerel',
    name: '鯭魚',
    emoji: '🐟',
    minKg: 0.3,
    maxKg: 0.9,
    rarity: 0.11,
    harborSpots: ['八斗子'],
    dexNote: '清晨八斗子外港水道常見群游，肉質適合乾煎。',
    grandpaLine: '鯭魚新鮮的話，煎一下皮會很脆。',
  },
  {
    id: 'goby',
    name: '蝦虎魚',
    emoji: '🐠',
    minKg: 0.02,
    maxKg: 0.12,
    rarity: 0.1,
    harborSpots: ['八斗子', '碧砂', '潮境公園'],
    dexNote: '棲息潮間與礫底，潮境平台與兩港岸邊都常見。',
    grandpaLine: '別小看蝦虎魚，八斗子岸邊常常一竿好幾尾。',
  },
  {
    id: 'silver-biddy',
    name: '花身鯻',
    emoji: '🐟',
    minKg: 0.15,
    maxKg: 0.55,
    rarity: 0.09,
    harborSpots: ['八斗子', '碧砂', '潮境公園'],
    dexNote: '礁岩與潮境礫石縫隙常見，夜釣拉力紮實。',
    grandpaLine: '花身鯻愛鑽縫，快收一段線，別讓牠磨斷。',
  },
  {
    id: 'yellowfin-seabream',
    name: '黃鰭鯛',
    emoji: '🐟',
    minKg: 0.2,
    maxKg: 0.85,
    rarity: 0.085,
    harborSpots: ['八斗子', '碧砂', '潮境公園'],
    dexNote: '消波塊與潮境釣魚平台邊都能遇到，夜釣表現穩定。',
    grandpaLine: '黃鰭鯛皮亮，代表水色不錯，今天有戲。',
  },
  {
    id: 'threadfin',
    name: '臭肚',
    emoji: '🐟',
    minKg: 0.25,
    maxKg: 1.2,
    rarity: 0.075,
    harborSpots: ['八斗子', '碧砂', '潮境公園'],
    dexNote: '港池與潮境礫岸常見，夜釣經典目標。',
    grandpaLine: '臭肚上來了，別被牠突然側游嚇到。',
  },
  {
    id: 'flounder',
    name: '花鮫',
    emoji: '🐟',
    minKg: 0.2,
    maxKg: 0.95,
    rarity: 0.07,
    harborSpots: ['碧砂', '八斗子'],
    dexNote: '沙底與混合底質，碧砂淺澳與八斗子內側偶見比目類。',
    grandpaLine: '花鮫貼底走，收線慢一點，感覺到了再揚竿。',
  },
  {
    id: 'black-porgy',
    name: '黑鲷',
    emoji: '🐟',
    minKg: 0.4,
    maxKg: 1.8,
    rarity: 0.065,
    harborSpots: ['八斗子', '碧砂'],
    dexNote: '礁岩與消波塊邊緣有機會中標，拉力強，是人氣目標魚。',
    grandpaLine: '黑鲷有上來！帥帥，穩住，別讓牠鑽石頭。',
  },
  {
    id: 'black-chub',
    name: '黑毛',
    emoji: '🐟',
    minKg: 0.35,
    maxKg: 1.1,
    rarity: 0.055,
    harborSpots: ['碧砂', '八斗子'],
    dexNote: '啃藻群游，碧砂西側礫岸與八斗子西堤較常見。',
    grandpaLine: '黑毛力氣大，線要順，別硬拗。',
  },
  {
    id: 'goldlined-seabream',
    name: '金線魚',
    emoji: '🐟',
    minKg: 0.12,
    maxKg: 0.45,
    rarity: 0.05,
    harborSpots: ['八斗子', '碧砂'],
    dexNote: '近岸岩區與消波塊，體側金線明顯，是圖鑑裡的漂亮傢伙。',
    grandpaLine: '金線魚亮晶晶，拍照給阿公看就好，小的放流吧。',
  },
  {
    id: 'yellow-croaker',
    name: '黃花魚',
    emoji: '🐟',
    minKg: 0.18,
    maxKg: 0.65,
    rarity: 0.045,
    harborSpots: ['碧砂'],
    dexNote: '碧砂港內與近岸沙底較常聽到釣友提起，肉質細。',
    grandpaLine: '黃花魚，阿公年輕時碧砂岸邊也常釣到。',
  },
  {
    id: 'scad',
    name: '竹筴魚',
    emoji: '🐟',
    minKg: 0.25,
    maxKg: 0.7,
    rarity: 0.04,
    harborSpots: ['八斗子'],
    dexNote: '隨海流群游，偶爾繞進八斗子外港，中魚時收線要穩。',
    grandpaLine: '竹筴魚群有時會從防波堤外繞進來，運氣不錯。',
  },
  {
    id: 'white-ponyfish',
    name: '白姑',
    emoji: '🐟',
    minKg: 0.1,
    maxKg: 0.4,
    rarity: 0.038,
    harborSpots: ['八斗子', '碧砂'],
    dexNote: '與斑馬姑常混群，兩港夜釣桶裡很常見。',
    grandpaLine: '白姑跟斑馬姑是好鄰居，今天桶裡又要熱鬧了。',
  },
  {
    id: 'cutlassfish',
    name: '寶刀魚',
    emoji: '🐟',
    minKg: 0.45,
    maxKg: 1.5,
    rarity: 0.028,
    harborSpots: ['八斗子'],
    dexNote: '八斗子外港與航道邊偶見，細長身軀，洗鹽烤很香。',
    grandpaLine: '寶刀魚！小心牙齒，別用手直接抓。',
  },
  {
    id: 'squid',
    name: '小管',
    emoji: '🦑',
    minKg: 0.15,
    maxKg: 0.55,
    rarity: 0.025,
    harborSpots: ['八斗子', '碧砂', '潮境公園'],
    dexNote: '夜間潮境與兩港近海都可能有頭足類驚喜。',
    grandpaLine: '小管！晚上回去白灼就對了，海科館那邊也常有人討論這個。',
  },
  {
    id: 'spear-squid',
    name: '透抽',
    emoji: '🦑',
    minKg: 0.35,
    maxKg: 1.2,
    rarity: 0.022,
    harborSpots: ['八斗子', '碧砂'],
    dexNote: '比小管大隻，八斗子外海與碧砂出港航道偶見。',
    grandpaLine: '透抽！噴水別慌，穩住網或桶就好。',
  },
  {
    id: 'market-squid',
    name: '魷魚',
    emoji: '🦑',
    minKg: 0.5,
    maxKg: 1.8,
    rarity: 0.018,
    harborSpots: ['八斗子'],
    dexNote: '較深水或外側航道，八斗子防波堤外較有機會。',
    grandpaLine: '魷魚上來，今天可以加菜了。',
  },
  {
    id: 'saury',
    name: '秋刀魚',
    emoji: '🐟',
    minKg: 0.12,
    maxKg: 0.35,
    rarity: 0.012,
    harborSpots: ['八斗子', '碧砂'],
    dexNote: '季節魚群繞北台灣，兩港釣友秋天偶爾會遇到驚喜。',
    grandpaLine: '秋刀魚！這尾留著，回去烤箱撒鹽就對了。',
  },
]

export function formatHarborSpots(spots: HarborSpot[]): string {
  return spots.join(' · ')
}

export function pickFish(castQuality: number): { species: FishSpecies; kg: number } {
  const weights = FISH_TABLE.map((species) => ({
    species,
    w: species.rarity * (species.rarity < 0.04 ? 1 + castQuality * 2 : 1),
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
