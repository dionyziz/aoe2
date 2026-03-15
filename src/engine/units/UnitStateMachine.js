export class UnitStateMachine {
    transition(unit, newState) {
        if (unit.state === newState)
            return;
        unit.state = newState;
        unit.animFrame = 0;
        unit.animTimer = 0;
    }
}
