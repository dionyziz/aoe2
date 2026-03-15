import type { UnitInstance } from '../../types/unit';
import { UnitStateId } from '../../types/unit';

export class AnimationSystem {
  update(unit: UnitInstance, dt: number): void {
    let fps = 4;
    let frameCount = 2;

    if (unit.state === UnitStateId.Moving) {
      fps = 15;
      frameCount = 10;
    } else if (unit.state === UnitStateId.Attacking) {
      fps = 10;
      frameCount = 6;
    }

    unit.animTimer += dt;
    const frameDuration = 1000 / fps;
    while (unit.animTimer >= frameDuration) {
      unit.animTimer -= frameDuration;
      unit.animFrame = (unit.animFrame + 1) % frameCount;
    }
  }
}
