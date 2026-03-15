import { BUILDING_MAP } from '../../data/buildings/index';
let nextBuildingId = 1;
export class BuildingManager {
    buildings = [];
    navGrid;
    eventBus;
    constructor(navGrid, eventBus) {
        this.navGrid = navGrid;
        this.eventBus = eventBus;
    }
    place(defId, playerId, tx, ty) {
        const def = BUILDING_MAP.get(defId);
        if (!def)
            return null;
        // Check passability
        for (let dy = 0; dy < def.size; dy++) {
            for (let dx = 0; dx < def.size; dx++) {
                if (!this.navGrid.isPassable(tx + dx, ty + dy))
                    return null;
            }
        }
        const building = {
            id: nextBuildingId++,
            defId,
            playerId,
            tx, ty,
            currentHp: def.hp,
            maxHp: def.hp,
            constructionProgress: 1.0, // instantly built for now
            trainQueue: [],
            researchQueue: [],
            garrisonedUnitIds: [],
            isSelected: false,
            selected: false,
        };
        // Block nav grid
        for (let dy = 0; dy < def.size; dy++) {
            for (let dx = 0; dx < def.size; dx++) {
                this.navGrid.setPassable(tx + dx, ty + dy, false);
            }
        }
        this.buildings.push(building);
        return building;
    }
    getAt(tx, ty) {
        for (const b of this.buildings) {
            const def = BUILDING_MAP.get(b.defId);
            if (!def)
                continue;
            if (tx >= b.tx && tx < b.tx + def.size && ty >= b.ty && ty < b.ty + def.size) {
                return b;
            }
        }
        return null;
    }
    selectAt(tx, ty) {
        for (const b of this.buildings) {
            b.isSelected = false;
            b.selected = false;
        }
        const b = this.getAt(tx, ty);
        if (b) {
            b.isSelected = true;
            b.selected = true;
        }
        return b;
    }
    clearSelection() {
        for (const b of this.buildings) {
            b.isSelected = false;
            b.selected = false;
        }
    }
}
