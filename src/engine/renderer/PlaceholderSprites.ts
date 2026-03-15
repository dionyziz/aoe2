import { TILE_WIDTH, TILE_HEIGHT } from '../../constants';

export type UnitClass = 'infantry' | 'archer' | 'cavalry' | 'siege' | 'monk' | 'ship' | 'villager' | 'hero' | 'unique';

const PLAYER_COLORS = [
  '#1060d8', '#d82020', '#20a820', '#d8c020',
  '#18b8a0', '#a020c0', '#909090', '#d87820',
];

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

function shadeColor(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amount));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

export class PlaceholderSprites {
  /**
   * Draw an isometric terrain tile diamond centered at (sx, sy).
   */
  static drawTerrainTile(
    ctx: CanvasRenderingContext2D,
    terrain: number,
    sx: number, sy: number,
    zoom: number,
    elevation: number,
  ): void {
    const hw = (TILE_WIDTH / 2) * zoom;
    const hh = (TILE_HEIGHT / 2) * zoom;
    const color = TERRAIN_COLORS[terrain] ?? '#5a8a3c';
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
   * Draw a unit placeholder shape, centered with feet at (sx, sy).
   * Shape varies by class; color by player.
   */
  static drawUnit(
    ctx: CanvasRenderingContext2D,
    unitClass: UnitClass,
    sx: number, sy: number,
    zoom: number,
    direction: number, // 0-7
    playerId: number,
    selected: boolean,
  ): void {
    const pc = PLAYER_COLORS[playerId % 8];
    const s = 10 * zoom;

    if (selected) {
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(sx, sy + s * 0.2, s * 1.1, s * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = pc;
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 0.8;

    switch (unitClass) {
      case 'infantry':
      case 'unique':
      case 'hero':
        ctx.fillRect(sx - s * 0.35, sy - s * 1.2, s * 0.7, s * 1.2);
        ctx.strokeRect(sx - s * 0.35, sy - s * 1.2, s * 0.7, s * 1.2);
        break;
      case 'archer':
        ctx.fillRect(sx - s * 0.25, sy - s * 1.2, s * 0.5, s * 1.2);
        ctx.strokeRect(sx - s * 0.25, sy - s * 1.2, s * 0.5, s * 1.2);
        ctx.strokeStyle = pc;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sx + s * 0.45, sy - s * 0.55, s * 0.38, -Math.PI * 0.6, Math.PI * 0.6);
        ctx.stroke();
        break;
      case 'cavalry':
        ctx.fillRect(sx - s * 0.75, sy - s * 0.85, s * 1.5, s * 0.85);
        ctx.strokeRect(sx - s * 0.75, sy - s * 0.85, s * 1.5, s * 0.85);
        ctx.fillStyle = shadeColor(pc, 30);
        ctx.fillRect(sx - s * 0.2, sy - s * 1.35, s * 0.4, s * 0.6);
        break;
      case 'siege':
        ctx.fillStyle = '#555';
        ctx.fillRect(sx - s, sy - s * 0.5, s * 2, s * 0.55);
        ctx.strokeRect(sx - s, sy - s * 0.5, s * 2, s * 0.55);
        ctx.fillStyle = '#333';
        [sx - s * 0.6, sx + s * 0.6].forEach(wx => {
          ctx.beginPath(); ctx.arc(wx, sy, s * 0.22, 0, Math.PI * 2); ctx.fill();
        });
        ctx.fillStyle = pc;
        ctx.fillRect(sx - s * 0.15, sy - s * 0.9, s * 0.3, s * 0.45);
        break;
      case 'villager':
        ctx.beginPath();
        ctx.arc(sx, sy - s * 0.9, s * 0.38, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.fillRect(sx - s * 0.22, sy - s * 0.55, s * 0.44, s * 0.55);
        ctx.strokeRect(sx - s * 0.22, sy - s * 0.55, s * 0.44, s * 0.55);
        break;
      case 'monk':
        ctx.fillStyle = '#d0c8a0';
        ctx.beginPath();
        ctx.moveTo(sx, sy - s * 1.5);
        ctx.lineTo(sx + s * 0.35, sy);
        ctx.lineTo(sx - s * 0.35, sy);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#e8d090';
        ctx.beginPath();
        ctx.arc(sx, sy - s * 1.5, s * 0.28, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        break;
      case 'ship':
        ctx.beginPath();
        ctx.ellipse(sx, sy - s * 0.3, s * 1.6, s * 0.45, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = shadeColor(pc, 20);
        ctx.fillRect(sx - s * 0.1, sy - s * 0.9, s * 0.2, s * 0.6);
        break;
      default:
        ctx.beginPath();
        ctx.arc(sx, sy - s * 0.6, s * 0.6, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
    }

    // Direction arrow
    const angle = (direction / 8) * Math.PI * 2 - Math.PI / 2;
    const cx = sx + Math.cos(angle) * s * 0.85;
    const cy = sy - s * 0.6 + Math.sin(angle) * s * 0.85;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(sx, sy - s * 0.6);
    ctx.lineTo(cx, cy);
    ctx.stroke();
  }

  /**
   * Draw a building placeholder at (sx, sy) = south anchor of building footprint.
   */
  static drawBuilding(
    ctx: CanvasRenderingContext2D,
    defId: string,
    sx: number, sy: number,
    zoom: number,
    progress: number,
    playerId: number,
    isSelected: boolean,
  ): void {
    const pc = PLAYER_COLORS[playerId % 8];
    const sizes: Record<string, [number, number]> = {
      town_center: [4, 4], castle: [4, 4],
      monastery: [3, 3], barracks: [3, 3], archery_range: [3, 3],
      stable: [3, 3], siege_workshop: [3, 3], market: [3, 2],
      university: [3, 2], dock: [3, 2], blacksmith: [2, 2],
      house: [2, 2], lumber_camp: [2, 2], mining_camp: [2, 2],
      mill: [2, 2], farm: [2, 2],
      watch_tower: [1, 1], guard_tower: [1, 1], keep: [1, 1],
      bombard_tower: [1, 1], palisade_wall: [1, 1],
      stone_wall: [1, 1], fortified_wall: [1, 1],
    };
    const [cols, rows] = sizes[defId] ?? [2, 2];
    const w = cols * (TILE_WIDTH * 0.5) * zoom;
    const h = rows * (TILE_HEIGHT * 0.6) * zoom + 18 * zoom;

    if (progress < 1) {
      ctx.setLineDash([4 * zoom, 3 * zoom]);
      ctx.strokeStyle = '#aaa';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sx - w / 2, sy - h, w, h);
      ctx.setLineDash([]);
      // Progress bar
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

  static drawHealthBar(
    ctx: CanvasRenderingContext2D,
    sx: number, sy: number,
    zoom: number,
    fraction: number,
    width = 28,
  ): void {
    const w = width * zoom;
    const h = 3 * zoom;
    const y = sy - 22 * zoom;
    ctx.fillStyle = '#333';
    ctx.fillRect(sx - w / 2, y, w, h);
    ctx.fillStyle = fraction > 0.6 ? '#48c840' : fraction > 0.3 ? '#d8c020' : '#c83020';
    ctx.fillRect(sx - w / 2, y, w * Math.max(0, fraction), h);
  }
}
