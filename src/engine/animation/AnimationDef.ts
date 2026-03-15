import type { AnimationDef as AnimationDefType } from '../../types/animation';

export interface AnimationDef {
  directions: number;   // 1 or 8
  fps: number;
  loop: boolean;
  frameCount: number;
  frameKeys: string[][];  // [directionIndex][frameIndex]
}

const DIR_SUFFIXES = ['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se'];

export function buildFrameKeys(unitId: string, action: string, directions: number, frameCount: number): string[][] {
  const result: string[][] = [];
  const dirs = directions === 8 ? DIR_SUFFIXES : ['s'];
  for (const dir of dirs) {
    const frames: string[] = [];
    for (let f = 0; f < frameCount; f++) {
      frames.push(`${unitId}_${action}_${dir}_${f}`);
    }
    result.push(frames);
  }
  return result;
}

// Standard animation definitions for all unit types
export const ANIMATIONS: Record<string, AnimationDefType> = {
  militia_idle: { directions: 8, fps: 4, loop: true, frameCount: 2, frameKeys: [] },
  militia_walk: { directions: 8, fps: 15, loop: true, frameCount: 10, frameKeys: [] },
};
