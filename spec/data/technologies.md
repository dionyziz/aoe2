# Technology Data Reference

All generic technologies and unit upgrades (available to one or more civs). Civ-unique technologies are omitted here. Full details are in [Tech Tree spec](../gameplay/tech-tree.md).

**Columns:** ID | Name | Building | Cost | Time | Min Age | Effect

---

## Age advancements (Town Center)

| ID | Name | Cost | Time |
|----|------|------|------|
| feudal_age | Feudal Age | 500f | 130s |
| castle_age | Castle Age | 800f, 200g | 160s |
| imperial_age | Imperial Age | 1000f, 800g | 190s |

---

## Town Center

| ID | Name | Prereq | Cost | Time | Age | Effect |
|----|------|--------|------|------|-----|--------|
| loom | Loom | — | 50g | 25s | Dark | Villagers +1/+2 armor |
| wheelbarrow | Wheelbarrow | — | 175f, 50w | 75s | Feudal | Villagers +5 carry capacity, +10% speed |
| hand_cart | Hand Cart | wheelbarrow | 300f, 200w | 55s | Castle | Villagers +10 carry capacity, +10% speed |
| town_watch | Town Watch | — | 75f | 25s | Feudal | All units/buildings +4 LOS |
| town_patrol | Town Patrol | town_watch | 300f | 40s | Castle | All units/buildings +4 LOS |

---

## Blacksmith

| ID | Name | Prereq | Cost | Time | Age | Effect |
|----|------|--------|------|------|-----|--------|
| forging | Forging | — | 150f | 50s | Feudal | Infantry/cavalry +1 melee attack |
| iron_casting | Iron Casting | forging | 220f | 75s | Castle | Infantry/cavalry +1 melee attack |
| blast_furnace | Blast Furnace | iron_casting | 275f, 225g | 100s | Imperial | Infantry/cavalry +2 melee attack |
| fletching | Fletching | — | 100f | 30s | Feudal | Archers +1 pierce attack, +1 range |
| bodkin_arrow | Bodkin Arrow | fletching | 200f | 35s | Castle | Archers +1 pierce attack, +1 range |
| bracer | Bracer | bodkin_arrow | 300g | 40s | Imperial | Archers +1 pierce attack, +1 range |
| scale_mail_armor | Scale Mail Armor | — | 100f | 40s | Feudal | Infantry +1/+1 armor |
| chain_mail_armor | Chain Mail Armor | scale_mail_armor | 200f, 100g | 55s | Castle | Infantry +1/+1 armor |
| plate_mail_armor | Plate Mail Armor | chain_mail_armor | 300g | 70s | Imperial | Infantry +1/+2 armor |
| scale_barding_armor | Scale Barding Armor | — | 150f | 45s | Feudal | Cavalry +1/+1 armor |
| chain_barding_armor | Chain Barding Armor | scale_barding_armor | 250f, 250g | 60s | Castle | Cavalry +1/+1 armor |
| plate_barding_armor | Plate Barding Armor | chain_barding_armor | 350g | 75s | Imperial | Cavalry +1/+2 armor |
| padded_archer_armor | Padded Archer Armor | — | 100f | 40s | Feudal | Archers +1/+1 armor |
| leather_archer_armor | Leather Archer Armor | padded_archer_armor | 150f, 150g | 55s | Castle | Archers +1/+1 armor |
| ring_archer_armor | Ring Archer Armor | leather_archer_armor | 250g | 70s | Imperial | Archers +1/+2 armor |

---

## Dock

| ID | Name | Prereq | Cost | Time | Age | Effect |
|----|------|--------|------|------|-----|--------|
| gillnets | Gillnets | — | 75w, 75g | 40s | Feudal | Fishing ships +25% work rate |
| careening | Careening | — | 100w, 75g | 60s | Castle | Ships +1 pierce armor, Transport Ships +5 carry |
| dry_dock | Dry Dock | careening | 200w, 150g | 60s | Imperial | Ships +15% speed |
| shipwright | Shipwright | — | 1000w | 60s | Imperial | Ships trained 80% faster |

---

## University (Castle Age)

| ID | Name | Prereq | Cost | Time | Effect |
|----|------|--------|------|------|--------|
| masonry | Masonry | — | 175f, 50w | 50s | Buildings +3 armor, +10% HP |
| architecture | Architecture | masonry | 175f, 150w | 70s | Buildings +3 armor, +10% HP, +10% build speed |
| ballistics | Ballistics | — | 300g | 60s | Projectiles track moving targets |
| chemistry | Chemistry | — | 300g | 75s | All ranged units +1 pierce attack; enables Bombard Cannon/Tower |
| siege_engineers | Siege Engineers | — | 250w, 200g | 45s | Siege +1 range, +20% damage vs walls |
| murder_holes | Murder Holes | — | 200g | 25s | Towers/Castle: no minimum attack range |
| heated_shot | Heated Shot | — | 350f, 100g | 35s | Towers +2 attack vs ships |
| hoardings | Hoardings | — | 400f | 35s | Castle +3 range |
| treadmill_crane | Treadmill Crane | — | 300f, 200w | 40s | All buildings +20% construction speed |
| arrowslits | Arrowslits | — | 0 | 15s | Towers/Castles can fire through own walls |
| guard_tower | Guard Tower | — | 150g | 35s | Watch Tower → Guard Tower |
| keep | Keep | guard_tower | 75f, 350g | 75s | Guard Tower → Keep |
| bombard_tower | Bombard Tower | chemistry | 125w, 375g | 60s | Enables Bombard Tower |

---

## Mill

| ID | Name | Prereq | Cost | Time | Age | Effect |
|----|------|--------|------|------|-----|--------|
| horse_collar | Horse Collar | — | 75f, 75w | 20s | Dark | +75 food per farm |
| heavy_plow | Heavy Plow | horse_collar | 125f, 125w | 40s | Feudal | +125 food/farm, +1 carry cap |
| crop_rotation | Crop Rotation | heavy_plow | 250f, 250g | 70s | Castle | +125 food/farm, +1 carry cap |
---

## Lumber Camp

| ID | Name | Prereq | Cost | Time | Age | Effect |
|----|------|--------|------|------|-----|--------|
| double_bit_axe | Double-Bit Axe | — | 100f, 50w | 25s | Dark | +20% wood gather rate |
| bow_saw | Bow Saw | double_bit_axe | 150f, 100w | 50s | Feudal | +20% wood gather rate |
| two_man_saw | Two-Man Saw | bow_saw | 300w, 200g | 100s | Imperial | +20% wood gather rate |

---

## Mining Camp

| ID | Name | Prereq | Cost | Time | Age | Effect |
|----|------|--------|------|------|-----|--------|
| gold_mining | Gold Mining | — | 100f, 75w | 30s | Dark | +15% gold gather rate |
| gold_shaft_mining | Gold Shaft Mining | gold_mining | 200f, 100g | 75s | Castle | +15% gold gather rate |
| stone_mining | Stone Mining | — | 100f, 75w | 30s | Dark | +15% stone gather rate |
| stone_shaft_mining | Stone Shaft Mining | stone_mining | 200f, 100g | 75s | Castle | +15% stone gather rate |

---

## Market

| ID | Name | Cost | Time | Age | Effect |
|----|------|------|------|-----|--------|
| coinage | Coinage | 150f, 50g | 30s | Feudal | +15% gold from tributes |
| banking | Banking | 300g | 50s | Castle | Enables trading; +gold per trip |
| guilds | Guilds | 150g | 40s | Imperial | Market trading fee reduced |
| caravan | Caravan | 200f, 100g | 40s | Castle | Trade carts +50% speed |

---

## Monastery (Castle Age)

| ID | Name | Cost | Time | Effect |
|----|------|------|------|--------|
| redemption | Redemption | 475f, 475g | 50s | Monks convert siege + buildings |
| atonement | Atonement | 325g | 40s | Monks convert garrisoned units |
| heresy | Heresy | 1000g | 60s | Enemy garrisoned units die on conversion |
| sanctity | Sanctity | 120g | 60s | Monks +15 HP |
| fervor | Fervor | 140g | 50s | Monks +15% speed |
| illumination | Illumination | 120f, 300g | 55s | Monks recharge faster |
| faith | Faith | 750f, 750g | 60s | Monks harder to reconvert |
| theocracy | Theocracy | 200f, 300g | 60s | Only 1 monk recharges after group conversion |
| devotion | Devotion | 70g | 40s | Monks +10% conversion speed |
| herbal_medicine | Herbal Medicine | 100g | 35s | Garrisoned units heal 5× faster |
| block_printing | Block Printing | 200g | 55s | Monks +3 conversion range *(Imperial Age)* |

---

## Barracks (unit upgrades)

| ID | Name | Cost | Time | Age | Effect |
|----|------|------|------|-----|--------|
| man_at_arms_upgrade | Man-at-Arms | 100f, 40g | 40s | Feudal | Militia → Man-at-Arms |
| long_swordsman_upgrade | Long Swordsman | 150f, 75g | 45s | Castle | Man-at-Arms → Long Swordsman |
| two_handed_swordsman_upgrade | Two-Handed Swordsman | 175f, 225g | 75s | Imperial | Long Swordsman → Two-Handed Swordsman |
| champion_upgrade | Champion | 450g | 100s | Imperial | Two-Handed Swordsman → Champion |
| pikeman_upgrade | Pikeman | 300f | 45s | Feudal | Spearman → Pikeman |
| halberdier_upgrade | Halberdier | 250f | 50s | Imperial | Pikeman → Halberdier |
| eagle_warrior_upgrade | Eagle Warrior | 200f, 100g | 40s | Castle | Eagle Scout → Eagle Warrior |
| elite_eagle_warrior_upgrade | Elite Eagle Warrior | 200f, 100g | 40s | Imperial | Eagle Warrior → Elite Eagle Warrior |
| supplies | Supplies | 150f | 35s | Feudal | Infantry cost −15 food |
| squires | Squires | 200f | 35s | Castle | Infantry +10% speed |
| arson | Arson | 150f, 50g | 30s | Castle | Infantry +2 attack vs buildings |
| gambesons | Gambesons | 200g | 25s | Castle | Infantry +1 pierce armor |

---

## Archery Range (unit upgrades)

| ID | Name | Cost | Time | Age | Effect |
|----|------|------|------|-----|--------|
| crossbowman_upgrade | Crossbowman | 125f, 75g | 35s | Castle | Archer → Crossbowman |
| arbalester_upgrade | Arbalester | 300f, 500g | 60s | Imperial | Crossbowman → Arbalester |
| elite_skirmisher_upgrade | Elite Skirmisher | 200f | 35s | Feudal | Skirmisher → Elite Skirmisher |
| heavy_cav_archer_upgrade | Heavy Cavalry Archer | 300f, 250g | 45s | Imperial | Cavalry Archer → Heavy Cavalry Archer |
| parthian_tactics | Parthian Tactics | 200f, 250g | 45s | Imperial | Cavalry Archers +2/+2 armor |
| thumb_ring | Thumb Ring | 300f, 250g | 45s | Castle | Archers instant reload, +15% accuracy |

---

## Stable (unit upgrades)

| ID | Name | Cost | Time | Age | Effect |
|----|------|------|------|-----|--------|
| light_cavalry_upgrade | Light Cavalry | 150f | 45s | Feudal | Scout → Light Cavalry |
| hussar_upgrade | Hussar | 400f | 40s | Imperial | Light Cavalry → Hussar |
| cavalier_upgrade | Cavalier | 400f, 300g | 60s | Castle | Knight → Cavalier |
| paladin_upgrade | Paladin | 1450f, 750g | 100s | Imperial | Cavalier → Paladin |
| heavy_camel_upgrade | Heavy Camel | 150f, 75g | 45s | Castle | Camel → Heavy Camel |
| bloodlines | Bloodlines | 200f, 150g | 40s | Feudal | All cavalry +20 HP |
| husbandry | Husbandry | 150f | 40s | Feudal | All cavalry +10% speed |

---

## Castle (unique unit upgrades)

Each civ with a unique unit has an "Elite [Unit]" upgrade available at the Castle in Castle or Imperial Age. Cost and stats vary by unit; full details are in each unit's `upgradesTo` field in [Unit Data](units.md).

| Generic pattern | Cost | Age |
|----------------|------|-----|
| Elite [Unique Unit] | ~500–1200 resources (varies) | Castle or Imperial |
| Hoardings | 400f | Imperial |
| Conscription | 150g | Castle — units train 33% faster |
| Spies / Treason | Varies | Imperial |
