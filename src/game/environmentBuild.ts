import * as THREE from 'three'
import { buildModeledBadouziHarbor } from './badouziModels.ts'
import { buildChaojingPark } from './chaojingModels.ts'
import type { HarborLayout } from './harborLayout.ts'
import type { FishingSpotId } from './fishingSpot.ts'

export function buildFishingEnvironment(
  spotId: FishingSpotId,
  parent: THREE.Object3D,
): HarborLayout {
  if (spotId === 'chaojing') return buildChaojingPark(parent)
  return buildModeledBadouziHarbor(parent)
}
