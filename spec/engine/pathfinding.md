# Pathfinding & Movement

## A* implementation

8-directional pathfinding on the tile grid.

### Heuristic

Octile distance (admissible for 8-directional grids):

```
D  = 1.0    (cardinal move cost)
D2 = √2     (diagonal move cost ≈ 1.414)

h(a, b) = D * (dx + dy) + (D2 - 2*D) * min(dx, dy)
```

where `dx = |a.tx - b.tx|`, `dy = |a.ty - b.ty|`.

### Diagonal corner-cutting

A diagonal move from `(tx, ty)` to `(tx+1, ty+1)` is only allowed if **both** cardinal neighbours `(tx+1, ty)` and `(tx, ty+1)` are passable. This prevents units from cutting through wall corners.

### Open list

`Map<key, Node>` scanned linearly for minimum `f = g + h`. Acceptable for maps up to ~50×50. For maps 128+ tiles across, upgrade to a binary min-heap.

### Path result

Returns `TileCoord[]` from current position to goal (inclusive of goal, exclusive of start). Empty array if no path found.

---

## NavGrid

`Uint8Array` of passability: `1 = passable`, `0 = blocked`.

Index: `ty * mapWidth + tx`.

Updated when:
- A building is placed → block its footprint tiles
- A building is destroyed → unblock its footprint tiles
- A forest tile is depleted → tile becomes passable
- A unit dies → does NOT update NavGrid (infantry corpses don't block movement)

Ships use a separate NavGrid that inverts passability (water = passable, land = blocked). Not yet implemented.

---

## Formation spreading

When multiple units receive a move order to the same target tile `(tx, ty)`, `formationTiles()` assigns each unit a distinct passable destination:

```typescript
function formationTiles(
  goalTx: number, goalTy: number,
  count: number,
  navGrid: NavGrid
): TileCoord[] {
  const result: TileCoord[] = [];
  // Spiral outward from goal: rings 0, 1, 2, ...
  for (let ring = 0; result.length < count; ring++) {
    for each tile (tx, ty) on the perimeter of the ring square:
      if (navGrid.isPassable(tx, ty) && !result.includes({tx, ty})):
        result.push({tx, ty});
        if (result.length === count) break;
  }
  return result;
}
```

Each unit in the selection is assigned a distinct tile from this list.

---

## Movement integration

`MovementSystem` runs each simulation tick (20 Hz):

```
For each moving unit:
  1. Target = center of current path tile (tx+0.5, ty+0.5)
  2. dx = target.wx - unit.pos.wx
     dy = target.wy - unit.pos.wy
     dist = sqrt(dx*dx + dy*dy)
  3. If dist <= speed*dt:
       unit.pos = target          // snap to tile center
       pathIndex++
       If pathIndex >= path.length:
         unit.state = Idle
  4. Else:
       unit.pos.wx += (dx/dist) * speed * dt
       unit.pos.wy += (dy/dist) * speed * dt
  5. Update unit.direction from (dx, dy)
```

**Speed** comes from `UNIT_MAP.get(unit.defId).speed` (tiles/second), converted to tiles/ms.

**Direction encoding:**

```
angle = atan2(dy, dx)   // -π to π; 0 = east
dirIndex = Math.round(angle / (π/4) + 2) % 8
```

Direction indices: 0=S, 1=SW, 2=W, 3=NW, 4=N, 5=NE, 6=E, 7=SE.

---

## Render interpolation

The renderer receives `alpha = accumulator / TICK_MS` (0..1) and lerps unit positions:

```typescript
const renderX = lerp(unit.prevPos.wx, unit.pos.wx, alpha);
const renderY = lerp(unit.prevPos.wy, unit.pos.wy, alpha);
```

`unit.prevPos` is set to `unit.pos` at the start of each simulation tick, before `MovementSystem` runs.

---

## Known limitations

- Open list is O(n) per extraction — acceptable up to ~50×50 maps
- No path smoothing — units walk grid-tile-by-tile (direction snapping visible)
- No dynamic obstacle avoidance — units clip through each other while moving
- `PathCache` class exists but is not wired (can be used to avoid re-pathfinding for large groups)
