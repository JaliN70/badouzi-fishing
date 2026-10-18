export type FishingSpotId = 'badouzi' | 'chaojing'

export interface FishingSpotInfo {
  id: FishingSpotId
  shortLabel: string
  hudLabel: string
  sceneTitle: string
  introTitle: string
  introStory: string
  viewRef: string
}

export const FISHING_SPOTS: Record<FishingSpotId, FishingSpotInfo> = {
  badouzi: {
    id: 'badouzi',
    shortLabel: '八斗子突堤',
    hudLabel: '基隆 · 八斗子',
    sceneTitle: '八斗子漁港突堤',
    introTitle: '八斗子的夜',
    introStory:
      '手電筒照著突堤欄杆，帥帥跟阿公在八斗子漁港邊找位子。夜裡船燈慢慢移動，海科館方向的海風還是帶著鹹味。阿公說：「夜釣別急，先看清楚腳下與浮標。」',
    viewRef: '實比例 1m · 八斗子漁港／北寧路／海科館方位參考',
  },
  chaojing: {
    id: 'chaojing',
    shortLabel: '潮境公園',
    hudLabel: '基隆 · 潮境公園',
    sceneTitle: '潮境公園海濱',
    introTitle: '潮境的夜釣',
    introStory:
      '潮境公園的步道燈一排排亮著，遠處「海與空」玻璃長廊像一條光帶貼在海面上。帥帥與阿公在釣魚平台架好竿，腳下是礫石岸，面前就是開闊的北太平洋。阿公小聲說：「這裡浪大，浮標要盯緊。」',
    viewRef: '實比例 1m · 潮境公園／海與空長廊／潮境燈塔配置參考',
  },
}

const STORAGE_KEY = 'badouzi-fishing-spot'

export function loadSavedSpot(): FishingSpotId {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'chaojing' || v === 'badouzi') return v
  } catch {
    /* ignore */
  }
  return 'badouzi'
}

export function saveSpot(id: FishingSpotId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* ignore */
  }
}
