import type { AnimationDef as AnimationDefType } from '../../types/animation';

export const ANIMATIONS: Record<string, AnimationDefType> = {
  militia_idle: { directions: 8, fps: 4, loop: true, frameCount: 2, frameKeys: [] },
  militia_walk: { directions: 8, fps: 15, loop: true, frameCount: 10, frameKeys: [] },
};
