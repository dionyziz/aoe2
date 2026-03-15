import type { BuildingInstance } from '../../types/building';
import type { EventBus } from '../EventBus';
import type { NavGrid } from '../pathfinding/NavGrid';
import { BUILDING_MAP } from '../../data/buildings/index';

let nextBuildingId = 1;

export class BuildingManager {
  readonly buildings: BuildingInstance[] = [];
  private navGrid: NavGrid;
  private eventBus: EventBus;

  constructor(navGrid: NavGrid, eventBus: EventBus) {
    this.navGrid = navGrid;
    this.eventBus = eventBus;
  }

  place(defId: string, playerId: number, tx: number, ty: number): BuildingInstance | null {
    const def = BUILDING_MAP.get(defId);
    if (!def) return null;

    // Check passability
    for (let dy = 0; dy < def.size; dy++) {
      for (let dx = 0; dx < def.size; dx++) {
        if (!this.navGrid.isPassable(tx + dx, ty + dy)) return null;
      }
    }

    const building: BuildingInstance = {
      id: nextBuildingId++,
      defId,
      playerId,
      tx, ty,
      currentHp: def.hp,
      maxHp: def.hp,
      constructionProgress: 1.0, // instantly built for now
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

  getAt(tx: number, ty: number): BuildingInstance | null {
    for (const b of this.buildings) {
      const def = BUILDING_MAP.get(b.defId);
      if (!def) continue;
      if (tx >= b.tx && tx < b.tx + def.size && ty >= b.ty && ty < b.ty + def.size) {
        return b;
      }
    }
    return null;
  }

  selectAt(tx: number, ty: number): BuildingInstance | null {
    for (const b of this.buildings) b.selected = false;
    const b = this.getAt(tx, ty);
    if (b) b.selected = true;
    return b;
  }

  clearSelection(): void {
    for (const b of this.buildings) b.selected = false;
  }
}
