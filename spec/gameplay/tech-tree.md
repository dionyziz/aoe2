# Tech Tree & Ages

## Ages

| Age | Advance at | Cost | Time | Unlocks |
|-----|-----------|------|------|---------|
| Dark Age | (start) | — | — | TC, House, Barracks, Mill, Lumber Camp, Mining Camp, Dock, Farm, Palisade Wall |
| Feudal Age | Town Center | 500f | 130s | Blacksmith, Market, Archery Range, Stable, Watch Tower, Stone Wall, Gate |
| Castle Age | Town Center | 800f, 200g | 160s | Castle, University, Monastery, Siege Workshop, Guard Tower |
| Imperial Age | Town Center | 1000f, 800g | 190s | All remaining upgrades and researches |

Age advancement uses the same train-queue mechanism as unit production. While the TC is advancing ages, it cannot train villagers.

---

## TechDef interface

```typescript
interface TechDef {
  id: string;
  name: string;
  cost: Partial<ResourceCounts>;
  researchTime: number;         // seconds
  minAge: UnitAge;
  researchedAt: string;         // building id
  prerequisites?: string[];     // tech ids that must be researched first
  effect: TechEffect[];
  uniqueToCivId?: string;
  description: string;
}

type TechEffectType =
  | 'unit_stat'       // modify a stat on matching unit defs
  | 'unit_upgrade'    // replace one unit def with another (e.g. Militia → Man-at-Arms)
  | 'building_stat'
  | 'enable_unit'
  | 'enable_building'
  | 'age_up'
  | 'gather_rate'
  | 'carry_capacity';

interface TechEffect {
  type: TechEffectType;
  targetClass?: UnitClass;
  targetId?: string;            // specific unit or building id
  stat?: string;                // 'hp' | 'speed' | 'attackDamage' | 'armor.melee' | …
  value?: number;               // delta or multiplier
  relative?: boolean;           // if true, value is a multiplier (e.g. 0.20 = +20%)
  fromId?: string;              // for unit_upgrade
  toId?: string;
  resourceType?: ResourceType;  // for gather_rate
}
```

---

## Per-player stat overrides

Technologies and civ bonuses modify stats on a per-player basis — the shared `UnitDef` objects are never mutated. Each `Player` holds a `statOverrides` map:

```typescript
// In Player:
statOverrides: Map<string, Partial<UnitDef>> = new Map();
```

When a unit is created, its effective stats = base `UnitDef` values + player's stat override deltas.
When a technology is researched, `TechSystem.applyEffect()` updates `statOverrides` and also applies deltas to all currently-living unit instances.

---

## Technology tables

### Town Center

| Tech | Prereq | Cost | Effect |
|------|--------|------|--------|
| Loom | — | 50g | Villagers +1/+2 armor |
| Wheelbarrow | — | 175f, 50w | Villagers +5 carry capacity, +10% speed *(Feudal)* |
| Hand Cart | Wheelbarrow | 300f, 200w | Villagers +10 carry capacity, +10% speed *(Castle)* |
| Town Watch | — | 75f | All units/buildings +4 LOS *(Feudal)* |
| Town Patrol | Town Watch | 300f | All units/buildings +4 LOS *(Castle)* |

### Blacksmith (Feudal Age)

| Tech | Prereq | Cost | Effect |
|------|--------|------|--------|
| Forging | — | 150f | +1 melee attack (infantry, cavalry) |
| Iron Casting | Forging | 220f | +1 melee attack |
| Blast Furnace | Iron Casting | 275f, 225g | +2 melee attack |
| Fletching | — | 100f | +1 pierce attack + range (archers) |
| Bodkin Arrow | Fletching | 200f | +1 pierce attack + range |
| Bracer | Bodkin Arrow | 300g | +1 pierce attack + range |
| Scale Mail Armor | — | 100f | +1/+1 infantry armor |
| Chain Mail Armor | Scale Mail | 200f, 100g | +1/+1 infantry armor |
| Plate Mail Armor | Chain Mail | 300g | +1/+2 infantry armor |
| Scale Barding Armor | — | 150f | +1/+1 cavalry armor |
| Chain Barding Armor | Scale Barding | 250f, 250g | +1/+1 cavalry armor |
| Plate Barding Armor | Chain Barding | 350g | +1/+2 cavalry armor |
| Padded Archer Armor | — | 100f | +1/+1 archer armor |
| Leather Archer Armor | Padded | 150f, 150g | +1/+1 archer armor |
| Ring Archer Armor | Leather | 250g | +1/+2 archer armor |

### Dock (Dark Age)

| Tech | Prereq | Cost | Effect |
|------|--------|------|--------|
| Gillnets | — | 75w, 75g | Fishing ships +25% work rate *(Feudal)* |
| Careening | — | 100w, 75g | Ships +1 pierce armor, Transports +5 carry *(Castle)* |
| Dry Dock | Careening | 200w, 150g | Ships +15% speed *(Imperial)* |
| Shipwright | — | 1000w | Ships trained 80% faster *(Imperial)* |

### University (Castle Age)

| Tech | Cost | Effect |
|------|------|--------|
| Masonry | 175f, 50w | +3 building armor, +10% building HP |
| Architecture | 175f, 150w | +3 building armor, +10% HP, +10% build speed |
| Ballistics | 300g | Projectiles track moving targets |
| Chemistry | 300g | +1 pierce attack all ranged; enables Bombard Cannon/Tower |
| Siege Engineers | 250w, 200g | +1 range siege, +20% siege damage vs walls |
| Murder Holes | 200g | Towers/Castle attack directly adjacent (no blind spot) |
| Heated Shot | 350f, 100g | Towers +2 attack vs ships |
| Arrowslits | — | Towers/Castles can fire through own walls |
| Hoardings | 400f | Castle +3 range |
| Treadmill Crane | 300f, 200w | +20% construction speed (all buildings) |
| Guard Tower | 150g | Watch Tower → Guard Tower upgrade |
| Keep | Guard Tower | 75f, 350g | Guard Tower → Keep upgrade |
| Bombard Tower | Chemistry | 125w, 375g | Enables Bombard Tower |

### Mill (Dark/Feudal Age)

| Tech | Prereq | Cost | Effect |
|------|--------|------|--------|
| Horse Collar | — | 75f, 75w | +75 food per farm |
| Heavy Plow | Horse Collar | 125f, 125w | +125 food/farm, +1 carry capacity |
| Crop Rotation | Heavy Plow | 250f, 250g | +125 food/farm, +1 carry capacity |

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
| Banking | 300g | Enables trading; caravans generate more gold |
| Guilds | 150g | Market trading fee reduced |
| Caravan | 200f, 100g | +50% trade cart speed |

### Monastery (Castle Age)

| Tech | Cost | Effect |
|------|------|--------|
| Redemption | 475f, 475g | Monks can convert siege and buildings |
| Atonement | 325g | Monks can convert garrisoned units |
| Heresy | 1000g | Enemy garrisoned units die instead of converting |
| Sanctity | 120g | Monks +15 HP |
| Fervor | 140g | Monks +15% speed |
| Illumination | 120f, 300g | Monk recharge time reduced |
| Faith | 750f, 750g | Monks harder to reconvert |
| Theocracy | 200f, 300g | Only 1 monk must recharge after group conversion |
| Devotion | 70g | Monks +10% conversion speed |
| Herbal Medicine | 100g | Garrisoned units heal 5× faster |
| Block Printing | 200g | Monks +3 conversion range *(Imperial)* |

### Barracks (unit upgrades)

| Tech | Cost | Time | Effect |
|------|------|------|--------|
| Man-at-Arms | 100f, 40g | 40s | Militia → Man-at-Arms |
| Long Swordsman | 150f, 75g | 45s | Man-at-Arms → Long Swordsman |
| Two-Handed Swordsman | 175f, 225g | 75s | Long Swordsman → Two-Handed Swordsman |
| Champion | 450g | 100s | Two-Handed Swordsman → Champion |
| Pikeman | 300f | 45s | Spearman → Pikeman |
| Halberdier | 250f | 50s | Pikeman → Halberdier |
| Supplies | 150f | 35s | Infantry cost −15 food |
| Squires | 200f | 35s | Infantry +10% speed |
| Arson | 150f, 50g | 30s | Infantry +2 attack vs buildings |
| Gambesons | 200g | 25s | Infantry +1 pierce armor *(Castle)* |

### Archery Range (unit upgrades)

| Tech | Cost | Time | Effect |
|------|------|------|--------|
| Crossbowman | 125f, 75g | 35s | Archer → Crossbowman |
| Arbalester | 300f, 500g | 60s | Crossbowman → Arbalester |
| Elite Skirmisher | 200f | 35s | Skirmisher → Elite Skirmisher |
| Heavy Cavalry Archer | 300f, 250g | 45s | Cavalry Archer → Heavy Cavalry Archer |
| Parthian Tactics | 200f, 250g | 45s | Cavalry Archers +2/+2 armor |
| Thumb Ring | 300f, 250g | 45s | Archers instant reload; +15% accuracy |

### Stable (unit upgrades)

| Tech | Cost | Time | Effect |
|------|------|------|--------|
| Light Cavalry | 150f | 45s | Scout → Light Cavalry |
| Hussar | 400f | 40s | Light Cavalry → Hussar |
| Cavalier | 400f, 300g | 60s | Knight → Cavalier |
| Paladin | 1450f, 750g | 100s | Cavalier → Paladin |
| Heavy Camel | 150f, 75g | 45s | Camel → Heavy Camel |
| Bloodlines | 200f, 150g | 40s | All cavalry +20 HP |
| Husbandry | 150f | 40s | All cavalry +10% speed |

---

## Civilization bonuses

Civ bonuses are applied at game start (and again when the required age is reached) as zero-cost, instant `TechEffect[]` lists. They are implemented identically to technologies but pre-applied.

See [Civilization Data](../data/civilizations.md) for the full bonus list per civ.

---

## Tech tree screen

Triggered by `Y` key or clicking the tech tree icon (not yet implemented).

Full-screen overlay, organized by building (columns) and age (rows):
- Researched: bright, checkmark overlay
- Available (can afford): glowing border
- Available (can't afford): normal, clickable — tooltip shows cost
- Wrong age / prereq missing: greyed, padlock icon
- Civ-unavailable: absent or strikethrough
