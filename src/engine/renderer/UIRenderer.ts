import type { Rect } from '../../types/common';
import type { MapData } from '../map/MapData';
import type { UnitInstance } from '../../types/unit';
import { TerrainType } from '../../types/map';

const TERRAIN_COLORS: Record<number, string> = {
  [TerrainType.Grass]:        '#3a7a2a',
  [TerrainType.Dirt]:         '#6b4f1a',
  [TerrainType.Sand]:         '#b89a3a',
  [TerrainType.Water]:        '#2244aa',
  [TerrainType.ShallowWater]: '#3366bb',
  [TerrainType.Forest]:       '#1a4a0a',
  [TerrainType.Rock]:         '#555566',
  [TerrainType.Snow]:         '#c8c8d0',
};

export class UIRenderer {
  drawFPS(ctx: CanvasRenderingContext2D, fps: number): void {
    const cw = ctx.canvas.width / (window.devicePixelRatio || 1);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(cw - 90, 4, 80, 24);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`FPS: ${fps}`, cw - 14, 8);
    ctx.restore();
  }

  drawSelectionRect(ctx: CanvasRenderingContext2D, rect: Rect): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.restore();
  }

  drawResourcePlaceholder(ctx: CanvasRenderingContext2D): void {
    const cw = ctx.canvas.width / (window.devicePixelRatio || 1);
    ctx.save();
    ctx.fillStyle = 'rgba(40,40,40,0.8)';
    ctx.fillRect(0, 0, cw, 30);
    ctx.fillStyle = '#aaa';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Resources: ---', 10, 15);
    ctx.restore();
  }

  drawMinimap(ctx: CanvasRenderingContext2D, mapData: MapData, units: UnitInstance[]): void {
    const cw = ctx.canvas.width / (window.devicePixelRatio || 1);
    const ch = ctx.canvas.height / (window.devicePixelRatio || 1);
    const size = 200;
    const x = cw - size - 10;
    const y = ch - size - 10;

    const mapW = mapData.width;
    const mapH = mapData.height;
    const tileSize = Math.floor(size / Math.max(mapW, mapH));

    ctx.save();

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(x, y, size, size);

    // Draw terrain tiles
    for (let ty = 0; ty < mapH; ty++) {
      for (let tx = 0; tx < mapW; tx++) {
        const tile = mapData.getTile(tx, ty);
        if (!tile) continue;
        const color = TERRAIN_COLORS[tile.terrain] ?? '#3a7a2a';
        ctx.fillStyle = color;
        ctx.fillRect(x + tx * tileSize, y + ty * tileSize, tileSize, tileSize);
      }
    }

    // Draw units as 3×3 dots
    for (const unit of units) {
      const ux = x + unit.pos.wx * tileSize;
      const uy = y + unit.pos.wy * tileSize;
      ctx.fillStyle = unit.playerId === 1 ? '#4169E1' : '#DC143C';
      ctx.fillRect(ux - 1, uy - 1, 3, 3);
    }

    // White border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);

    ctx.restore();
  }
}
