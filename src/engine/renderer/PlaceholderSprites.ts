import { TILE_WIDTH, TILE_HEIGHT } from '../../constants';
import { TerrainType } from '../../types/map';
import type { UnitInstance } from '../../types/unit';
import type { Camera } from '../camera/Camera';
import type { IsoProjectionType } from './IsoProjection';

// Re-export UnitClass from the canonical type definition
export type { UnitClass } from '../../types/unit';

const PLAYER_COLORS = [
  '#1060d8', '#d82020', '#20a820', '#d8c020',
  '#18b8a0', '#a020c0', '#909090', '#d87820',
];

// Spec-mandated terrain colors
const TERRAIN_COLORS: Record<number, string> = {
  [TerrainType.Grass]:        '#5a8a3a',
  [TerrainType.Dirt]:         '#8b6914',
  [TerrainType.Sand]:         '#c8a84b',
  [TerrainType.Water]:        '#2255aa',
  [TerrainType.ShallowWater]: '#4488cc',
  [TerrainType.Snow]:         '#e8e8f0',
  [TerrainType.Forest]:       '#2d5a1b',
  [TerrainType.Rock]:         '#666677',
};

function shadeColor(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amount));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

export class PlaceholderSprites {
  /**
   * Draw an isometric terrain tile diamond for tile (tx, ty).
   * Projects the tile center via iso.worldToScreen for consistent placement.
   */
  static drawTerrainTile(
    ctx: CanvasRenderingContext2D,
    tx: number, ty: number,
    terrainType: TerrainType,
    elevation: number,
    camera: Camera,
    iso: IsoProjectionType,
  ): void {
    const { x: sx, y: sy } = iso.worldToScreen(tx + 0.5, ty + 0.5, elevation, camera);
    const zoom = camera.zoom;
    const hw = (TILE_WIDTH / 2) * zoom;
    const hh = (TILE_HEIGHT / 2) * zoom;
    const color = TERRAIN_COLORS[terrainType] ?? '#5a8a3a';
    ctx.fillStyle = elevation > 0 ? shadeColor(color, -20 * elevation) : color;
    ctx.beginPath();
    ctx.moveTo(sx,      sy - hh); // top
    ctx.lineTo(sx + hw, sy);      // right
    ctx.lineTo(sx,      sy + hh); // bottom
    ctx.lineTo(sx - hw, sy);      // left
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = shadeColor(color, -25);
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // South-east elevation skirt
    if (elevation > 0) {
      const skirt = elevation * (TILE_HEIGHT / 2) * zoom;
      ctx.fillStyle = shadeColor(color, -40);
      ctx.beginPath();
      ctx.moveTo(sx,      sy + hh);
      ctx.lineTo(sx + hw, sy);
      ctx.lineTo(sx + hw, sy + skirt);
      ctx.lineTo(sx,      sy + hh + skirt);
      ctx.closePath();
      ctx.fill();
    }
  }

  /**
   * Draw a unit placeholder shape, with feet at the unit's world position.
   * Shape varies by class; color by player.
   */
  static drawUnit(
    ctx: CanvasRenderingContext2D,
    unit: UnitInstance,
    camera: Camera,
    iso: IsoProjectionType,
  ): void {
    const { x: sx, y: sy } = iso.worldToScreen(unit.pos.wx, unit.pos.wy, 0, camera);
    const zoom = camera.zoom;
    const pc = PLAYER_COLORS[unit.playerId % 8];
    const s = 10 * zoom;

    if (unit.selected) {
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(sx, sy + s * 0.2, s * 1.1, s * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = pc;
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 0.8;

    // Direction arrow
    const angle = (unit.direction / 8) * Math.PI * 2 - Math.PI / 2;
    const cx = sx + Math.cos(angle) * s * 0.85;
    const cy = sy - s * 0.6 + Math.sin(angle) * s * 0.85;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(sx, sy - s * 0.6);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    // Body: colored circle
    ctx.fillStyle = pc;
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(sx, sy - s * 0.6, s * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  /**
   * Draw a building placeholder at the building's world tile position.
   * Rect size is proportional to footprint.
   */
  static drawBuilding(
    ctx: CanvasRenderingContext2D,
    defId: string,
    tx: number, ty: number,
    footprintCols: number, footprintRows: number,
    progress: number,
    playerId: number,
    isSelected: boolean,
    camera: Camera,
    iso: IsoProjectionType,
  ): void {
    const { x: sx, y: sy } = iso.worldToScreen(tx + footprintCols / 2, ty + footprintRows / 2, 0, camera);
    const zoom = camera.zoom;
    const pc = PLAYER_COLORS[playerId % 8];
    const w = footprintCols * (TILE_WIDTH * 0.5) * zoom;
    const h = footprintRows * (TILE_HEIGHT * 0.6) * zoom + 18 * zoom;

    if (progress < 1) {
      ctx.setLineDash([4 * zoom, 3 * zoom]);
      ctx.strokeStyle = '#aaa';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sx - w / 2, sy - h, w, h);
      ctx.setLineDash([]);
      const bh = 4 * zoom;
      ctx.fillStyle = '#333';
      ctx.fillRect(sx - w / 2, sy - h - bh - 2 * zoom, w, bh);
      ctx.fillStyle = '#40a040';
      ctx.fillRect(sx - w / 2, sy - h - bh - 2 * zoom, w * progress, bh);
      return;
    }

    if (isSelected) {
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx - w / 2 - 2, sy - h - 2, w + 4, h + 4);
    }

    ctx.fillStyle = shadeColor(pc, -35);
    ctx.fillRect(sx - w / 2, sy - h, w, h);
    ctx.strokeStyle = pc;
    ctx.lineWidth = 2;
    ctx.strokeRect(sx - w / 2, sy - h, w, h);
    // Roof triangle
    ctx.fillStyle = pc;
    ctx.beginPath();
    ctx.moveTo(sx, sy - h - 9 * zoom);
    ctx.lineTo(sx - 9 * zoom, sy - h);
    ctx.lineTo(sx + 9 * zoom, sy - h);
    ctx.closePath(); ctx.fill();
    // Abbreviated label
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(8, 9 * zoom)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(defId.slice(0, 3).toUpperCase(), sx, sy - h / 2);
    ctx.textBaseline = 'alphabetic';
  }

  /** Draw a health bar above the unit (width=32px, height=4px per spec). */
  static drawHealthBar(
    ctx: CanvasRenderingContext2D,
    unit: UnitInstance,
    camera: Camera,
    iso: IsoProjectionType,
    maxHp: number,
  ): void {
    const { x: sx, y: sy } = iso.worldToScreen(unit.pos.wx, unit.pos.wy, 0, camera);
    const zoom = camera.zoom;
    const fraction = maxHp > 0 ? Math.max(0, unit.currentHp / maxHp) : 0;
    const w = 32 * zoom;
    const h = 4 * zoom;
    const y = sy - 22 * zoom;
    ctx.fillStyle = '#333';
    ctx.fillRect(sx - w / 2, y, w, h);
    ctx.fillStyle = fraction > 0.66 ? '#48c840' : fraction > 0.33 ? '#d8c020' : '#c83020';
    ctx.fillRect(sx - w / 2, y, w * fraction, h);
  }

  /**
   * Draw a selection ring (green ellipse) under the unit.
   */
  static drawSelectionRing(
    ctx: CanvasRenderingContext2D,
    unit: UnitInstance,
    camera: Camera,
    iso: IsoProjectionType,
  ): void {
    const { x: sx, y: sy } = iso.worldToScreen(unit.pos.wx, unit.pos.wy, 0, camera);
    const zoom = camera.zoom;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 14 * zoom, 7 * zoom, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#00cc00';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
