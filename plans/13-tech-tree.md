# Plan 13 — Tech Tree & Ages

**Status:** 📋 Planned
**Depends on:** 09 (Player System), 11 (Combat — unit stats to modify), 10 (Economy — gather rates to modify)

---

## Overview

Technologies are researched at specific buildings and modify unit stats, enable new units/buildings,
or advance the player's age. Each civ has access to different subsets of the tech tree.

This plan covers:
1. `TechDef` data type + full tech list
2. `TechSystem` — research queue, effect application
3. Age advancement (reuses train-queue mechanism)
4. Civilization bonuses (applied at game start)
5. Tech tree UI screen

---

## Data model (`src/types/tech.ts`)

```typescript
export interface TechDef {
  id: string;
  name: string;
  cost: Partial<ResourceCounts>;
  researchTime: number;        // seconds
  minAge: UnitAge;
  researchedAt: string;        // building id ('blacksmith', 'university', etc.)
  prerequisites?: string[];    // tech ids that must be researched first
  effect: TechEffect[];
  uniqueToCivId?: string;      // civ-exclusive techs
  description: string;         // shown in tooltip
}

export type TechEffectType =
  | 'unit_stat'        // modify a numeric stat on units matching a filter
  | 'unit_upgrade'     // replace one unit def with another (e.g. Militia → Man-at-Arms)
  | 'building_stat'    // modify a building stat
  | 'enable_unit'      // add unit to a building's trainableUnitIds
  | 'enable_building'  // unlock a building type
  | 'age_up'           // advance player age (special case)
  | 'gather_rate'      // modify gather rate for a resource type
  | 'carry_capacity';  // modify carry capacity

export interface TechEffect {
  type: TechEffectType;
  // For unit_stat / building_stat:
  targetClass?: UnitClass;     // filter by class (null = all)
  targetId?: string;           // specific unit/building id (null = all matching class)
  stat?: string;               // 'hp' | 'speed' | 'attackDamage' | 'armor.melee' | etc.
  value?: number;              // absolute delta (or multiplier if relative=true)
  relative?: boolean;
  // For unit_upgrade:
  fromId?: string;
  toId?: string;
  // For enable_unit:
  unitId?: string;
  buildingId?: string;
  // For gather_rate:
  resourceType?: ResourceType;
}
```

---

## Technologies (partial list)

### Age advancements (Town Center)

| Tech | Cost | Time |
|------|------|------|
| Feudal Age | 500f | 130s |
| Castle Age | 800f, 200g | 160s |
| Imperial Age | 1000f, 800g | 190s |

### Blacksmith (unlocked Feudal Age)

Attack upgrades:
| Tech | Prereq | Cost | Effect |
|------|--------|------|--------|
| Forging | — | 150f | +1 melee attack (infantry, cavalry) |
| Iron Casting | Forging | 220f | +1 melee attack |
| Blast Furnace | Iron Casting | 275f, 225g | +2 melee attack |
| Fletching | — | 100f | +1 pierce attack, +1 range (archers) |
| Bodkin Arrow | Fletching | 200f | +1 pierce attack, +1 range |
| Bracer | Bodkin Arrow | 300g | +1 pierce attack, +1 range |

Armor upgrades:
| Tech | Prereq | Cost | Effect |
|------|--------|------|--------|
| Scale Mail Armor | — | 100f | +1/+1 infantry armor |
| Chain Mail Armor | Scale Mail | 200f, 100g | +1/+1 infantry armor |
| Plate Mail Armor | Chain Mail | 300g | +1/+2 infantry armor |
| Scale Barding Armor | — | 150f | +1/+1 cavalry armor |
| Chain Barding Armor | Scale Barding | 250f, 250g | +1/+1 cavalry armor |
| Plate Barding Armor | Chain Barding | 350g | +1/+2 cavalry armor |
| Padded Archer Armor | — | 100f | +1/+1 archer armor |
| Leather Archer Armor | Padded | 150f, 150g | +1/+1 archer armor |
| Ring Archer Armor | Leather | 250g | +1/+2 archer armor |

### University (Castle Age)

| Tech | Cost | Effect |
|------|------|--------|
| Masonry | 175f, 50w | +3 building armor, +10% building HP |
| Architecture | 175f, 150w | +3 building armor, +10% HP, +10% build speed |
| Ballistics | 300g | Arrows track moving targets |
| Chemistry | 300g | +1 pierce attack all ranged units; enables Bombard Cannon/Tower |
| Siege Engineers | 250w, 200g | +1 range siege units, +20% siege damage vs walls |
| Murder Holes | 200g | Towers/Castle attack directly below them (no minimum range) |
| Heated Shot | 350f, 100g | Towers +2 attack vs ships |
| Hoardings | 400f | Castle +3 range |
| Treadmill Crane | 300f, 200w | 20% faster construction speed |
| Guard Tower | — | 150g | Watch Tower → Guard Tower (upgrade) |
| Keep | Guard Tower | 75f, 350g | Guard Tower → Keep |
| Bombard Tower | Chemistry | 125w, 375g | Enables Bombard Tower |

Note: Guard Tower and Keep upgrades are at the **University**, not standalone buildings.

### Mill (economic)

| Tech | Prereq | Cost | Effect |
|------|--------|------|--------|
| Horse Collar | — | 75f, 75w | +75 food per farm |
| Heavy Plow | Horse Collar | 125f, 125w | +125 food, +1 carry capacity |
| Crop Rotation | Heavy Plow | 250f, 250g | +125 food, +1 carry capacity |
| Gillnets | — | 75w, 75g | +25% fishing rate |

### Lumber Camp

| Tech | Prereq | Cost | Effect |
|------|--------|------|--------|
| Double-Bit Axe | — | 100f, 50w | +20% wood gather rate |
| Bow Saw | Double-Bit Axe | 150f, 100w | +20% wood gather rate |
| Two-Man Saw | Bow Saw | 300w, 200g | +20% wood gather rate |

### Mining Camp

| Tech | Prereq | Cost | Effect |
|------|--------|------|--------|
| Gold Mining | — | 100f, 75w | +15% gold gather rate |
| Gold Shaft Mining | Gold Mining | 200f, 100g | +15% gold gather rate |
| Stone Mining | — | 100f, 75w | +15% stone gather rate |
| Stone Shaft Mining | Stone Mining | 200f, 100g | +15% stone gather rate |

### Market

| Tech | Cost | Effect |
|------|------|--------|
| Coinage | 150f, 50g | +15% gold from tributes |
| Banking | 300g | +15% gold from trading |
| Guilds | 150g | Enables market trading |
| Caravan | 200f, 100g | +50% trade cart speed |

### Monastery (Castle Age)

| Tech | Cost | Effect |
|------|------|--------|
| Redemption | 475f, 475g | Monks can convert enemy siege and buildings |
| Atonement | 325g | Monks can convert garrisoned units |
| Heresy | 1000g | Enemy garrisoned units die instead of converting |
| Sanctity | 120g | +15 monk HP |
| Fervor | 140g | +15% monk speed |
| Illumination | 120f, 300g | Monk recharge time reduced |
| Faith | 750f, 750g | Monks harder to reconvert |
| Theocracy | 200f, 300g | Only one monk needs to recharge after group conversion |

### Barracks (unit upgrades)

| Tech | Cost | Time | Effect |
|------|------|------|--------|
| Man-at-Arms | 100f, 40g | 40s | Militia → Man-at-Arms |
| Long Swordsman | 150f, 75g | 45s | Man-at-Arms → Long Swordsman |
| Two-Handed Swordsman | 175f, 225g | 75s | Long Swordsman → Two-Handed Swordsman |
| Champion | 0f, 450g | 100s | Two-Handed Swordsman → Champion |
| Pikeman | 300f | 45s | Spearman → Pikeman |
| Halberdier | 250f | 50s | Pikeman → Halberdier |
| Eagle Warrior | 200f, 100g | 40s | Eagle Scout → Eagle Warrior |
| Elite Eagle Warrior | 200f, 100g | 40s | Eagle Warrior → Elite Eagle Warrior |
| Supplies | 150f | 35s | Infantry costs -15 food |
| Squires | 200f | 35s | +10% infantry speed |
| Arson | 150f, 50g | 30s | Infantry +2 attack vs buildings |

### Archery Range (unit upgrades)

| Tech | Cost | Time | Effect |
|------|------|------|--------|
| Crossbowman | 125f, 75g | 35s | Archer → Crossbowman |
| Arbalest | 300f, 500g | 60s | Crossbowman → Arbalest |
| Elite Skirmisher | 200f | 35s | Skirmisher → Elite Skirmisher |
| Heavy Cavalry Archer | 300f, 250g | 45s | Cavalry Archer → Heavy Cavalry Archer |
| Parthian Tactics | 200f, 250g | 45s | +2/+2 cavalry archer armor |
| Thumb Ring | 300f, 250g | 45s | +instant reload, +15% accuracy |

### Stable (unit upgrades)

| Tech | Cost | Time | Effect |
|------|------|------|--------|
| Light Cavalry | 150f | 45s | Scout Cavalry → Light Cavalry |
| Hussar | 400f | 40s | Light Cavalry → Hussar |
| Cavalier | 400f, 300g | 60s | Knight → Cavalier |
| Paladin | 1450f, 750g | 100s | Cavalier → Paladin |
| Heavy Camel | 150f, 75g | 45s | Camel Rider → Heavy Camel Rider |
| Imperial Camel | 0f, 0g | 0s | Heavy Camel → Imperial Camel (Indians only) |
| Bloodlines | 200f, 150g | 40s | All cavalry +20 HP |
| Husbandry | 150f | 40s | All cavalry +10% speed |

---

## TechSystem (`src/engine/tech/TechSystem.ts`)

```typescript
export class TechSystem {
  applyEffect(effect: TechEffect, player: Player, unitManager: UnitManager): void {
    switch (effect.type) {
      case 'unit_stat':
        // Modify live UnitInstance stats AND the player's per-instance overrides
        // NB: base UnitDefs are immutable; we store per-player stat overrides
        for (const unit of unitManager.getByPlayer(player.id)) {
          const def = UNIT_MAP.get(unit.defId)!;
          if (!matchesFilter(def, effect)) continue;
          applyStat(unit, effect.stat!, effect.value!, effect.relative);
        }
        break;
      case 'unit_upgrade':
        // Replace defId on all existing instances
        for (const unit of unitManager.getByPlayer(player.id)) {
          if (unit.defId === effect.fromId) {
            unit.defId = effect.toId!;
            unit.currentHp = Math.min(unit.currentHp, UNIT_MAP.get(effect.toId!)!.hp);
          }
        }
        break;
      // ...
    }
  }
}
```

### Per-player stat overrides

Rather than mutating shared `UnitDef` objects, each player has a `statOverrides` map:

```typescript
// In Player:
statOverrides: Map<string, Partial<UnitDef>> = new Map();
// Key: unitDefId, Value: accumulated stat deltas
```

When a unit is created, its effective stats = base `UnitDef` + player's overrides for that defId.

---

## Civilization bonuses

Each civ's bonuses are implemented as a list of `TechEffect[]` applied at game start (before any
research). They behave identically to technologies but are free and instant.

Examples:
```typescript
// Britons:
[
  { type: 'unit_stat', targetClass: UnitClass.Archer, stat: 'cost.food', value: -0.20, relative: true, minAge: 'castle' },
  { type: 'building_stat', targetId: 'town_center', stat: 'cost.wood', value: -50 },
  { type: 'unit_stat', targetClass: UnitClass.Archer, stat: 'attackRange', value: 1, minAge: 'imperial' }
]

// Franks:
[
  { type: 'unit_stat', targetClass: UnitClass.Cavalry, stat: 'hp', value: 0.20, relative: true, minAge: 'castle' },
  { type: 'building_stat', targetId: 'farm', stat: 'cost.wood', value: -0.15, relative: true },
]
```

---

## Research in buildings

Buildings with research capabilities show research buttons in the selection panel (after train queue).
Research occupies the same queue slot as unit training (max 1 research per building at a time).

Research queue flow:
1. Player clicks research button → `BuildingManager.startResearch(buildingId, techId)`
2. Resources deducted immediately
3. Building shows progress bar (same arc as training)
4. On complete: `TechSystem.applyEffect()` called for each effect, emit `'tech:researched'`

---

## Age-up UI

```
1. Player clicks "Advance to Feudal Age" button in TC panel
2. Resources deducted (500 food)
3. TC becomes occupied (can't train villagers during age-up)
4. Progress bar fills over 130 seconds
5. On complete:
   - player.currentAge = 'feudal'
   - emit 'player:aged_up'
   - Screen flash effect + banner: "The Britons have advanced to the Feudal Age!"
   - New buildings unlocked in build menu (grey-out removed)
   - New techs visible in building panels
```

---

## Tech tree screen

Full-screen overlay showing the complete tech tree for the player's civ.
Triggered by pressing `Y` (matching AoE2 hotkey) or clicking the tech tree icon.

Layout:
- Grid of tech icons organized by building (columns) and age (rows)
- Researched: bright, checkmark
- Available (can afford): glowing border
- Available (can't afford): normal but clickable (shows cost tooltip)
- Unavailable (wrong age / prerequisite missing): greyed, padlock icon
- Civ-unavailable: strikethrough or missing entirely

Implemented as an overlay canvas drawn on top of the game.

---

## Files to create/modify

```
src/types/tech.ts               ← TechDef, TechEffect, TechEffectType
src/data/techs/index.ts         ← ALL_TECHS, TECH_MAP (~120 technologies)
src/engine/tech/TechSystem.ts   ← applyEffect(), research queue integration
src/engine/player/Player.ts     ← statOverrides map, researchedTechs
src/engine/renderer/UIRenderer.ts ← research buttons, tech tree overlay
src/engine/EventBus.ts          ← 'tech:researched', 'player:aged_up'
```

---

## Known limitations / future work

- Tech prerequisites not enforced in Phase 1 (add `prerequisites` array to TechDef later)
- Civ bonus application at game start may need to fire *after* Player is initialized
- Tech tree screen is a stretch — core gameplay works without it
- Civilizations that disable techs (e.g. Goths can't build castles in some contexts) need explicit exclusion lists per civ
