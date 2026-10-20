import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

export interface NightBloomPipeline {
  render: () => void
  resize: (width: number, height: number) => void
  dispose: () => void
}

/** HDR 感夜間 Bloom（月光、漁火、九份燈帶） */
export function createNightBloomPipeline(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
): NightBloomPipeline {
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(1, 1),
    0.42,
    0.38,
    0.58,
  )
  composer.addPass(bloom)
  composer.addPass(new OutputPass())

  const resize = (width: number, height: number): void => {
    composer.setSize(width, height)
    composer.setPixelRatio(Math.min(renderer.getPixelRatio(), 1.75))
    bloom.resolution.set(width, height)
  }

  return {
    render: () => composer.render(),
    resize,
    dispose: () => composer.dispose(),
  }
}
