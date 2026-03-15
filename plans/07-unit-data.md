# Plan 07 — Unit Data

**Status:** ✅ Done

---

## Overview

Static game-data layer: all 146 unit definitions, 39 civilization definitions, and 23 building
definitions. None of this is mutable game state — it's the reference data the simulation reads.

---

## Unit definitions (`src/data/units/index.ts`)

146 `UnitDef` objects covering every trainable unit in AoE2: The Conquerors.

```typescript
export interface UnitDef {
  id: string;                  // e.g. 'militia', 'archer', 'knight'
  name: string;
  class: UnitClass;            // Infantry | Archer | Cavalry | Siege | Monk | Villager | Naval
  hp: number;
  speed: number;               // tiles/sec (converted to tiles/ms in MovementSystem)
  attackDamage: number;
  attackType: AttackType;      // 'melee' | 'ranged' | 'siege'
  attackRange: number;         // 0 for melee
  attackSpeed: number;         // attacks per second
  lineOfSight: number;         // tiles
  armor: { melee: number; pierce: number };
  cost: { food: number; wood: number; gold: number; stone: number };
  trainTime: number;           // seconds
  populationCost: number;      // default 1, some units cost 2
  minAge: UnitAge;             // 'dark' | 'feudal' | 'castle' | 'imperial'
  upgradesTo?: string;         // unit id of upgraded form
  uniqueToCivId?: string;      // civ id if this is a unique unit
}
```

### Unit classes by category

| Class | Examples |
|-------|---------|
| Villager | Villager (8 variants: male/female × 4 tasks) |
| Infantry | Militia, Man-at-Arms, Long Swordsman, Two-Handed Swordsman, Champion, Spearman, Pikeman, Halberdier, Eagle Scout, Eagle Warrior |
| Archer | Archer, Crossbowman, Arbalest, Skirmisher, Elite Skirmisher, Hand Cannoneer, Cavalry Archer, Heavy Cavalry Archer |
| Cavalry | Scout Cavalry, Light Cavalry, Hussar, Knight, Cavalier, Paladin, Camel Rider, Heavy Camel Rider, Battle Elephant |
| Siege | Battering Ram, Capped Ram, Siege Ram, Mangonel, Onager, Siege Onager, Scorpion, Heavy Scorpion, Ballista, Trebuchet, Bombard Cannon, Petard |
| Monk | Monk, Missionary |
| Ship | Fishing Ship, Trade Cog, Galley, War Galley, Galleon, Fire Galley, Fire Ship, Fast Fire Ship, Demolition Raft, Demolition Ship, Heavy Demolition Ship, Cannon Galleon, Elite Cannon Galleon, Longboat, Turtle Ship, Caravel |
| Unique | 39 civilization unique units |

### Attack type notes

- `melee`: applies `armor.melee` reduction
- `ranged`: applies `armor.pierce` reduction; unit fires projectile
- `siege`: applies siege armor reduction; wide AoE damage (Mangonel, Trebuchet)

---

## Civilization definitions (`src/data/civilizations/index.ts`)

39 `CivEntry` objects, one per AoE2: The Conquerors civilization.

```typescript
export interface CivEntry {
  id: string;            // e.g. 'britons', 'franks'
  name: string;
  uniqueUnitIds: string[]; // unit ids unique to this civ
  bonuses: string[];       // human-readable bonus descriptions (applied in Plan 13)
}
```

All 39 civs:
Aztecs, Berbers, Britons, Bulgarians, Burgundians, Burmese, Byzantines, Celts, Chinese,
Cumans, Ethiopians, Franks, Goths, Hindustanis, Huns, Incas, Indians, Italians, Japanese,
Khmer, Koreans, Lithuanians, Magyars, Malay, Malians, Mayans, Mongols, Persians, Portuguese,
Saracens, Sicilians, Slavs, Spanish, Tatars, Teutons, Turks, Vietnamese, Vikings, Cumans.

---

## Building definitions (`src/data/buildings/index.ts`)

23 `BuildingDef` objects.

```typescript
export interface BuildingDef {
  id: string;
  name: string;
  size: number;            // footprint in tiles (size × size)
  hp: number;
  buildTime: number;       // seconds to construct
  cost: { food: number; wood: number; gold: number; stone: number };
  trainableUnitIds: string[];   // units this building can train
  providesPopulation: number;   // 0 for most, 5 for House/TC, 10 for Castle
  garrisonCapacity: number;     // 0 for most, 15 for TC, 20 for Castle
  lineOfSight: number;
  minAge: UnitAge;
}
```

Full list:

| Building | Size | Pop | Trains |
|----------|------|-----|--------|
| Town Center | 4×4 | 5 | Villager |
| House | 2×2 | 5 | — |
| Farm | 3×3 | 0 | — |
| Mill | 2×2 | 0 | — |
| Lumber Camp | 2×2 | 0 | — |
| Mining Camp | 2×2 | 0 | — |
| Market | 4×4 | 0 | Trade Cart |
| Dock | 3×3 | 0 | all ships |
| Barracks | 4×4 | 0 | infantry line |
| Archery Range | 4×4 | 0 | archer line, cavalry archer |
| Stable | 4×4 | 0 | cavalry line |
| Siege Workshop | 4×4 | 0 | siege line |
| Blacksmith | 3×3 | 0 | — |
| University | 3×3 | 0 | — |
| Monastery | 3×3 | 0 | Monk, Missionary |
| Castle | 4×4 | 10 | unique unit, Trebuchet, Petard |
| Watch Tower | 1×1 | 0 | — |
| Guard Tower | 1×1 | 0 | — |
| Keep | 1×1 | 0 | — |
| Palisade Wall | 1×1 | 0 | — |
| Stone Wall | 1×1 | 0 | — |
| Gate | 1×4 | 0 | — |
| Wonder | 4×4 | 0 | — |

---

## Files

```
src/data/units/index.ts           ← ALL_UNITS, UNIT_MAP
src/data/civilizations/index.ts   ← ALL_CIVS, CIV_MAP
src/data/buildings/index.ts       ← ALL_BUILDINGS, BUILDING_MAP
src/types/unit.ts                 ← UnitDef, UnitInstance, UnitClass, UnitAge, AttackType
src/types/building.ts             ← BuildingDef, BuildingInstance
```

---

## Known gaps / future work

- `lineOfSight` field added to `BuildingDef` type but all values are placeholder (needed for Plan 12)
- `garrisonCapacity` added to type but not yet used in `BuildingManager` (Plan 11)
- Civ bonuses described in text only — actual stat modifiers are applied in Plan 13
- Attack bonuses per armor class (e.g. Spearman +15 vs cavalry) are simplified to flat `attackDamage` — full armor class system in Plan 11
- Naval units exist in data but no water traversal in NavGrid yet
