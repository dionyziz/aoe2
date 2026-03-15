import type { MapData } from '../map/MapData';

export class NavGrid {
  readonly width: number;
  readonly height: number;
  private passable: Uint8Array;

  constructor(mapData: MapData) {
    this.width = mapData.width;
    this.height = mapData.height;
    this.passable = new Uint8Array(this.width * this.height);
    this.rebuild(mapData);
  }

  rebuild(mapData: MapData): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.passable[y * this.width + x] = mapData.isPassable(x, y) ? 1 : 0;
      }
    }
  }

  isPassable(tx: number, ty: number): boolean {
    if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return false;
    return this.passable[ty * this.width + tx] === 1;
  }

  setPassable(tx: number, ty: number, value: boolean): void {
    if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return;
    this.passable[ty * this.width + tx] = value ? 1 : 0;
  }
}
