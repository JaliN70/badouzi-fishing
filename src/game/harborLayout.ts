import * as THREE from 'three'

/** 場景 1 單位 = 1 公尺。+X 東（陸地內側）、+Z 北（外海）。 */
export const M = 1

export interface HarborLayout {
  boats: THREE.Group[]
  waterSurface: THREE.Mesh
  pierFocus: THREE.Vector3
  shuaiPosition: THREE.Vector3
  grandpaPosition: THREE.Vector3
  pierDeckY: number
  castDirection: THREE.Vector3
  /** 場景內可辨識的點光源（夜釣） */
  lampPositions: THREE.Vector3[]
}
