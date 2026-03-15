import type { WorldPos, TileCoord } from './common';

export type UnitClass = 'infantry' | 'archer' | 'cavalry' | 'siege' | 'villager' | 'monk' | 'ship' | 'hero' | 'unique';
export type UnitAge = 'dark' | 'feudal' | 'castle' | 'imperial';
export type AttackType = 'melee' | 'ranged' | 'siege' | 'special';
export type UnitStateId = 'idle' | 'moving' | 'attacking' | 'gathering' | 'dead' | 'building' | 'garrisoned';
export type CombatStance = 'aggressive' | 'defensive' | 'stand_ground' | 'no_attack';

export interface ArmorClass { melee: number; pierce: number; }

export interface UnitDef {
  id: string;
  name: string;
  class: UnitClass;
  hp: number;
  speed: number;          // tiles/sec
  attackDamage: number;
  attackRange: number;    // 0 = melee
  attackSpeed: number;    // attacks/sec
  attackType: AttackType;
  armor: ArmorClass;
  lineOfSight: number;
  cost: { food: number; wood: number; gold: number; stone: number; };
  trainTime: number;      // seconds
  spriteId: string;
  minAge: UnitAge;
  upgradesTo?: string;    // unit id
  uniqueToCivId?: string; // civ id for unique units
  populationCost: number;
}

export interface UnitInstance {
  id: number;
  defId: string;
  playerId: number;
  pos: WorldPos;
  targetPos: WorldPos | null;
  path: TileCoord[];
  pathIndex: number;
  state: UnitStateId;
  currentHp: number;
  direction: number; // 0-7, 0=south clockwise
  animFrame: number;
  animTimer: number;
  selected: boolean;
  targetUnitId: number | null;
  targetBuildingId: number | null;
  stance: CombatStance;
  garrisonedIn: number | null;
}
