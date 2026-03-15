# Plan 04 — Pathfinding & Movement

**Status:** ✅ Done

---

## A* implementation

8-directional with octile distance heuristic:
```
D = 1.0, D2 = √2
h(a,b) = D*(dx+dy) + (D2-2D)*min(dx,dy)
```

Diagonal moves are blocked if either cardinal neighbour is impassable (no corner-cutting through walls).

Open list uses a `Map<key, Node>` scanned linearly for minimum f — acceptable for maps up to ~50×50. For larger maps (128+) upgrade to a binary heap.

## NavGrid

`Uint8Array` of passability (1=passable, 0=blocked). Updated when:
- Buildings are placed/destroyed
- Map tiles change (Phase 10: forests depleted)

## Formation spreading

When multiple units receive a move order to the same tile, `formationTiles()` assigns each a distinct destination using a square-spiral outward search from the goal. Prevents all units converging to exactly `tx+0.5, ty+0.5`.

## Movement integration

`MovementSystem` runs each simulation tick (20 Hz):
- Walk toward center of current path tile (`tx+0.5, ty+0.5`)
- On arrival at tile center: advance `pathIndex`
- On path completion: `state → Idle`
- Speed constant: `UNIT_SPEED = 0.003 tiles/ms` (overridden per unit in Phase 10)

## Known limitations / next steps

- Speed ignores `UnitDef.speed` — fix in Phase 09 (Player System / unit stats)
- No path smoothing — units walk grid-tile-by-tile with visible direction snapping
- PathCache exists but is not wired in (can improve re-pathfinding cost for large groups)
- No dynamic obstacle avoidance (units clip through each other while moving)
- Trebuchet/siege units should have slower speeds — enforced when `UnitDef.speed` is used

## Files

```
src/engine/pathfinding/AStar.ts
src/engine/pathfinding/NavGrid.ts
src/engine/pathfinding/PathCache.ts
src/engine/units/MovementSystem.ts
src/engine/units/Unit.ts           ← worldToDirection()
```
