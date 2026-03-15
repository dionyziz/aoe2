# Plan 08 — Buildings

**Status:** 🔄 In Progress
**Depends on:** 04 (pathfinding/NavGrid), 05 (HUD/panel), 07 (unit data)
**Prerequisite for:** 09 (Player System — pop cap sources), 10 (Economy — drop-off buildings), 11 (Combat — buildings can attack)

---

## What AoE2 actually does

- Villagers enter build mode → bottom panel shows a 5×3 grid of building icons grouped by category
- Hovering a button shows a tooltip: building name, cost, HP, description
- Clicking a building starts placement mode: a translucent footprint follows the mouse
  - Green = valid (all tiles passable, on land, not overlapping)
  - Red = invalid
  - Right-click cancels placement
- On left-click placement: villager walks to building site and constructs it (construction progress bar)
- Buildings have a build time and show scaffolding until complete
- Some buildings require an age (e.g. Castle requires Castle Age)
- Selected building shows: name, HP bar, garrison count, train queue with progress bar, available research

---

## Remaining work

### 08-A  Build menu layout (DONE but buggy)

**Bug fixed:** UnitManager was eating left-clicks in the panel, clearing unit selection before
`openBuildMenu()` took effect. Fixed by ignoring clicks where `screenY >= canvasHeight - 120`.

**Still needed:**
- The build menu should show **two pages** like AoE2: economy buildings (page 1) and military (page 2)
- **Page 1 (economy):** House (H), Farm (F), Mill (M), Lumber Camp (L), Mining Camp (N), Dock (D), Market (K), → next page button (Col 5, Row 1)
- **Page 2 (military):** Barracks (B), Archery Range (A), Stable (S), Siege Workshop (K), Blacksmith (C), University (U), Monastery (Y), Castle (V), Watch Tower (T), Palisade Wall (P), Stone Wall (W), Gate (G), Wonder (W) ← back button (Col 5, Row 1)
- Buildings greyed out if: wrong age, can't afford, or already at limit (e.g. 1 TC only)
- Age requirements enforced: show greyed icon with "Requires Feudal Age" tooltip
- Keyboard shortcuts matching AoE2 DE (not original):
  - All shortcuts shown as text on button face
  - Page switch: clicking the `→` / `←` button, or pressing Tab

### 08-B  Building construction (not yet implemented)

- `constructionProgress` starts at 0 when placed, reaches 1.0 when done
- Villager assigned to construction: walks to building, plays build animation, increments progress each tick
- Construction rate: `hp_per_second = building.hp / building.buildTime`
- Building is impassable and non-functional until `constructionProgress >= 1.0`
- Render: show scaffolding (hatched pattern over the footprint) while under construction
- HP bar during construction shows build progress, not HP
- Multiple villagers build faster (each adds their build rate)

Implementation:
```
BuildingManager.startConstruction(buildingId, villagerId)
BuildingManager.update(dt):
  for each building with constructionProgress < 1:
    find assigned villagers, add build rate * dt / buildTime
    when progress >= 1: building becomes functional, emit 'building:complete'
```

### 08-C  Building selection panel (partial)

Currently shows name + HP bar. Still needed:
- **Train queue**: show up to 5 queued unit icons in a row; first one has a progress arc
- **Train button actions**: clicking a train button deducts resources and adds to queue
- **Cancel queue**: right-click on queued unit removes it (refunds 100% cost)
- **Research buttons**: for buildings that have tech (Blacksmith, University, etc.)
- **Garrison**: Town Center and Castle can garrison units; show garrison count

### 08-D  Building HP and destruction

- Buildings take damage from attacks (Phase 11)
- HP bar turns yellow at 50%, red at 25%
- At 0 HP: building is destroyed, removed from map, nav grid tiles unblocked
- Rubble/smoke effect at destruction site (simple canvas drawing)
- emit `'building:destroyed'` event

### 08-E  Town Center specifics

- Villager trains from TC (already in trainableUnitIds)
- TC can garrison up to 15 units; garrisoned units heal and can be ungarrisoned
- TC drop-off point for resources (villagers walk here to deposit)
- Show "Return resources" button when villager with resources selected + TC visible

### 08-F  Population cap

Population cap logic (full spec in [09-player-system.md](09-player-system.md)):
- Buildings with `providesPopulation > 0` contribute to `player.popCap` when construction complete
- `BuildingManager` calls `playerManager.recalcAllPopCaps()` after any building placed or destroyed
- HUD pop counter turns red when at cap; train buttons disabled when `!player.hasPopRoom()`

---

## File changes needed

| File | Change |
|------|--------|
| `src/engine/buildings/BuildingManager.ts` | Add `update(dt)`, construction queue, destruction |
| `src/engine/buildings/BuildingPlacementSystem.ts` | Two-page build menu state |
| `src/engine/renderer/UIRenderer.ts` | Two-page build menu, train queue display, construction progress |
| `src/engine/renderer/EntityRenderer.ts` | Scaffolding render, destruction effect |
| `src/engine/Game.ts` | Wire BuildingManager → PlayerManager.recalcAllPopCaps() |
| `src/types/building.ts` | Add `garrisonCapacity`, `providesPopulation` |
| `src/engine/EventBus.ts` | Add `building:complete`, `building:destroyed` events |
