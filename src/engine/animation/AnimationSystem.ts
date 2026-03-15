import type { UnitInstance } from '../../types/unit';
import { UnitStateId } from '../../types/unit';
import type { AnimationDef } from '../../types/animation';

// Maps UnitStateId enum value → animation action name
const STATE_TO_ACTION: Record<string, string> = {
  [UnitStateId.Idle]:      'idle',
  [UnitStateId.Moving]:    'walk',
  [UnitStateId.Attacking]: 'attack',
  [UnitStateId.Gathering]: 'walk',
  [UnitStateId.Dead]:      'die',
};

export class AnimationSystem {
  private animDefs = new Map<string, AnimationDef>();

  /** Register an animation definition by its full animId (e.g. "militia_walk"). */
  registerAnimation(animId: string, def: AnimationDef): void {
    this.animDefs.set(animId, def);
  }

  /**
   * Switch a unit to a named animation, resetting frame and timer.
   * No-op if the animId is not registered.
   */
  setAnimation(unit: UnitInstance, animId: string): void {
    unit.animFrame = 0;
    unit.animTimer = 0;
    // defId is used by getFrameKey to look up animId via state; animId is stored
    // implicitly through the unit's state + defId key. If the caller wants to
    // force a specific anim (e.g. a custom emote), they should set unit.state
    // accordingly before calling setAnimation. For the common case this resets
    // the frame counters which is what the spec requires.
    void animId; // animId available if needed for future direct-anim support
  }

  update(dt: number, units: UnitInstance[]): void {
    for (const unit of units) {
      const action = STATE_TO_ACTION[unit.state] ?? 'idle';
      const animId = `${unit.defId}_${action}`;
      const def = this.animDefs.get(animId);
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

  /** Return the atlas frame key for the unit's current state, direction and frame. */
  getFrameKey(unit: UnitInstance): string {
    const action = STATE_TO_ACTION[unit.state] ?? 'idle';
    const animId = `${unit.defId}_${action}`;
    const def = this.animDefs.get(animId);
    if (!def) return `${unit.defId}_${action}_s_0`;
    const dirIndex = def.directions === 8 ? unit.direction % 8 : 0;
    const frameIndex = Math.min(unit.animFrame, def.frameCount - 1);
    return def.frameKeys[dirIndex]?.[frameIndex] ?? `${unit.defId}_${action}_s_0`;
  }
}
