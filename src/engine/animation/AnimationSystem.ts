import type { UnitInstance } from '../../types/unit';
import type { AnimationDef } from '../../types/animation';

// Maps UnitStateId → animation action name
const STATE_TO_ACTION: Record<string, string> = {
  idle: 'idle',
  moving: 'walk',
  attacking: 'attack',
  gathering: 'walk',
  dead: 'die',
  building: 'walk',
};

export class AnimationSystem {
  private animDefs = new Map<string, Map<string, AnimationDef>>();

  registerAnimation(unitId: string, action: string, def: AnimationDef): void {
    if (!this.animDefs.has(unitId)) this.animDefs.set(unitId, new Map());
    this.animDefs.get(unitId)!.set(action, def);
  }

  update(dt: number, units: UnitInstance[]): void {
    for (const unit of units) {
      const action = STATE_TO_ACTION[unit.state] ?? 'idle';
      const def = this.animDefs.get(unit.defId)?.get(action);
      if (!def) { unit.animFrame = 0; continue; }
      unit.animTimer += dt;
      const frameDuration = 1000 / def.fps;
      while (unit.animTimer >= frameDuration) {
        unit.animTimer -= frameDuration;
        unit.animFrame++;
        if (unit.animFrame >= def.frameCount) {
          unit.animFrame = def.loop ? 0 : def.frameCount - 1;
        }
      }
    }
  }

  getFrameKey(unitDefId: string, state: string, direction: number, frame: number): string {
    const action = STATE_TO_ACTION[state] ?? 'idle';
    const def = this.animDefs.get(unitDefId)?.get(action);
    if (!def) return `${unitDefId}_${action}_s_0`;
    const dirIndex = def.directions === 8 ? direction % 8 : 0;
    const frameIndex = Math.min(frame, def.frameCount - 1);
    return def.frameKeys[dirIndex]?.[frameIndex] ?? `${unitDefId}_${action}_s_0`;
  }
}
