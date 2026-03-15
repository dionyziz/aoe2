import { TILE_WIDTH, TILE_HEIGHT } from '../../constants';
import type { UnitClass } from '../../types/unit';

// Player colors indexed 0-7
const PLAYER_COLORS = ['#1060d8','#d82020','#20a820','#d8c020','#18b8a0','#a020c0','#909090','#d87820'];

// Terrain colors
const TERRAIN_COLORS: Record<number, string> = {
  0: '#5a8a3c', // Grass
  1: '#8b6914', // Dirt
  2: '#d4b483', // Sand
  3: '#2d6fa6', // Water
  4: '#5090c0', // ShallowWater
  5: '#e8e8f0', // Snow
  6: '#2d5a1e', // Forest
  7: '#696969', // Rock
};

export class PlaceholderSprites {
  /**
   * Draw an isometric diamond terrain tile.
   * Center is at (sx, sy), dimensions TILE_WIDTH*zoom × TILE_HEIGHT*zoom
   */
  static drawTerrainTile(
    ctx: CanvasRenderingContext2D,
    terrain: number,
    sx: number, sy: number,
    zoom: number,
    elevation: number
  ): void {
    const hw = (TILE_WIDTH / 2) * zoom;
    const hh = (TILE_HEIGHT / 2) * zoom;
    const color = TERRAIN_COLORS[terrain] ?? '#5a8a3c';
    // Darken for elevation
    ctx.fillStyle = elevation > 0 ? shadeColor(color, -20 * elevation) : color;
    ctx.beginPath();
    ctx.moveTo(sx, sy - hh);       // top
    ctx.lineTo(sx + hw, sy);        // right
    ctx.lineTo(sx, sy + hh);        // bottom
    ctx.lineTo(sx - hw, sy);        // left
    ctx.closePath();
    ctx.fill();
    // Thin darker outline
    ctx.strokeStyle = shadeColor(color, -30);
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  /**
   * Draw a unit placeholder. Shape differs by class so units are visually distinguishable.
   */
  static drawUnit(
    ctx: CanvasRenderingContext2D,
    unitClass: UnitClass,
    sx: number, sy: number,
    zoom: number,
    direction: number,    // 0-7
    playerId: number,
    selected: boolean
  ): void {
    const pc = PLAYER_COLORS[playerId % 8];
    const size = 10 * zoom;

    // Selection ring first (under unit)
    if (selected) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(sx, sy + 2 * zoom, size * 1.2, size * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = pc;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;

    switch (unitClass) {
      case 'infantry':
        // Upright rectangle
        ctx.fillRect(sx - size * 0.4, sy - size * 1.2, size * 0.8, size * 1.2);
        ctx.strokeRect(sx - size * 0.4, sy - size * 1.2, size * 0.8, size * 1.2);
        break;
      case 'archer':
        // Thin rectangle + bow line on side
        ctx.fillRect(sx - size * 0.3, sy - size * 1.2, size * 0.6, size * 1.2);
        ctx.strokeRect(sx - size * 0.3, sy - size * 1.2, size * 0.6, size * 1.2);
        ctx.strokeStyle = pc;
        ctx.beginPath();
        ctx.arc(sx + size * 0.4, sy - size * 0.6, size * 0.4, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
        break;
      case 'cavalry':
        // Wide low rectangle (horse + rider)
        ctx.fillRect(sx - size * 0.8, sy - size * 0.8, size * 1.6, size * 0.8);
        ctx.strokeRect(sx - size * 0.8, sy - size * 0.8, size * 1.6, size * 0.8);
        break;
      case 'siege':
        // Low wide dark shape
        ctx.fillStyle = '#666666';
        ctx.fillRect(sx - size, sy - size * 0.6, size * 2, size * 0.6);
        ctx.strokeRect(sx - size, sy - size * 0.6, size * 2, size * 0.6);
        // Wheel circles
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.arc(sx - size * 0.6, sy, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx + size * 0.6, sy, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'villager':
        // Circle for head + small body
        ctx.beginPath();
        ctx.arc(sx, sy - size * 0.9, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillRect(sx - size * 0.25, sy - size * 0.5, size * 0.5, size * 0.5);
        break;
      case 'monk':
        // Tall thin white-grey robed figure
        ctx.fillStyle = '#d0c8a0';
        ctx.fillRect(sx - size * 0.3, sy - size * 1.4, size * 0.6, size * 1.4);
        ctx.strokeRect(sx - size * 0.3, sy - size * 1.4, size * 0.6, size * 1.4);
        ctx.beginPath();
        ctx.arc(sx, sy - size * 1.5, size * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = '#e8d090';
        ctx.fill();
        ctx.stroke();
        break;
      case 'ship':
        // Elongated horizontal hull
        ctx.beginPath();
        ctx.ellipse(sx, sy - size * 0.3, size * 1.5, size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
      default:
        // Generic circle
        ctx.beginPath();
        ctx.arc(sx, sy - size * 0.6, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    // Direction indicator: small arrow on top
    const angle = (direction / 8) * Math.PI * 2 - Math.PI / 2;
    const ax = sx + Math.cos(angle) * size * 0.7;
    const ay = sy - size * 0.6 + Math.sin(angle) * size * 0.7;
    ctx.strokeStyle = '#ffffff88';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx, sy - size * 0.6);
    ctx.lineTo(ax, ay);
    ctx.stroke();
  }

  /**
   * Draw a building placeholder — colored rectangle scaled by footprint.
   */
  static drawBuilding(
    ctx: CanvasRenderingContext2D,
    defId: string,
    sx: number, sy: number,
    zoom: number,
    progress: number,   // 0..1
    playerId: number,
    isSelected: boolean
  ): void {
    const pc = PLAYER_COLORS[playerId % 8];
    // Building sizes by type
    const sizeMap: Record<string, [number, number]> = {
      town_center: [4, 4], castle: [4, 4], monastery: [3, 3],
      barracks: [3, 3], archery_range: [3, 3], stable: [3, 3], siege_workshop: [3, 3],
      blacksmith: [3, 3], market: [3, 3], university: [3, 3], dock: [3, 3],
      house: [2, 2], lumber_camp: [2, 2], mining_camp: [2, 2], mill: [2, 2], farm: [2, 2],
      watch_tower: [1, 1], guard_tower: [1, 1], keep: [1, 1], bombard_tower: [1, 1],
      palisade_wall: [1, 1], stone_wall: [1, 1], fortified_wall: [1, 1],
      wonder: [4, 4],
    };
    const [cols, rows] = sizeMap[defId] ?? [2, 2];
    const w = cols * (TILE_WIDTH / 2) * zoom;
    const h = rows * (TILE_HEIGHT / 2) * zoom + 20 * zoom;

    // Under-construction: grey outline
    if (progress < 1) {
      ctx.strokeStyle = '#aaaaaa';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(sx - w / 2, sy - h, w, h);
      ctx.setLineDash([]);
      // Progress bar
      ctx.fillStyle = '#333333';
      ctx.fillRect(sx - w / 2, sy - h - 6 * zoom, w, 4 * zoom);
      ctx.fillStyle = '#40a040';
      ctx.fillRect(sx - w / 2, sy - h - 6 * zoom, w * progress, 4 * zoom);
      return;
    }

    if (isSelected) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx - w / 2 - 2, sy - h - 2, w + 4, h + 4);
    }

    // Building body
    ctx.fillStyle = shadeColor(pc, -40);
    ctx.fillRect(sx - w / 2, sy - h, w, h);
    ctx.strokeStyle = pc;
    ctx.lineWidth = 2;
    ctx.strokeRect(sx - w / 2, sy - h, w, h);
    // Roof marker: small colored triangle at top
    ctx.fillStyle = pc;
    ctx.beginPath();
    ctx.moveTo(sx, sy - h - 8 * zoom);
    ctx.lineTo(sx - 8 * zoom, sy - h);
    ctx.lineTo(sx + 8 * zoom, sy - h);
    ctx.closePath();
    ctx.fill();
    // Label
    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.max(8, 9 * zoom)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(defId.slice(0, 3).toUpperCase(), sx, sy - h / 2);
  }

  static drawHealthBar(
    ctx: CanvasRenderingContext2D,
    sx: number, sy: number,
    zoom: number,
    fraction: number,
    width = 28
  ): void {
    const w = width * zoom;
    const h = 3 * zoom;
    ctx.fillStyle = '#333333';
    ctx.fillRect(sx - w / 2, sy - 22 * zoom, w, h);
    ctx.fillStyle = fraction > 0.6 ? '#48c840' : fraction > 0.3 ? '#d8c020' : '#c83020';
    ctx.fillRect(sx - w / 2, sy - 22 * zoom, w * fraction, h);
  }
}

function shadeColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}
