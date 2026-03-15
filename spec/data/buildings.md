# Building Data Reference

All 23 buildings. Guard Tower, Keep, and Bombard Tower are upgrades (built by researching at University), not directly placed — their `buildTime` and stone cost are 0.

**Columns:** HP | Size | Cost W/S (wood/stone) | Build Time | Min Age | Pop | Garrison | Trains

---

## Complete building table

| ID | Name | HP | Size | Cost W/S | Build Time | Age | Pop | Garrison | Trains |
|----|------|----|------|----------|------------|-----|-----|----------|--------|
| town_center | Town Center | 2400 | 4×4 | 275w/100s | 150s | Dark | 5 | 15 | Villager |
| house | House | 550 | 2×2 | 25w | 25s | Dark | 5 | 0 | — |
| barracks | Barracks | 1200 | 3×3 | 175w | 50s | Dark | 0 | 0 | Infantry line |
| mill | Mill | 1000 | 2×2 | 100w | 35s | Dark | 0 | 0 | — |
| lumber_camp | Lumber Camp | 1000 | 2×2 | 100w | 35s | Dark | 0 | 0 | — |
| mining_camp | Mining Camp | 1000 | 2×2 | 100w | 35s | Dark | 0 | 0 | — |
| farm | Farm | 1 | 2×2 | 60w | 15s | Dark | 0 | 0 | — |
| palisade_wall | Palisade Wall | 250 | 1×1 | 2w | 5s | Dark | 0 | 4 | — |
| dock | Dock | 1800 | 3×3 | 150w | 40s | Dark | 0 | 0 | All ships |
| archery_range | Archery Range | 1200 | 3×3 | 175w | 50s | Feudal | 0 | 0 | Archer line |
| stable | Stable | 1200 | 3×3 | 175w | 50s | Feudal | 0 | 0 | Cavalry line |
| blacksmith | Blacksmith | 2100 | 3×3 | 150w | 40s | Feudal | 0 | 0 | — |
| market | Market | 2100 | 3×3 | 175w | 60s | Feudal | 0 | 0 | Trade Cart |
| watch_tower | Watch Tower | 500 | 1×1 | 25w/100s | 80s | Feudal | 0 | 5 | — |
| stone_wall | Stone Wall | 1800 | 1×1 | 5s | 10s | Feudal | 0 | 0 | — |
| gate | Gate | 3000 | 1×4 | 30s | 70s | Feudal | 0 | 4 | — |
| siege_workshop | Siege Workshop | 1200 | 3×3 | 200w | 50s | Castle | 0 | 0 | Siege line |
| university | University | 2100 | 3×3 | 200w | 60s | Castle | 0 | 0 | — |
| monastery | Monastery | 2100 | 3×3 | 175w | 40s | Castle | 0 | 0 | Monk, Missionary |
| castle | Castle | 4800 | 4×4 | 650s | 200s | Castle | 10 | 20 | Unique, Trebuchet, Petard |
| guard_tower | Guard Tower | 1000 | 1×1 | — (upgrade) | — | Castle | 0 | 5 | — |
| keep | Keep | 2000 | 1×1 | — (upgrade) | — | Imperial | 0 | 5 | — |
| bombard_tower | Bombard Tower | 2000 | 1×1 | — (upgrade) | — | Imperial | 0 | 0 | — |
| wonder | Wonder | 4800 | 4×4 | 1000w/1000s | 900s | Imperial | 0 | 0 | — |

---

## Tower combat stats

| Building | Attack | Range | Attack Speed | LOS |
|----------|--------|-------|--------------|-----|
| Watch Tower | 5 | 6 | 1.0/s | 8 |
| Guard Tower | 6 | 8 | 1.0/s | 9 |
| Keep | 7 | 8 | 1.0/s | 10 |
| Bombard Tower | 40 | 9 | 0.2/s | 10 |
| Castle | 11 | 11 | ~1.0/s | 11 |
| Town Center | 5 | 6 | 1.0/s | 8 |

Towers auto-attack the nearest enemy unit within range. Buildings cannot move (no chase phase).

---

## Building line-of-sight

| Building | LOS |
|----------|-----|
| Town Center | 8 |
| Barracks / Stable / Archery Range / Siege Workshop | 6 |
| Market / Monastery / University / Blacksmith | 6 |
| Watch Tower | 8 |
| Guard Tower | 9 |
| Keep | 10 |
| Castle | 11 |
| All walls and gates | 3 |
| All economy buildings | 5 |

---

## BuildingDef TypeScript interface

```typescript
export interface BuildingDef {
  id: string;
  name: string;
  size: number;                // footprint: size × size tiles
  hp: number;
  buildTime: number;           // seconds
  cost: { food: number; wood: number; gold: number; stone: number };
  trainableUnitIds: string[];
  providesPopulation: number;  // 0 for most; 5 for House/TC; 10 for Castle
  garrisonCapacity: number;
  lineOfSight: number;
  minAge: UnitAge;
}

export interface BuildingInstance {
  id: number;
  defId: string;
  playerId: number;
  tx: number;                  // top-left tile x
  ty: number;                  // top-left tile y
  currentHp: number;
  constructionProgress: number; // 0..1 — building non-functional until >= 1
  selected: boolean;
  trainQueue: TrainQueueEntry[];
  garrisonedUnitIds: number[];
}

export interface TrainQueueEntry {
  unitDefId: string;
  progress: number;            // 0..1
}
```
