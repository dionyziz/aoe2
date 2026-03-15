# Plan 06 — Map Generator

**Status:** ✅ Done

---

## Algorithm

1. **Heightmap** — bilinear-interpolated value noise on a coarse 6-tile grid, smoothed with `smoothstep`
2. **Moisture map** — second independent value noise pass
3. **Biome assignment** from height + moisture:
   - `h < waterLevel-0.05` → Water (impassable)
   - `h < waterLevel` → ShallowWater (impassable)
   - `h < waterLevel+0.1` → Grass (moisture > 0.6) or Sand
   - `h > 0.85` → Snow
   - Otherwise → Grass (moisture > 0.55) or Dirt
4. **Elevation** — 0/1/2 levels derived from height (>0.6 → 1, >0.75 → 2)
5. **Forest clusters** — random center points, radius 1-2, ~density*mapArea/8 clusters
6. **Gold/stone mines** — placed on random passable tiles, 2 tile margin from edges
7. **Player starts** — nearest passable tile to each map corner

## Seeded RNG

`seededRng(seed)` uses a linear congruential generator:
```
s = (s * 1664525 + 1013904223) & 0xffffffff
return (s >>> 0) / 0xffffffff
```
Deterministic across platforms. Same seed → same map always.

## Options

```typescript
interface MapGenOptions {
  width: number;        // default 32
  height: number;       // default 32
  seed: number;         // random on each game load
  waterLevel: number;   // default 0.25
  forestDensity: number;// default 0.15
  numGoldMines: number; // default 4
  numStoneMines: number;// default 4
  playerCount: number;  // default 2
}
```

## Known limitations / future work

- No guaranteed land connection between player starts — can generate islands
- No animals (sheep/deer/boar) for food — needed for Phase 10
- No relics for Relic Victory (Phase 14)
- Larger maps (64×64, 128×128) need heap-based A* and NavGrid chunking
- Terrain blending/transitions not implemented (Phase 09 sprites)
- No named map types (Arabia, Black Forest, Islands, etc.) — just generic random

## Files

```
src/engine/map/MapGenerator.ts
src/engine/map/MapData.ts        ← static generate() calls MapGenerator
src/engine/map/MapLoader.ts      ← loads JSON map files from public/assets/maps/
src/engine/map/ElevationMap.ts
```
