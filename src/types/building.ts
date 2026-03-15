import type { TileCoord } from './common';

export interface BuildingDef {
  id: string;
  name: string;
  hp: number;
  size: number; // tile footprint (e.g. 3 = 3x3)
  cost: { food: number; wood: number; gold: number; stone: number; };
  buildTime: number;
  spriteId: string;
  trainableUnitIds: string[];
}

export interface BuildingInstance {
  id: number;
  defId: string;
  playerId: number;
  tx: number;
  ty: number;
  currentHp: number;
  maxHp: number;
  constructionProgress: number; // 0..1
  selected: boolean;
}
