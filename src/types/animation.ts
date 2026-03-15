export interface SpriteFrame {
  x: number; y: number; w: number; h: number;
  anchorX: number; anchorY: number;
}

export interface AnimationDef {
  directions: number;
  fps: number;
  loop: boolean;
  frameCount: number;
  frameKeys: string[][];
}

export interface AnimationRef {
  defId: string;
  direction: number;
  frame: number;
  timer: number;
}
