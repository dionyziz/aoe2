import type { MapData } from '../map/MapData';
import type { Camera } from '../camera/Camera';
import type { UnitInstance } from '../../types/unit';
import type { IsoProjectionType } from '../renderer/IsoProjection';
import { TerrainType } from '../../types/map';

const MAP_SIZE = 180; // minimap pixel size
const PADDING = 10;
const PANEL_H = 120; // bottom UI panel height

const MINI_COLORS: Record<number, string> = {
  [TerrainType.Grass]:        '#4a7c3f',
  [TerrainType.Dirt]:         '#8B6914',
  [TerrainType.Sand]:         '#c2a24c',
  [TerrainType.Water]:        '#1a4a8c',
  [TerrainType.ShallowWater]: '#4a7abc',
  [TerrainType.Snow]:         '#dce8ef',
  [TerrainType.Forest]:       '#1e5c1e',
  [TerrainType.Rock]:         '#6b6b6b',
};

const PLAYER_COLORS: Record<number, string> = {
  1: '#4169E1',
  2: '#DC143C',
};

export class Minimap {
  private mapData: MapData;
  private iso: IsoProjectionType;
  private offscreen: OffscreenCanvas;
  private offCtx: OffscreenCanvasRenderingContext2D;
  private dirty = true;

  constructor(mapData: MapData, iso: IsoProjectionType) {
    this.mapData = mapData;
    this.iso = iso;
    this.offscreen = new OffscreenCanvas(MAP_SIZE, MAP_SIZE);
    this.offCtx = this.offscreen.getContext('2d')!;
    this.renderTerrain();
  }

  private renderTerrain(): void {
    const ctx = this.offCtx;
    const tileW = MAP_SIZE / this.mapData.width;
    const tileH = MAP_SIZE / this.mapData.height;
    for (let ty = 0; ty < this.mapData.height; ty++) {
      for (let tx = 0; tx < this.mapData.width; tx++) {
        const tile = this.mapData.getTile(tx, ty);
        if (!tile) continue;
        ctx.fillStyle = MINI_COLORS[tile.terrain] ?? '#888';
        ctx.fillRect(tx * tileW, ty * tileH, Math.ceil(tileW), Math.ceil(tileH));
      }
    }
    this.dirty = false;
  }

  invalidate(): void { this.dirty = true; }

  render(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    units: UnitInstance[],
    canvasWidth: number,
    canvasHeight: number
  ): void {
    if (this.dirty) this.renderTerrain();

    const x = canvasWidth - MAP_SIZE - PADDING;
    const y = canvasHeight - MAP_SIZE - PANEL_H - PADDING;
    const tileW = MAP_SIZE / this.mapData.width;
    const tileH = MAP_SIZE / this.mapData.height;

    // Border
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 1, y - 1, MAP_SIZE + 2, MAP_SIZE + 2);

    // Terrain
    ctx.drawImage(this.offscreen, x, y);

    // Units
    for (const unit of units) {
      const mx = x + unit.pos.wx * tileW;
      const my = y + unit.pos.wy * tileH;
      ctx.fillStyle = PLAYER_COLORS[unit.playerId] ?? '#fff';
      ctx.beginPath();
      ctx.arc(mx, my, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Viewport rectangle — clipped to minimap bounds
    const vp = this.getViewportRect(camera);
    const vpX1 = Math.max(0, vp.x);
    const vpY1 = Math.max(0, vp.y);
    const vpX2 = Math.min(this.mapData.width,  vp.x + vp.w);
    const vpY2 = Math.min(this.mapData.height, vp.y + vp.h);

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, MAP_SIZE, MAP_SIZE);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      x + vpX1 * tileW,
      y + vpY1 * tileH,
      (vpX2 - vpX1) * tileW,
      (vpY2 - vpY1) * tileH
    );
    ctx.restore();
  }

  private getViewportRect(camera: Camera): { x: number; y: number; w: number; h: number } {
    const corners = [
      this.iso.screenToWorld(0, 0, camera),
      this.iso.screenToWorld(camera.canvasWidth, 0, camera),
      this.iso.screenToWorld(0, camera.canvasHeight, camera),
      this.iso.screenToWorld(camera.canvasWidth, camera.canvasHeight, camera),
    ];
    const xs = corners.map(c => c.x);
    const ys = corners.map(c => c.y);
    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      w: Math.max(...xs) - Math.min(...xs),
      h: Math.max(...ys) - Math.min(...ys),
    };
  }

  /** Returns true if the screen point (sx, sy) is inside the minimap */
  containsPoint(sx: number, sy: number, canvasWidth: number, canvasHeight: number): boolean {
    const x = canvasWidth - MAP_SIZE - PADDING;
    const y = canvasHeight - MAP_SIZE - PANEL_H - PADDING;
    return sx >= x && sx <= x + MAP_SIZE && sy >= y && sy <= y + MAP_SIZE;
  }

  /** Convert minimap click to world tile coords */
  clickToWorld(sx: number, sy: number, canvasWidth: number, canvasHeight: number): { wx: number; wy: number } {
    const x = canvasWidth - MAP_SIZE - PADDING;
    const y = canvasHeight - MAP_SIZE - PANEL_H - PADDING;
    const wx = ((sx - x) / MAP_SIZE) * this.mapData.width;
    const wy = ((sy - y) / MAP_SIZE) * this.mapData.height;
    return { wx, wy };
  }
}
