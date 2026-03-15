import { TILE_WIDTH, TILE_HEIGHT } from '../../constants';
import { TerrainType } from '../../types/map';
import type { MapData } from '../map/MapData';
import type { Camera } from '../camera/Camera';
import type { IsoProjection } from './IsoProjection';

const TERRAIN_COLORS: Record<number, string> = {
  [TerrainType.Grass]: '#4a7c3f',
  [TerrainType.Dirt]: '#8B6914',
  [TerrainType.Sand]: '#c2a24c',
  [TerrainType.Water]: '#1a4a8c',
  [TerrainType.ShallowWater]: '#4a7abc',
  [TerrainType.Snow]: '#dce8ef',
  [TerrainType.Forest]: '#1e5c1e',
  [TerrainType.Rock]: '#6b6b6b',
};

const TERRAIN_BORDER_COLORS: Record<number, string> = {
  [TerrainType.Grass]: '#3a6230',
  [TerrainType.Dirt]: '#6b5010',
  [TerrainType.Sand]: '#9e8230',
  [TerrainType.Water]: '#103a6c',
  [TerrainType.ShallowWater]: '#3a6a9c',
  [TerrainType.Snow]: '#bcd8ef',
  [TerrainType.Forest]: '#0e4c0e',
  [TerrainType.Rock]: '#4b4b4b',
};

export class TerrainRenderer {
  private mapData: MapData;
  private iso: IsoProjection;
  private dirty = true;

  constructor(mapData: MapData, iso: IsoProjection) {
    this.mapData = mapData;
    this.iso = iso;
  }

  invalidate(): void { this.dirty = true; }

  render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const { width: mapW, height: mapH } = this.mapData;
    const range = this.iso.visibleTileRange(camera.canvasWidth, camera.canvasHeight, camera, mapW, mapH);

    // Painter's order: render by diagonal d = tx + ty
    const minD = range.minTx + range.minTy;
    const maxD = range.maxTx + range.maxTy;

    for (let d = minD; d <= maxD; d++) {
      const tyMin = Math.max(range.minTy, d - range.maxTx);
      const tyMax = Math.min(range.maxTy, d - range.minTx);

      for (let ty = tyMin; ty <= tyMax; ty++) {
        const tx = d - ty;
        if (tx < range.minTx || tx > range.maxTx) continue;

        const tile = this.mapData.getTile(tx, ty);
        if (!tile) continue;

        this.drawTile(ctx, tx, ty, tile.terrain, tile.elevation, camera);
      }
    }

    this.dirty = false;
  }

  private drawTile(
    ctx: CanvasRenderingContext2D,
    tx: number, ty: number,
    terrain: TerrainType,
    elevation: number,
    camera: Camera
  ): void {
    const center = this.iso.worldToScreen(tx + 0.5, ty + 0.5, elevation, camera);
    const hw = (TILE_WIDTH / 2) * camera.zoom;
    const hh = (TILE_HEIGHT / 2) * camera.zoom;

    ctx.beginPath();
    ctx.moveTo(center.x, center.y - hh);  // top
    ctx.lineTo(center.x + hw, center.y);  // right
    ctx.lineTo(center.x, center.y + hh);  // bottom
    ctx.lineTo(center.x - hw, center.y);  // left
    ctx.closePath();

    ctx.fillStyle = TERRAIN_COLORS[terrain] ?? '#888';
    ctx.fill();

    ctx.strokeStyle = TERRAIN_BORDER_COLORS[terrain] ?? '#666';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Draw elevation walls (south face)
    if (elevation > 0) {
      const wallHeight = elevation * TILE_HEIGHT * camera.zoom;
      // South-east wall
      ctx.beginPath();
      ctx.moveTo(center.x, center.y + hh);
      ctx.lineTo(center.x + hw, center.y);
      ctx.lineTo(center.x + hw, center.y + wallHeight);
      ctx.lineTo(center.x, center.y + hh + wallHeight);
      ctx.closePath();
      ctx.fillStyle = '#2a4a1e';
      ctx.fill();
      ctx.stroke();

      // South-west wall
      ctx.beginPath();
      ctx.moveTo(center.x, center.y + hh);
      ctx.lineTo(center.x - hw, center.y);
      ctx.lineTo(center.x - hw, center.y + wallHeight);
      ctx.lineTo(center.x, center.y + hh + wallHeight);
      ctx.closePath();
      ctx.fillStyle = '#1e3a14';
      ctx.fill();
      ctx.stroke();
    }
  }
}
