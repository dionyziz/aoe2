# Fog of War

## Visibility states

Each tile has one of three states, per player:

| State | Value | Render |
|-------|-------|--------|
| Hidden | 0 | Solid black — never seen |
| Explored | 1 | 55% black overlay — terrain visible, no units/buildings |
| Visible | 2 | Full color — all entities shown |

The `explored` array persists across the game. The `visible` array is recomputed every simulation tick.

---

## Data structure

```typescript
class FogOfWar {
  private explored: Uint8Array;   // 0 or 1; persists; index = ty*mapWidth + tx
  private visible:  Uint8Array;   // 0 or 2; recomputed each tick

  update(units: UnitInstance[], buildings: BuildingInstance[], mapData: MapData): void {
    this.visible.fill(0);
    for (const unit of units) {
      if (unit.playerId !== LOCAL_PLAYER_ID) continue;
      this.revealCircle(unit.pos.wx, unit.pos.wy, UNIT_MAP.get(unit.defId)!.lineOfSight);
    }
    for (const building of buildings) {
      if (building.playerId !== LOCAL_PLAYER_ID) continue;
      const def = BUILDING_MAP.get(building.defId)!;
      this.revealCircle(building.tx + def.size/2, building.ty + def.size/2, def.lineOfSight);
    }
  }

  private revealCircle(cx: number, cy: number, radius: number): void {
    const r2 = radius * radius;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx*dx + dy*dy <= r2) {
          const tx = Math.floor(cx + dx);
          const ty = Math.floor(cy + dy);
          const idx = ty * this.width + tx;
          if (idx >= 0 && idx < this.visible.length) {
            this.visible[idx] = 2;
            this.explored[idx] = 1;
          }
        }
      }
    }
  }

  getState(tx: number, ty: number): 0 | 1 | 2 {
    const idx = ty * this.width + tx;
    if (this.visible[idx] === 2) return 2;
    return this.explored[idx] as 0 | 1;
  }
}
```

---

## LOS values

### Units

Default LOS by class:
| Class | LOS (tiles) |
|-------|------------|
| Villager | 4 |
| Infantry | 4 |
| Archer | 6 |
| Scout Cavalry | 6 |
| Knight/Cavalry | 5 |
| Siege | 5 |
| Monk | 5 |
| Ship | 5–7 |

(Exact per-unit values are set in `UnitDef.lineOfSight`.)

### Buildings

| Building | LOS |
|----------|-----|
| Town Center | 8 |
| Barracks / Stable / Archery Range / Siege Workshop | 6 |
| Blacksmith / Market / Monastery / University | 6 |
| Watch Tower | 8 |
| Guard Tower | 9 |
| Keep | 10 |
| Castle | 11 |
| All walls / gates | 3 |
| Economy buildings (Mill, Lumber Camp, Mining Camp, Farm) | 5 |
| House | 2 |
| Dock | 6 |

Buildings under construction do **not** provide LOS until `constructionProgress >= 1`.

---

## Entity visibility rules

| Entity | Hidden tile | Explored tile | Visible tile |
|--------|-------------|---------------|-------------|
| Own unit/building | Drawn | Drawn | Drawn |
| Allied unit/building | Drawn | Not drawn | Drawn |
| Enemy unit | Not drawn | Not drawn | Drawn |
| Enemy building | Not drawn | Drawn (last known state) | Drawn |

Enemy buildings remain visible in explored tiles at their last known HP/state. They are not updated when out of sight.

---

## Rendering

`FogRenderer` draws after terrain and entities. It iterates visible tiles in painter's order and draws diamond-shaped overlays:

```typescript
if (state === 0) fillStyle = '#000000';
if (state === 1) fillStyle = 'rgba(0, 0, 0, 0.55)';
if (state === 2) continue;  // fully visible, skip
```

The diamond shape matches the tile diamond geometry.

Performance: fog is redrawn every frame from the `visible` and `explored` arrays. An offscreen canvas cache is used; it is invalidated when the `visible` array changes (dirty flag set by `FogOfWar.update()`).

---

## Minimap fog

- Black tiles: `state === 0` (hidden)
- Dimmed terrain: `state === 1` (explored, 50% opacity)
- Full color: `state === 2` (visible)
- Enemy units: only shown if the tile is currently visible (`state === 2`)

---

## Team LOS sharing

Allied players share line of sight: the local player treats an allied unit's LOS as their own. Enemy units visible to any ally are shown on the local player's screen.

---

## Debug toggle

`Ctrl+Shift+F` toggles fog of war off/on for the local player (reveals entire map).
Console: `window.game.fog.revealAll()` sets all `explored` and `visible` tiles to maximum.
