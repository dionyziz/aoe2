import { TILE_WIDTH, TILE_HEIGHT } from '../../constants';
import { TerrainType } from '../../types/map';
import { IsoProjection } from './IsoProjection';
const TERRAIN_COLORS = {
    [TerrainType.Grass]: '#5a8a3c',
    [TerrainType.Dirt]: '#8b6914',
    [TerrainType.Sand]: '#d4b483',
    [TerrainType.Water]: '#2d6fa6',
    [TerrainType.ShallowWater]: '#5090c0',
    [TerrainType.Snow]: '#e8e8f0',
    [TerrainType.Forest]: '#2d5a1e',
    [TerrainType.Rock]: '#696969',
};
const TERRAIN_BORDER_COLORS = {
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
    ctx;
    camera;
    mapData = null;
    dirty = true;
    constructor(ctx, camera) {
        this.ctx = ctx;
        this.camera = camera;
    }
    setMap(mapData) {
        this.mapData = mapData;
        this.dirty = true;
    }
    invalidate() { this.dirty = true; }
    render() {
        if (!this.mapData)
            return;
        const { width: mapW, height: mapH } = this.mapData;
        const camera = this.camera;
        const range = IsoProjection.visibleTileRange(camera, mapW, mapH);
        // Painter's order: render by diagonal d = tx + ty
        const minD = range.minTx + range.minTy;
        const maxD = range.maxTx + range.maxTy;
        for (let d = minD; d <= maxD; d++) {
            const tyMin = Math.max(range.minTy, d - range.maxTx);
            const tyMax = Math.min(range.maxTy, d - range.minTx);
            for (let ty = tyMin; ty <= tyMax; ty++) {
                const tx = d - ty;
                if (tx < range.minTx || tx > range.maxTx)
                    continue;
                const tile = this.mapData.getTile(tx, ty);
                if (!tile)
                    continue;
                this.drawTile(tx, ty, tile.terrain, tile.elevation);
            }
        }
        this.dirty = false;
    }
    drawTile(tx, ty, terrain, elevation) {
        const ctx = this.ctx;
        const camera = this.camera;
        const center = IsoProjection.worldToScreen(tx + 0.5, ty + 0.5, elevation, camera);
        const hw = (TILE_WIDTH / 2) * camera.zoom;
        const hh = (TILE_HEIGHT / 2) * camera.zoom;
        // Slightly darker for higher elevation
        const elevDarken = elevation * 0.08;
        ctx.beginPath();
        ctx.moveTo(center.x, center.y - hh); // top
        ctx.lineTo(center.x + hw, center.y); // right
        ctx.lineTo(center.x, center.y + hh); // bottom
        ctx.lineTo(center.x - hw, center.y); // left
        ctx.closePath();
        const baseColor = TERRAIN_COLORS[terrain] ?? '#888';
        ctx.fillStyle = elevDarken > 0 ? darkenHex(baseColor, elevDarken) : baseColor;
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
/** Darken a hex color by a fraction 0..1 */
function darkenHex(hex, amount) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.round(((n >> 16) & 0xff) * (1 - amount)));
    const g = Math.max(0, Math.round(((n >> 8) & 0xff) * (1 - amount)));
    const b = Math.max(0, Math.round((n & 0xff) * (1 - amount)));
    return `rgb(${r},${g},${b})`;
}
