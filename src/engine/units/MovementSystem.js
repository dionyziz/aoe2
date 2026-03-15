import { worldToDirection } from './Unit';
const UNIT_SPEED = 0.003; // tiles per ms
export class MovementSystem {
    update(unit, dt) {
        if (unit.state !== 'moving')
            return;
        if (unit.path.length === 0 || unit.pathIndex >= unit.path.length) {
            unit.state = 'idle';
            unit.targetPos = null;
            return;
        }
        const target = unit.path[unit.pathIndex];
        // Center of target tile
        const targetWx = target.tx + 0.5;
        const targetWy = target.ty + 0.5;
        const dx = targetWx - unit.pos.wx;
        const dy = targetWy - unit.pos.wy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        unit.direction = worldToDirection(unit.pos.wx, unit.pos.wy, targetWx, targetWy);
        const moveAmount = UNIT_SPEED * dt;
        if (dist <= moveAmount) {
            unit.pos.wx = targetWx;
            unit.pos.wy = targetWy;
            unit.pathIndex++;
            if (unit.pathIndex >= unit.path.length) {
                unit.state = 'idle';
                unit.path = [];
                unit.pathIndex = 0;
                unit.targetPos = null;
            }
        }
        else {
            unit.pos.wx += (dx / dist) * moveAmount;
            unit.pos.wy += (dy / dist) * moveAmount;
        }
    }
}
