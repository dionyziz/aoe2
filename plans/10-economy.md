# Plan 10 — Economy

**Status:** 📋 Planned
**Depends on:** 08 (buildings: TC, Mill, Lumber Camp, Mining Camp, Farm), 09 (Player System — resource counts, pop cap)

---

## Overview

Economy is the heart of AoE2. A villager's full economic loop:
1. Player right-clicks a resource with villager selected → villager walks to resource
2. Villager reaches resource → enters Gathering state → plays gather animation
3. After carrying capacity is full (varies by resource) → villager walks to nearest drop-off
4. At drop-off → resources added to player totals → villager walks back to resource
5. Resource depletes to 0 → villager stands idle at resource

---

## Resource types & gathering rates

| Resource | Carrying Cap | Base Rate | Drop-off Building | Notes |
|----------|-------------|-----------|-------------------|-------|
| Wood | 35 | 25/min | Lumber Camp, TC | Trees deplete at 100 wood each |
| Food (hunt) | 35 | 40/min | Mill, TC | Deer/boar/sheep |
| Food (berry) | 35 | 26/min | Mill, TC | Berry bushes, 125 food each |
| Food (farm) | 10 | 22/min | Mill, TC | Farms need villager assigned |
| Gold | 35 | 30/min | Mining Camp, TC | Gold mines at 800 gold |
| Stone | 35 | 28/min | Mining Camp, TC | Stone mines at 350 stone |

---

## Data model changes

### UnitInstance additions
```typescript
interface UnitInstance {
  // ...existing fields...
  carryType: ResourceType | null;   // what the unit is carrying
  carryAmount: number;              // how much (0..carryCapacity)
  gatherTargetId: number | null;    // resource node id
  dropOffTargetId: number | null;   // building id to drop off at
}
```

### ResourceNode (already in types/map.ts)
- `remaining: number` — depletes as gathered
- When `remaining <= 0`: node removed, tile becomes passable, minimap updated

---

## New state: UnitStateId.Gathering

```
UnitStateId enum additions:
  Gathering = 'gathering'
  ReturningResource = 'returning_resource'
  DropOff = 'dropoff'
  Farming = 'farming'
  Building = 'building'      // constructing a building
  Repairing = 'repairing'
```

---

## GatherSystem.ts  (`src/engine/economy/GatherSystem.ts`)

```typescript
class GatherSystem {
  update(unit: UnitInstance, dt: number, mapData: MapData, buildings: BuildingInstance[]): void {
    switch (unit.state) {
      case UnitStateId.Gathering:
        this.tickGather(unit, dt, mapData);
        break;
      case UnitStateId.ReturningResource:
        this.tickReturn(unit, dt, buildings);
        break;
    }
  }

  private tickGather(unit, dt, mapData) {
    const node = mapData.getResourceNode(unit.gatherTargetId);
    if (!node || node.remaining <= 0) {
      unit.state = UnitStateId.Idle;
      return;
    }
    const rate = GATHER_RATES[node.type]; // per-second
    const gathered = rate * dt / 1000;
    const actualGathered = Math.min(gathered, node.remaining, carryCapacity - unit.carryAmount);
    node.remaining -= actualGathered;
    unit.carryAmount += actualGathered;
    unit.carryType = node.type;

    if (unit.carryAmount >= CARRY_CAPACITY[node.type]) {
      // Find nearest drop-off building and walk there
      const dropOff = findNearestDropOff(unit, node.type, buildings);
      if (dropOff) {
        unit.dropOffTargetId = dropOff.id;
        unit.state = UnitStateId.ReturningResource;
        // path to drop-off
      }
    }
  }

  private tickReturn(unit, dt, buildings) {
    // MovementSystem handles movement
    // When unit reaches drop-off tile:
    const building = buildings.find(b => b.id === unit.dropOffTargetId);
    if (isAdjacentTo(unit, building)) {
      playerResources[unit.playerId][unit.carryType] += unit.carryAmount;
      unit.carryAmount = 0;
      unit.carryType = null;
      // Walk back to resource
      unit.state = UnitStateId.Gathering;
      // path back to gatherTargetId
    }
  }
}
```

---

## Right-click on resource

`UnitManager.handleRightClick` extended:
- If target tile has `resourceId !== null` AND selected unit is villager:
  → set `unit.gatherTargetId = tile.resourceId`
  → path to tile adjacent to resource
  → on arrival: `unit.state = UnitStateId.Gathering`
- If target is a building owned by player (drop-off type):
  → If unit carrying resources: drop off immediately

---

## Farm system

Farms are placed like buildings but:
- Each farm needs a villager assigned to work it
- Farm has `foodRemaining` (starts at 250 after any Mill/Heavy Plow/Crop Rotation upgrades)
- Villager stands on farm tile, plays farm animation, generates food at 22/min
- When farm depletes: farm "needs reseeding" — auto-reseed option (costs wood)
- Auto-reseed toggle per farm (default off until Feudal)

---

## Resource changes and Player.add()

When a villager drops off resources, `GatherSystem` calls `player.add(type, amount)` (see Plan 09).
This updates `player.resources` and triggers HUD refresh.

Resource totals are read by `BuildingManager.addToTrainQueue()` (Plan 08) and `TechSystem.startResearch()` (Plan 13).
Economy only *adds* resources; spending is handled by the respective producer system.

---

## UI changes for economy

### Villager carrying indicator
- When `unit.carryAmount > 0`: show small resource icon above unit head
  - Wood = brown axe icon, Gold = yellow coin, Stone = grey rock, Food = red meat

### Resource node labels
- Hover over resource tile: show tooltip with remaining amount
- Forest tiles show wood icon + remaining amount

### HUD resource change indicators
- When resources change: show a floating +N or -N text that fades out over 2 seconds
- Resource counts animate smoothly (lerp toward actual value)
