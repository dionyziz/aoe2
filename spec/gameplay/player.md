# Player

## Player state

```typescript
class Player {
  readonly id: number;          // 0=Gaia, 1=human, 2+= AI/remote
  readonly civId: string;
  name: string;
  color: string;                // CSS color for unit/building tint

  // Resources
  resources: ResourceCounts;    // { food, wood, gold, stone }

  // Population
  population: number;           // currently alive units (not queued)
  popCap: number;               // recalculated from buildings

  // Age
  currentAge: UnitAge;          // 'dark' | 'feudal' | 'castle' | 'imperial'
  isAgingUp: boolean;
  ageUpProgress: number;        // 0..1

  // Technology
  researchedTechs: Set<string>;
  statOverrides: Map<string, Partial<UnitDef>>; // unit id → stat deltas from research
}
```

---

## Resource counts

```typescript
interface ResourceCounts {
  food: number;
  wood: number;
  gold: number;
  stone: number;
}
```

All resource values are non-negative floats. The UI displays them as integers (floor).

---

## Starting resources

| Setting | Food | Wood | Gold | Stone |
|---------|------|------|------|-------|
| Standard | 200 | 200 | 0 | 0 |
| Medium | 500 | 500 | 500 | 0 |
| High | 1000 | 1000 | 1000 | 0 |
| Infinite | 99999 | 99999 | 99999 | 99999 |

---

## Player colors

| Player | Color | Hex |
|--------|-------|-----|
| 0 (Gaia) | White | `#FFFFFF` |
| 1 | Blue | `#0055FF` |
| 2 | Red | `#FF0000` |
| 3 | Green | `#00AA00` |
| 4 | Yellow | `#FFDD00` |
| 5 | Teal | `#00AAAA` |
| 6 | Purple | `#AA00AA` |
| 7 | Grey | `#888888` |
| 8 | Orange | `#FF6600` |

---

## Population cap

`player.popCap` = sum of `BuildingDef.providesPopulation` for all **completed** buildings owned by the player.

Hard maximum: 200 (regardless of building count).

| Building | Pop provided |
|----------|-------------|
| Town Center | 5 |
| House | 5 |
| Castle | 10 |

`player.hasPopRoom()` returns `true` when `population + 1 <= popCap`.
Units cannot be trained when `!player.hasPopRoom()`. The train button is disabled and the HUD pop counter turns red.

Population increases when a unit finishes training (not when queued).
Population decreases when a unit dies.

---

## Age advancement

Ages: Dark → Feudal → Castle → Imperial.

Age-up is a special research performed at the Town Center:

| To Age | Cost | Time |
|--------|------|------|
| Feudal Age | 500 food | 130s |
| Castle Age | 800 food, 200 gold | 160s |
| Imperial Age | 1000 food, 800 gold | 190s |

Age-up procedure:
1. Player clicks "Advance to [Age]" button in TC selection panel
2. `player.canAfford(cost)` checked; resources deducted
3. TC enters `isAgingUp = true`; construction progress bar shown
4. During age-up, TC cannot train units
5. On completion: `player.currentAge` advances; `emit('player:aged_up')`
6. UI: banner "The [CivName] have advanced to the [Age] Age!"
7. New buildings unlocked in build menu; new technologies appear in building panels

Age requirements for buildings and units are enforced:
- Build menu buttons are greyed out if the required age hasn't been reached
- Training buttons are hidden/disabled for units requiring a higher age

---

## Resource helpers

```typescript
canAfford(cost: Partial<ResourceCounts>): boolean
deduct(cost: Partial<ResourceCounts>): void  // asserts canAfford first
add(type: keyof ResourceCounts, amount: number): void
```

---

## Diplomacy

Each player pair has a `DiplomacyState`:

```typescript
type DiplomacyState = 'ally' | 'neutral' | 'enemy';
```

Default: all players are `'enemy'` to each other.
Players on the same team start as `'ally'`.

Allies:
- Share line of sight (fog of war)
- Cannot be attacked with standard attack orders (must use attack-ground or explicit command)
- Win together on allied victory condition

---

## PlayerManager

```typescript
class PlayerManager {
  add(player: Player): void
  get(id: number): Player | undefined
  getAll(): Player[]
  getDiplomacy(a: number, b: number): DiplomacyState
  setDiplomacy(a: number, b: number, state: DiplomacyState): void
  recalcAllPopCaps(buildings: BuildingInstance[]): void
}
```

`recalcAllPopCaps` is called after any building is placed or destroyed.
