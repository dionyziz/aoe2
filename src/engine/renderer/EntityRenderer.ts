import type { UnitInstance } from '../../types/unit';
import type { BuildingInstance } from '../../types/building';
import type { Camera } from '../camera/Camera';
import type { IsoProjection } from './IsoProjection';
import { UNIT_MAP } from '../../data/units/index';
import { BUILDING_MAP } from '../../data/buildings/index';
import { TILE_WIDTH, TILE_HEIGHT } from '../../constants';

export class EntityRenderer {
  private iso: IsoProjection;

  constructor(iso: IsoProjection) {
    this.iso = iso;
  }

  render(ctx: CanvasRenderingContext2D, units: UnitInstance[], camera: Camera): void {
    // Sort by wx + wy for painter's order
    const sorted = [...units].sort((a, b) => (a.pos.wx + a.pos.wy) - (b.pos.wx + b.pos.wy));

    for (const unit of sorted) {
      this.drawUnit(ctx, unit, camera);
    }

    // Draw selection rings after sprites
    for (const unit of sorted) {
      if (unit.selected) {
        this.drawSelectionRing(ctx, unit, camera);
      }
    }
  }

  private drawUnit(ctx: CanvasRenderingContext2D, unit: UnitInstance, camera: Camera): void {
    const screen = this.iso.worldToScreen(unit.pos.wx, unit.pos.wy, 0, camera);
    const zoom = camera.zoom;
    const def = UNIT_MAP.get(unit.defId);
    const unitClass = def?.class ?? 'infantry';

    // Color by player
    const colors: Record<number, string> = { 1: '#4169E1', 2: '#DC143C', 0: '#888' };
    const fillColor = colors[unit.playerId] ?? '#888';
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;

    if (unitClass === 'monk') {
      // White circle with a cross
      const r = 8 * zoom;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y - r, r, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Cross
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(screen.x, screen.y - r * 1.7);
      ctx.lineTo(screen.x, screen.y - r * 0.3);
      ctx.moveTo(screen.x - r * 0.5, screen.y - r * 1.2);
      ctx.lineTo(screen.x + r * 0.5, screen.y - r * 1.2);
      ctx.stroke();
      this.drawClassLabel(ctx, screen.x, screen.y - r * 2 - 2 * zoom, zoom, 'M');
    } else if (unitClass === 'siege') {
      // Large square / rectangle
      const size = 18 * zoom;
      ctx.fillStyle = fillColor;
      ctx.fillRect(screen.x - size / 2, screen.y - size, size, size);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(screen.x - size / 2, screen.y - size, size, size);
      this.drawClassLabel(ctx, screen.x, screen.y - size - 2 * zoom, zoom, 'S');
    } else if (unitClass === 'ship') {
      // Larger ellipse, wider than tall
      const rx = 18 * zoom;
      const ry = 9 * zoom;
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.ellipse(screen.x, screen.y - ry, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
      this.drawClassLabel(ctx, screen.x, screen.y - ry * 2 - 2 * zoom, zoom, 'N');
    } else if (unitClass === 'cavalry') {
      // Slightly larger ellipse, wider
      const rx = 13 * zoom;
      const ry = 8 * zoom;
      const h = 20 * zoom;
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.ellipse(screen.x, screen.y - h / 2, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
      this.drawClassLabel(ctx, screen.x, screen.y - h - 2 * zoom, zoom, 'C');
    } else if (unitClass === 'villager') {
      // Smaller ellipse
      const w = 8 * zoom;
      const h = 14 * zoom;
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.ellipse(screen.x, screen.y - h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
      this.drawClassLabel(ctx, screen.x, screen.y - h - 2 * zoom, zoom, 'V');
    } else if (unitClass === 'archer') {
      // Standard size, slightly different proportion
      const w = 10 * zoom;
      const h = 18 * zoom;
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.ellipse(screen.x, screen.y - h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
      this.drawClassLabel(ctx, screen.x, screen.y - h - 2 * zoom, zoom, 'A');
    } else {
      // Infantry: standard 10px radius ellipse
      const w = 10 * zoom;
      const h = 20 * zoom;
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.ellipse(screen.x, screen.y - h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
      this.drawClassLabel(ctx, screen.x, screen.y - h - 2 * zoom, zoom, 'I');
    }
  }

  private drawClassLabel(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    zoom: number,
    letter: string
  ): void {
    const fontSize = Math.max(8, Math.round(9 * zoom));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeText(letter, x, y);
    ctx.fillText(letter, x, y);
  }

  private drawSelectionRing(ctx: CanvasRenderingContext2D, unit: UnitInstance, camera: Camera): void {
    const screen = this.iso.worldToScreen(unit.pos.wx, unit.pos.wy, 0, camera);
    const zoom = camera.zoom;
    const rx = 14 * zoom;
    const ry = 7 * zoom;

    ctx.beginPath();
    ctx.ellipse(screen.x, screen.y, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  renderBuildings(ctx: CanvasRenderingContext2D, buildings: BuildingInstance[], camera: Camera): void {
    // Sort by tx+ty for painter's order
    const sorted = [...buildings].sort((a, b) => (a.tx + a.ty) - (b.tx + b.ty));
    for (const b of sorted) {
      this.drawBuilding(ctx, b, camera);
    }
  }

  private drawBuilding(ctx: CanvasRenderingContext2D, b: BuildingInstance, camera: Camera): void {
    const def = BUILDING_MAP.get(b.defId);
    if (!def) return;

    const PLAYER_COLORS: Record<number, string> = { 1: '#2255cc', 2: '#cc2222', 0: '#555' };
    const color = PLAYER_COLORS[b.playerId] ?? '#555';
    const zoom = camera.zoom;

    // Draw each tile of the building footprint
    for (let dy = 0; dy < def.size; dy++) {
      for (let dx = 0; dx < def.size; dx++) {
        const tx = b.tx + dx;
        const ty = b.ty + dy;
        const center = this.iso.worldToScreen(tx + 0.5, ty + 0.5, 0, camera);
        const hw = (TILE_WIDTH / 2) * zoom;
        const hh = (TILE_HEIGHT / 2) * zoom;

        ctx.beginPath();
        ctx.moveTo(center.x, center.y - hh);
        ctx.lineTo(center.x + hw, center.y);
        ctx.lineTo(center.x, center.y + hh);
        ctx.lineTo(center.x - hw, center.y);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    // Outline
    const topLeft = this.iso.worldToScreen(b.tx, b.ty, 0, camera);
    const topRight = this.iso.worldToScreen(b.tx + def.size, b.ty, 0, camera);
    const bottomRight = this.iso.worldToScreen(b.tx + def.size, b.ty + def.size, 0, camera);
    const bottomLeft = this.iso.worldToScreen(b.tx, b.ty + def.size, 0, camera);

    ctx.beginPath();
    ctx.moveTo(topLeft.x, topLeft.y);
    ctx.lineTo(topRight.x, topRight.y);
    ctx.lineTo(bottomRight.x, bottomRight.y);
    ctx.lineTo(bottomLeft.x, bottomLeft.y);
    ctx.closePath();
    ctx.strokeStyle = b.selected ? '#ffff00' : 'rgba(0,0,0,0.6)';
    ctx.lineWidth = b.selected ? 2 : 1;
    ctx.stroke();

    // Label (first letter of name)
    const centerScreen = this.iso.worldToScreen(b.tx + def.size / 2, b.ty + def.size / 2, 0, camera);
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.max(8, 10 * zoom)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(def.name[0], centerScreen.x, centerScreen.y + 4 * zoom);
    ctx.textAlign = 'left';

    // HP bar above building
    const hpFrac = b.currentHp / b.maxHp;
    const barW = def.size * TILE_WIDTH * 0.5 * zoom;
    const barH = 4 * zoom;
    const barX = centerScreen.x - barW / 2;
    const barY = topLeft.y - 8 * zoom;
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = hpFrac > 0.5 ? '#44cc44' : hpFrac > 0.25 ? '#cccc00' : '#cc2222';
    ctx.fillRect(barX, barY, barW * hpFrac, barH);
  }
}
