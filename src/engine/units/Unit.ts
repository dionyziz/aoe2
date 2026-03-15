import type { UnitInstance } from '../../types/unit';

let nextId = 1;

export function createUnit(defId: string, playerId: number, wx: number, wy: number): UnitInstance {
  return {
    id: nextId++,
    defId,
    playerId,
    pos: { wx, wy },
    targetPos: null,
    path: [],
    pathIndex: 0,
    state: 'idle',
    currentHp: 40,
    direction: 0,
    animFrame: 0,
    animTimer: 0,
    selected: false,
    targetUnitId: null,
    targetBuildingId: null,
    stance: 'aggressive',
    garrisonedIn: null,
  };
}

export function worldToDirection(fromX: number, fromY: number, toX: number, toY: number): number {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx); // -PI to PI
  // Convert to 8 directions: 0=SE, 1=S, 2=SW, 3=W, 4=NW, 5=N, 6=NE, 7=E
  const deg = ((angle * 180 / Math.PI) + 360) % 360;
  return Math.round(deg / 45) % 8;
}
