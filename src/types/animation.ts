export interface SpriteFrame {
  x: number; y: number; w: number; h: number;
  anchorX: number; anchorY: number;
}

export interface AnimationDef {
  id: string;
  directions: number;
  fps: number;
  loop: boolean;
  frameCount: number;
  frameKeys: string[][];
}

export interface AnimationRef {
  animId: string;
  dirIndex: number;
  frameIndex: number;
  timer: number;
}
