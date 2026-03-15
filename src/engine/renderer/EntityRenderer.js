import { IsoProjection } from './IsoProjection';
import { TILE_WIDTH, TILE_HEIGHT } from '../../constants';
export class EntityRenderer {
    ctx;
    camera;
    constructor(ctx, camera) {
        this.ctx = ctx;
        this.camera = camera;
    }
    render(units, buildings, _alpha) {
        this.renderBuildings(buildings);
        this.renderUnits(units);
        this.renderSelectionRings(units);
    }
    renderBuildings(buildings) {
        const sorted = [...buildings].sort((a, b) => (a.tx + a.ty) - (b.tx + b.ty));
        for (const b of sorted) {
            this.drawBuilding(b);
        }
    }
    renderUnits(units) {
        const sorted = [...units].sort((a, b) => (a.pos.wx + a.pos.wy) - (b.pos.wx + b.pos.wy));
        for (const unit of sorted) {
            this.drawUnit(unit);
        }
    }
    renderSelectionRings(units) {
        for (const unit of units) {
            if (unit.selected) {
                this.drawSelectionRing(unit);
            }
        }
    }
    drawUnit(unit) {
        const ctx = this.ctx;
        const camera = this.camera;
        const screen = IsoProjection.worldToScreen(unit.pos.wx, unit.pos.wy, 0, camera);
        const zoom = camera.zoom;
        // Color by player
        const colors = { 1: '#4169E1', 2: '#DC143C', 0: '#888' };
        const fillColor = colors[unit.playerId] ?? '#888';
        const w = 10 * zoom;
        const h = 20 * zoom;
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(screen.x, screen.y - h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    drawSelectionRing(unit) {
        const ctx = this.ctx;
        const camera = this.camera;
        const screen = IsoProjection.worldToScreen(unit.pos.wx, unit.pos.wy, 0, camera);
        const zoom = camera.zoom;
        const rx = 14 * zoom;
        const ry = 7 * zoom;
        ctx.beginPath();
        ctx.ellipse(screen.x, screen.y, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
    drawBuilding(b) {
        const ctx = this.ctx;
        const camera = this.camera;
        const zoom = camera.zoom;
        const PLAYER_COLORS = { 1: '#2255cc', 2: '#cc2222', 0: '#555' };
        const color = PLAYER_COLORS[b.playerId] ?? '#555';
        // Minimal: draw a single diamond at (tx, ty)
        const center = IsoProjection.worldToScreen(b.tx + 0.5, b.ty + 0.5, 0, camera);
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
        ctx.strokeStyle = (b.isSelected || b.selected) ? '#ffff00' : 'rgba(0,0,0,0.6)';
        ctx.lineWidth = (b.isSelected || b.selected) ? 2 : 1;
        ctx.stroke();
    }
}
