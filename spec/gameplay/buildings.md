# Buildings

## Placement

1. Player selects villager and opens build menu (B key or Build action button)
2. Build menu shows two pages — see [Input spec](../engine/input.md) for keyboard shortcuts
3. Clicking a building icon enters **placement mode**:
   - A translucent building footprint follows the mouse cursor
   - **Green** = valid placement (all tiles passable, on land, not overlapping any building)
   - **Red** = invalid (any tile blocked, in water, partially off-map)
   - Right-click or Escape cancels placement
4. Left-click with valid footprint → place building:
   - `BuildingInstance` created with `constructionProgress = 0`
   - All footprint tiles marked impassable in NavGrid
   - Villager issued order to walk to the site and build

Age requirements are enforced in the build menu: buttons for buildings requiring a higher age are greyed out with a tooltip "Requires [Age] Age".

---

## Construction

While `constructionProgress < 1.0`, the building is **non-functional**:
- Cannot train units
- Cannot research tech
- Does not contribute pop cap
- Does not provide LOS (fog of war)
- Auto-attack buildings (towers) do not fire

Construction rate per villager:
```
progressPerMs = 1 / (def.buildTime * 1000)
```

Multiple villagers on the same site add their rates (no cap on count, but diminishing returns in practice).

When `constructionProgress >= 1.0`:
- Building becomes functional
- `emit('building:complete', { building })`
- `PlayerManager.recalcAllPopCaps()` called

Visual: hatched diagonal pattern drawn over footprint during construction.

---

## HP and destruction

HP bar color:
- Green: HP > 50% of maxHP
- Yellow: HP 25–50%
- Red: HP < 25%

When HP reaches 0:
- Building is removed from `BuildingManager.buildings`
- All footprint tiles unblocked in NavGrid
- `emit('building:destroyed', { buildingId })`
- Any garrisoned units are killed
- `PlayerManager.recalcAllPopCaps()` called
- Visual: rubble/smoke at destruction site for 30 seconds

---

## Train queue

Buildings with `trainableUnitIds.length > 0` can queue units for training.

Queue rules:
- Maximum 5 entries per building
- Adding to queue: `player.canAfford(def.cost)` checked, resources deducted immediately
- Cannot add if `!player.hasPopRoom()` (population cap reached)
- First entry trains; subsequent entries wait

Training tick:
```typescript
entry.progress += dt / (def.trainTime * 1000);
if (entry.progress >= 1) {
  queue.shift();
  spawnUnit(entry.unitDefId, building.playerId, findSpawnTile(building));
  player.population++;
}
```

`findSpawnTile` searches adjacent tiles in a spiral from the building's south corner until a passable tile is found.

Cancel (right-click on queued unit icon): entry removed, cost refunded 100%.

---

## Research queue

Buildings that perform research (Blacksmith, University, Mill, Lumber Camp, Mining Camp, Market, Monastery, Barracks, Archery Range, Stable, Siege Workshop) use the same queue as training. Research and training share the single building queue (max 1 active at a time, max 5 queued total).

When research completes:
- `TechSystem.applyEffect()` called for each effect in the tech
- `emit('tech:researched', { techId, playerId })`
- Building panel updates to remove the researched tech button

---

## Town Center specifics

- TC is the first building; villager training starts from Dark Age
- TC drop-off point for all resource types
- TC garrison: up to 15 units; garrisoned units heal and can be ungarrisoned
- TC is the only building where age advancement is researched
- Destroying a TC does not eliminate the player unless they have no other units/buildings

---

## Building selection panel

When a building is selected, the bottom panel shows:
- Building name + HP bar (color-coded as above)
- If under construction: construction progress bar instead of HP bar
- Train queue: up to 5 unit icons; first icon has circular progress arc
- Research buttons: available techs for this building (greyed if researched, disabled if can't afford)
- Garrison button and garrison count (if `garrisonCapacity > 0`)
- "Ungarrison all" button (if units are garrisoned)
- Age-up button (Town Center only)

---

## BuildingInstance TypeScript interface

```typescript
interface BuildingInstance {
  id: number;
  defId: string;
  playerId: number;
  tx: number;             // top-left tile x
  ty: number;             // top-left tile y
  currentHp: number;
  constructionProgress: number;    // 0..1
  selected: boolean;
  trainQueue: TrainQueueEntry[];   // max 5
  garrisonedUnitIds: number[];
  isAgingUp: boolean;             // TC only
  ageUpProgress: number;          // TC only, 0..1
}

interface TrainQueueEntry {
  unitDefId: string;
  progress: number;     // 0..1
}
```
