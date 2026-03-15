import type { TileCoord } from './common';
import type { ResourceType } from './resource';

export enum TerrainType {
  Grass = 0, Dirt = 1, Sand = 2, Water = 3,
  ShallowWater = 4, Snow = 5, Forest = 6, Rock = 7
}

export interface TileData {
  terrain: TerrainType;
  elevation: number;
  passable: boolean;
  resourceId: number | null;
  objectId: number | null;
}

export interface ResourceNode {
  id: number;
  type: ResourceType;
  remaining: number;
  tx: number;
  ty: number;
}

export interface MapData {
  version: number;
  name: string;
  width: number;
  height: number;
  tiles: TileData[][];
  resources: ResourceNode[];
  playerStarts: TileCoord[];
}
