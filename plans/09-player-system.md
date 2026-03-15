# Plan 09 — Player System

**Status:** 📋 Planned
**Depends on:** 07 (unit/building defs), 08 (buildings: pop-cap sources)

---

## Why this plan exists

Economy, Combat, Tech Tree, and Win Conditions all need to read and mutate per-player state:
resources, population, current age, and researched technologies. Rather than scattering this
state across `Game.ts`, it lives in a `Player` class managed by `PlayerManager`.

---

## Player class (`src/engine/player/Player.ts`)

```typescript
export interface ResourceCounts {
  food: number;
  wood: number;
  gold: number;
  stone: number;
}

export class Player {
  readonly id: number;           // 1 = local human, 2+ = AI / remote
  readonly civId: string;
  name: string;
  color: string;                 // CSS color for unit tinting

  // Resources
  resources: ResourceCounts;

  // Population
  population: number;            // units currently alive (not training)
  popCap: number;                // sum of all pop-providing structures

  // Age
  currentAge: UnitAge;           // 'dark' | 'feudal' | 'castle' | 'imperial'
  isAgingUp: boolean;
  ageUpProgress: number;         // 0..1

  // Technologies
  researchedTechs: Set<string>;  // tech ids

  constructor(id: number, civId: string, startResources: ResourceCounts) { ... }

  // Resource helpers
  canAfford(cost: Partial<ResourceCounts>): boolean { ... }
  deduct(cost: Partial<ResourceCounts>): void { ... }
  add(type: keyof ResourceCounts, amount: number): void { ... }

  // Population helpers
  hasPopRoom(units?: number): boolean {
    return this.population + (units ?? 1) <= this.popCap;
  }
  recalcPopCap(buildings: BuildingInstance[]): void {
    this.popCap = buildings
      .filter(b => b.playerId === this.id && b.constructionProgress >= 1)
      .reduce((sum, b) => sum + (BUILDING_MAP.get(b.defId)?.providesPopulation ?? 0), 0);
    this.popCap = Math.min(this.popCap, MAX_POPULATION);  // AoE2 cap = 200
  }

  // Age helpers
  meetsAgeRequirement(minAge: UnitAge): boolean { ... }
}

export const MAX_POPULATION = 200;
```

---

## PlayerManager (`src/engine/player/PlayerManager.ts`)

```typescript
export class PlayerManager {
  private players: Map<number, Player> = new Map();

  add(player: Player): void { ... }
  get(id: number): Player | undefined { ... }
  getAll(): Player[] { ... }

  // Called every tick (or on building placed/destroyed)
  recalcAllPopCaps(buildings: BuildingInstance[]): void {
    for (const p of this.players.values()) {
      p.recalcPopCap(buildings);
    }
  }
}
```

---

## Starting resources

AoE2 default starting resources (customisable in Game Setup, Plan 17):

| Setting | Food | Wood | Gold | Stone |
|---------|------|------|------|-------|
| Standard | 200 | 200 | 0 | 0 |
| Medium | 500 | 500 | 500 | 0 |
| High | 1000 | 1000 | 1000 | 0 |
| Infinite | 99999 | 99999 | 99999 | 99999 |

---

## Population cap sources

| Building | Pop provided |
|----------|-------------|
| Town Center | 5 |
| House | 5 |
| Castle | 10 |
| Krepost (Bulgarians unique) | 5 |
| Harbor (Italians unique) | 5 |

Hard cap: 200 regardless of buildings.

Player starts with 5 pop from initial Town Center (before construction finishes, the TC counts).

---

## Age-up flow

Age-up is treated like a very long research in the Town Center.

```
Player clicks "Advance to Feudal Age" button in TC panel
  → canAfford check (500 food)
  → deduct resources
  → BuildingManager.startResearch(tc.id, 'feudal_age')
  → TC shows progress bar (same as train queue)
  → On complete: player.currentAge = 'feudal', emit 'player:aged_up'
  → Game.ts handler: update build menu availability, unlock buildings/techs
  → UI: banner "The Britons have advanced to the Feudal Age!"
```

Age costs and times:

| To Age | Food | Gold | Time |
|--------|------|------|------|
| Feudal | 500 | 0 | 130s |
| Castle | 800 | 200 | 160s |
| Imperial | 1000 | 800 | 190s |

---

## Player colors

Up to 8 player colors (matching AoE2):

| Player | Color |
|--------|-------|
| 1 | Blue `#0055FF` |
| 2 | Red `#FF0000` |
| 3 | Green `#00AA00` |
| 4 | Yellow `#FFDD00` |
| 5 | Teal `#00AAAA` |
| 6 | Purple `#AA00AA` |
| 7 | Grey `#888888` |
| 8 | Orange `#FF6600` |
| 0 | Gaia `#FFFFFF` |

---

## Integration with Game.ts

`Game.ts` creates `PlayerManager` and passes `Player` objects to all systems that need them:

```typescript
// In Game.ts init():
this.playerManager = new PlayerManager();
this.playerManager.add(new Player(1, 'britons', { food: 200, wood: 200, gold: 0, stone: 0 }));
this.playerManager.add(new Player(2, 'franks', { food: 200, wood: 200, gold: 0, stone: 0 })); // AI

// Systems that read player state:
// - BuildingManager: checks canAfford() on train, deducts cost
// - GatherSystem: calls player.add() on resource drop-off
// - CombatSystem: reads playerId to determine enemy/ally
// - WinConditionSystem: reads player population, buildings
```

---

## HUD resource display

Currently `Game.ts` passes resource counts directly to `Renderer`. After this plan:
- Pass `Player` objects to `UIRenderer`
- Display `player.resources` in HUD bar
- Pop counter shows `player.population / player.popCap`
- Pop counter turns red when `population >= popCap`
- Age badge shows current age icon (Dark/Feudal/Castle/Imperial)

---

## Files to create/modify

| File | Action |
|------|--------|
| `src/engine/player/Player.ts` | Create |
| `src/engine/player/PlayerManager.ts` | Create |
| `src/types/resource.ts` | Add `ResourceCounts` interface (move from wherever it is) |
| `src/engine/Game.ts` | Create PlayerManager, pass Player to all systems |
| `src/engine/renderer/UIRenderer.ts` | Accept Player instead of raw resource counts |
| `src/engine/EventBus.ts` | Add `player:aged_up`, `player:eliminated` events |
