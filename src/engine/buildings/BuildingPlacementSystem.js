import { BUILDING_MAP } from '../../data/buildings/index';
import { TILE_WIDTH, TILE_HEIGHT } from '../../constants';
export class BuildingPlacementSystem {
    active = false;
    defId = '';
    previewTx = 0;
    previewTy = 0;
    valid = false;
    iso;
    camera;
    navGrid;
    buildingManager;
    playerId;
    onPlaced;
    constructor(iso, camera, navGrid, buildingManager, playerId) {
        this.iso = iso;
        this.camera = camera;
        this.navGrid = navGrid;
        this.buildingManager = buildingManager;
        this.playerId = playerId;
    }
    startPlacement(defId) {
        this.active = true;
        this.defId = defId;
    }
    cancelPlacement() {
        this.active = false;
    }
    isActive() { return this.active; }
    getDefId() { return this.defId; }
    getPreviewTx() { return this.previewTx; }
    getPreviewTy() { return this.previewTy; }
    isValid() { return this.valid; }
    updateMouse(screenX, screenY) {
        if (!this.active)
            return;
        const world = this.iso.screenToWorld(screenX, screenY, this.camera);
        this.previewTx = Math.floor(world.x);
        this.previewTy = Math.floor(world.y);
        this.checkValid();
    }
    checkValid() {
        const def = BUILDING_MAP.get(this.defId);
        if (!def) {
            this.valid = false;
            return;
        }
        for (let dy = 0; dy < def.size; dy++) {
            for (let dx = 0; dx < def.size; dx++) {
                if (!this.navGrid.isPassable(this.previewTx + dx, this.previewTy + dy)) {
                    this.valid = false;
                    return;
                }
            }
        }
        this.valid = true;
    }
    tryPlace() {
        if (!this.active || !this.valid)
            return false;
        const result = this.buildingManager.place(this.defId, this.playerId, this.previewTx, this.previewTy);
        if (result) {
            this.onPlaced?.(this.defId, this.previewTx, this.previewTy);
            this.active = false;
            return true;
        }
        return false;
    }
    render(ctx) {
        if (!this.active)
            return;
        const def = BUILDING_MAP.get(this.defId);
        if (!def)
            return;
        ctx.save();
        ctx.globalAlpha = 0.6;
        for (let dy = 0; dy < def.size; dy++) {
            for (let dx = 0; dx < def.size; dx++) {
                const tx = this.previewTx + dx;
                const ty = this.previewTy + dy;
                const center = this.iso.worldToScreen(tx + 0.5, ty + 0.5, 0, this.camera);
                const hw = (TILE_WIDTH / 2) * this.camera.zoom;
                const hh = (TILE_HEIGHT / 2) * this.camera.zoom;
                ctx.beginPath();
                ctx.moveTo(center.x, center.y - hh);
                ctx.lineTo(center.x + hw, center.y);
                ctx.lineTo(center.x, center.y + hh);
                ctx.lineTo(center.x - hw, center.y);
                ctx.closePath();
                ctx.fillStyle = this.valid ? 'rgba(0,200,100,0.4)' : 'rgba(200,50,50,0.4)';
                ctx.fill();
                ctx.strokeStyle = this.valid ? '#00ff88' : '#ff4444';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
        // Draw building footprint outline
        const topLeft = this.iso.worldToScreen(this.previewTx, this.previewTy, 0, this.camera);
        const topRight = this.iso.worldToScreen(this.previewTx + def.size, this.previewTy, 0, this.camera);
        const bottomRight = this.iso.worldToScreen(this.previewTx + def.size, this.previewTy + def.size, 0, this.camera);
        const bottomLeft = this.iso.worldToScreen(this.previewTx, this.previewTy + def.size, 0, this.camera);
        ctx.beginPath();
        ctx.moveTo(topLeft.x, topLeft.y);
        ctx.lineTo(topRight.x, topRight.y);
        ctx.lineTo(bottomRight.x, bottomRight.y);
        ctx.lineTo(bottomLeft.x, bottomLeft.y);
        ctx.closePath();
        ctx.strokeStyle = this.valid ? '#00ff88' : '#ff4444';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Label
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.max(10, 13 * this.camera.zoom)}px sans-serif`;
        ctx.textAlign = 'center';
        const centerScreen = this.iso.worldToScreen(this.previewTx + def.size / 2, this.previewTy + def.size / 2, 0, this.camera);
        ctx.fillText(def.name, centerScreen.x, centerScreen.y);
        ctx.textAlign = 'left';
        ctx.restore();
    }
}
