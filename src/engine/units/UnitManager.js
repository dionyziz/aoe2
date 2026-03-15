import { createUnit } from './Unit';
import { MovementSystem } from './MovementSystem';
export class UnitManager {
    units = [];
    selectedIds = new Set();
    movementSystem = new MovementSystem();
    astar;
    navGrid;
    iso;
    camera;
    eventBus;
    constructor(eventBus, astar, navGrid, iso, camera) {
        this.eventBus = eventBus;
        this.astar = astar;
        this.navGrid = navGrid;
        this.iso = iso;
        this.camera = camera;
        eventBus.on('input:leftClick', ({ screenX, screenY }) => {
            this.handleLeftClick(screenX, screenY);
        });
        eventBus.on('input:rightClick', ({ pos }) => {
            this.handleRightClick(pos);
        });
        eventBus.on('input:boxSelect', (rect) => {
            this.handleBoxSelect(rect);
        });
        eventBus.on('input:keydown', ({ code, ctrl }) => {
            if (ctrl && code === 'KeyA')
                this.selectAll();
            if (code === 'Escape')
                this.clearSelection();
        });
    }
    spawn(defId, playerId, wx, wy) {
        const unit = createUnit(defId, playerId, wx, wy);
        this.units.push(unit);
        return unit;
    }
    update(dt) {
        for (const unit of this.units) {
            this.movementSystem.update(unit, dt);
        }
    }
    handleLeftClick(screenX, screenY) {
        // Ignore clicks inside the bottom UI panel
        const PANEL_H = 120;
        if (screenY >= this.camera.canvasHeight - PANEL_H)
            return;
        // Find unit under cursor
        let clicked = null;
        let minDist = 20; // px threshold
        for (const unit of this.units) {
            const screen = this.iso.worldToScreen(unit.pos.wx, unit.pos.wy, 0, this.camera);
            const dx = screenX - screen.x;
            const dy = screenY - screen.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < minDist) {
                minDist = d;
                clicked = unit;
            }
        }
        // Clear selection
        for (const unit of this.units)
            unit.selected = false;
        this.selectedIds.clear();
        if (clicked) {
            clicked.selected = true;
            this.selectedIds.add(clicked.id);
            this.eventBus.emit('unit:selected', { ids: [clicked.id] });
        }
        else {
            this.eventBus.emit('unit:selected', { ids: [] });
        }
    }
    handleRightClick(pos) {
        if (this.selectedIds.size === 0)
            return;
        const selected = this.units.filter(u => u.selected);
        const targets = formationTiles(Math.floor(pos.wx), Math.floor(pos.wy), selected.length, this.navGrid);
        selected.forEach((unit, i) => {
            const goal = targets[i];
            if (!goal)
                return;
            const startTx = Math.floor(unit.pos.wx);
            const startTy = Math.floor(unit.pos.wy);
            const path = this.astar.findPath(startTx, startTy, goal.tx, goal.ty, this.navGrid);
            if (path.length > 0) {
                unit.path = path;
                unit.pathIndex = 0;
                unit.state = 'moving';
                unit.targetPos = { wx: goal.tx + 0.5, wy: goal.ty + 0.5 };
            }
        });
    }
    handleBoxSelect(rect) {
        const PANEL_H = 120;
        if (rect.y >= this.camera.canvasHeight - PANEL_H)
            return;
        for (const unit of this.units)
            unit.selected = false;
        this.selectedIds.clear();
        const selected = [];
        for (const unit of this.units) {
            const screen = this.iso.worldToScreen(unit.pos.wx, unit.pos.wy, 0, this.camera);
            if (screen.x >= rect.x && screen.x <= rect.x + rect.width &&
                screen.y >= rect.y && screen.y <= rect.y + rect.height) {
                unit.selected = true;
                this.selectedIds.add(unit.id);
                selected.push(unit.id);
            }
        }
        this.eventBus.emit('unit:selected', { ids: selected });
    }
    selectAll() {
        for (const unit of this.units) {
            if (unit.playerId === 1) {
                unit.selected = true;
                this.selectedIds.add(unit.id);
            }
        }
        this.eventBus.emit('unit:selected', { ids: [...this.selectedIds] });
    }
    clearSelection() {
        for (const unit of this.units)
            unit.selected = false;
        this.selectedIds.clear();
        this.eventBus.emit('unit:selected', { ids: [] });
    }
    getSelected() {
        return this.units.filter(u => u.selected);
    }
    clearUnitSelection() {
        this.clearSelection();
    }
}
/**
 * Returns N distinct passable tiles around (cx, cy) in a spiral pattern.
 */
function formationTiles(cx, cy, count, nav) {
    const results = [];
    const used = new Set();
    const key = (tx, ty) => ty * 10000 + tx;
    for (let ring = 0; results.length < count; ring++) {
        if (ring === 0) {
            if (nav.isPassable(cx, cy)) {
                results.push({ tx: cx, ty: cy });
                used.add(key(cx, cy));
            }
            continue;
        }
        const candidates = [];
        for (let i = -ring; i <= ring; i++) {
            candidates.push({ tx: cx + i, ty: cy - ring });
            candidates.push({ tx: cx + i, ty: cy + ring });
        }
        for (let i = -ring + 1; i < ring; i++) {
            candidates.push({ tx: cx - ring, ty: cy + i });
            candidates.push({ tx: cx + ring, ty: cy + i });
        }
        candidates.sort((a, b) => (Math.abs(a.tx - cx) + Math.abs(a.ty - cy)) -
            (Math.abs(b.tx - cx) + Math.abs(b.ty - cy)));
        for (const c of candidates) {
            if (results.length >= count)
                break;
            const k = key(c.tx, c.ty);
            if (!used.has(k) && nav.isPassable(c.tx, c.ty)) {
                results.push(c);
                used.add(k);
            }
        }
        if (ring > 20)
            break;
    }
    return results;
}
