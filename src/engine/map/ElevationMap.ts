import type { MapData } from './MapData';

export class ElevationMap {
  private mapData: MapData;

  constructor(mapData: MapData) {
    this.mapData = mapData;
  }

  getElevation(tx: number, ty: number): number {
    return this.mapData.getElevation(tx, ty);
  }

  /** Average elevation of corners of a tile (for smooth shading) */
  getCornerElevation(tx: number, ty: number): number {
    let sum = 0, count = 0;
    for (const [dx, dy] of [[0,0],[1,0],[0,1],[1,1]]) {
      const e = this.mapData.getElevation(tx + dx, ty + dy);
      sum += e; count++;
    }
    return sum / count;
  }
}
