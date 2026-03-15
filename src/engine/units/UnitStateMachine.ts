import type { UnitInstance, UnitStateId } from '../../types/unit';

export class UnitStateMachine {
  transition(unit: UnitInstance, newState: UnitStateId): void {
    if (unit.state === newState) return;
    unit.state = newState;
    unit.animFrame = 0;
    unit.animTimer = 0;
  }
}
