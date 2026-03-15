# Plan 15 — AI Opponent

**Status:** 📋 Planned
**Depends on:** 10 (Economy — gather orders), 11 (Combat — attack orders), 13 (Tech Tree — research/age-up)

---

## Architecture

The AI runs entirely in the game simulation (same thread, not a worker).
It executes at **2 Hz** (every 500ms) to avoid CPU spikes.
Each AI player has an `AIController` instance that reads game state and issues orders.

```typescript
// src/engine/ai/AIController.ts
class AIController {
  playerId: number;
  difficulty: AIDifficulty;
  private phase: AIPhase = 'dark_age_economy';
  private buildQueue: string[] = [];
  private knownEnemyTC: TileCoord | null = null;
  private lastThinkTime = 0;

  think(dt: number, snapshot: GameStateSnapshot): void {
    this.lastThinkTime += dt;
    if (this.lastThinkTime < 500) return;
    this.lastThinkTime = 0;
    this.runScript(snapshot);
  }
}
```

---

## AI phases (scripted FSM)

```
dark_age_economy
  → Build: 6 houses (as population approaches cap)
  → TC trains villagers until 20–22 pop
  → Assign villagers: 40% food, 35% wood, 15% gold, 10% stone
  → Transition when: food >= 500 AND housing available

feudal_age_up
  → Research Feudal Age at TC
  → During age-up: continue economy, queue Barracks + Archery Range
  → Transition when: age == Feudal

feudal_economy
  → Build Barracks, Archery Range (if not built)
  → Continue villagers to 28–32 pop
  → Start military production: archers + spearmen
  → Transition when: military count >= 8 AND food >= 800

castle_age_up
  → Research Castle Age at TC
  → During age-up: continue economy
  → Transition when: age == Castle

castle_military
  → Build Stable (1–2), Siege Workshop
  → Train knights + mangonels
  → Accumulate 15–20 military units
  → Transition when: military count >= 15

attack
  → Move all military toward enemy TC
  → Siege units target nearest building
  → Melee/ranged targets units first, then buildings
  → If all military dead: return to castle_military
  → If enemy eliminated: victory check
```

---

## Difficulty levels

| Level | Villagers | Age-up | Military ratio | First attack | Micro |
|-------|-----------|--------|----------------|--------------|-------|
| Easiest | 15 max | Very late (~20 min) | Low (8 units) | Never | None |
| Standard | 22 | Normal (~12 min) | Medium (15) | ~15 min | None |
| Hard | 30 | Fast (~9 min) | High (20) | ~10 min | Basic retreat |
| Hardest | 40 | Very fast (~7 min) | Very high (25+) | ~8 min | Full micro |

---

## Resource allocation

```typescript
function allocateVillagers(
  villagers: UnitInstance[],
  resources: ResourceCounts,
  phase: AIPhase,
  mapData: MapData
): void {
  const targets = getResourceTargets(phase, resources);
  // targets = { food: 0.40, wood: 0.35, gold: 0.15, stone: 0.10 }

  for (const v of villagers) {
    if (v.state !== UnitStateId.Idle) continue; // don't interrupt working villagers
    const type = pickResourceType(targets, resources);
    const node = findNearestResource(v.pos, type, mapData);
    if (node) issueGatherOrder(v, node.id);
  }
}
```

---

## Build order (Standard difficulty)

Dark Age:
1. 4 villagers → food (sheep/berries near TC)
2. 2 villagers → build Lumber Camp + gather wood
3. Train villagers continuously until 14 pop
4. Build Houses when pop approaching cap
5. 2 villagers → build Mining Camp + gold
6. At 500 food: age up to Feudal

Feudal:
7. 1 villager → build Barracks
8. 1 villager → build Archery Range
9. Train 4 archers from Archery Range
10. At 800 food + 200 gold: age up to Castle

Castle:
11. 2 villagers → build Stable
12. Train 4 knights from Stable
13. At 15 military units: launch attack

---

## Attack logic

```typescript
function conductAttack(
  military: UnitInstance[],
  enemyBuildings: BuildingInstance[],
  enemyUnits: UnitInstance[]
): void {
  const tc = enemyBuildings.find(b => b.defId === 'town_center');
  const target = tc ?? enemyBuildings[0];

  for (const unit of military) {
    const def = UNIT_MAP.get(unit.defId)!;
    if (def.class === UnitClass.Siege) {
      // Siege targets buildings
      if (target) issueAttackOrder(unit, target.id, true);
    } else {
      // Others: attack-move toward TC
      const pos = target
        ? { wx: target.tx + target.size / 2, wy: target.ty + target.size / 2 }
        : findNearestEnemy(unit.pos, enemyUnits)?.pos;
      if (pos) issueAttackMoveOrder(unit, pos);
    }
  }
}
```

---

## Scouting

- At game start: AI sends 1 Scout Cavalry (or Eagle Scout for Mesoamerican civs) to explore the map
- Scout follows a modified spiral path from own base
- When enemy TC is found: stored in `knownEnemyTC`, used for attack pathfinding
- AI updates enemy position if units are seen elsewhere (fog of war awareness)

---

## Difficulty cheats (matching AoE2)

AoE2 gives AI resource bonuses at higher difficulties:

```typescript
const RESOURCE_TRICKLE_PER_MIN: Record<AIDifficulty, number> = {
  easiest:  0,
  standard: 0,
  hard:     50,   // 50 of each resource per minute
  hardest:  200,
};
```

Hardest also starts with doubled starting resources.

---

## AI orders flow

AI issues orders using the same `CommandSystem` as the human player (Plan 18 prerequisite).
This ensures determinism in multiplayer: AI decisions are seeded and repeatable.

```typescript
// AI issues a command like the human player would:
commandSystem.submit({
  type: 'move',
  playerId: this.playerId,
  unitIds: [scoutId],
  tx: explorationTarget.tx,
  ty: explorationTarget.ty
});
```

---

## Files to create

```
src/engine/ai/AIController.ts       ← Main AI brain
src/engine/ai/AIBuildOrder.ts       ← Build order tables + queue management
src/engine/ai/AIResourceManager.ts  ← Villager allocation logic
src/engine/ai/AICombatManager.ts    ← Attack/retreat decisions
src/engine/ai/AIScouting.ts         ← Exploration + enemy tracking
```

---

## Known limitations / future work

- No diplomacy AI (never allies, never tributes)
- No naval AI (ships ignored)
- No wall building
- No unique unit usage (always trains generic units)
- No response to player strategy (always follows scripted FSM)
- Personality scripts (.per files from original AoE2) not implemented
