# Map Generation

## Algorithm overview

```
seed → seededRng()
  ↓
heightmap (value noise, 6-tile grid, bilinear interpolation + smoothstep)
moisturemap (second independent value noise pass)
  ↓
biome assignment per tile (height + moisture → terrain type)
elevation levels (height → 0/1/2)
  ↓
forest clusters (random center + radius 1–2, ~density*area/8 clusters)
gold/stone mines (random passable tiles, 2-tile edge margin)
player starts (nearest passable tile to each map corner)
```

---

## Seeded RNG

Linear congruential generator:

```typescript
function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}
```

Deterministic across platforms: same seed → same map on every client.

---

## Heightmap

Value noise on a coarse `6×6` grid of random heights, bilinearly interpolated over the full tile grid, then smoothed with `smoothstep(t) = 3t² - 2t³`.

This produces rolling hills without extreme frequency variation.

---

## Biome assignment

Given a tile's `height h` and `moisture m` (both 0..1):

| Condition | Terrain |
|-----------|---------|
| `h < waterLevel - 0.05` | Water (deep, impassable) |
| `h < waterLevel` | ShallowWater (impassable) |
| `h < waterLevel + 0.1` | Grass (if `m > 0.6`) or Sand |
| `h > 0.85` | Snow |
| otherwise | Grass (if `m > 0.55`) or Dirt |

Default `waterLevel = 0.25`.

---

## Elevation

Elevation levels derived from height:

| Condition | Elevation |
|-----------|-----------|
| `h > 0.75` | 2 (high ground) |
| `h > 0.60` | 1 (hill) |
| otherwise | 0 (flat) |

Elevated tiles are rendered with vertical wall faces on their south-east and south-west sides.

---

## Forest clusters

Each forest cluster:
- Random center `(cx, cy)` on a passable non-water tile
- Random radius `r` in range `[1, 2]`
- All passable tiles within radius `r` of center → Forest (impassable, wood resource)
- Number of clusters ≈ `forestDensity * mapWidth * mapHeight / 8`

---

## Resource mines

Gold mines and stone mines are placed on random passable tiles:
- Must not be within 2 tiles of map edges
- Must not overlap water, forest, or existing mines
- `numGoldMines` (default 4) and `numStoneMines` (default 4)

---

## Player starts

Each player's start position is the nearest passable tile to the corresponding map corner:
- Player 1: top-left corner `(0, 0)`
- Player 2: bottom-right corner `(width-1, height-1)`
- Player 3: top-right corner `(width-1, 0)`
- Player 4: bottom-left corner `(0, height-1)`

A Town Center is placed at the start position. The first 3 villagers are placed adjacent to it.

---

## Map generation options

```typescript
interface MapGenOptions {
  width: number;         // default 32
  height: number;        // default 32
  seed: number;          // random if 0
  waterLevel: number;    // default 0.25
  forestDensity: number; // default 0.15
  numGoldMines: number;  // default 4
  numStoneMines: number; // default 4
  playerCount: number;   // default 2
}
```

---

## Terrain types

```typescript
enum TerrainType {
  Grass       = 0,
  Dirt        = 1,
  Sand        = 2,
  Water       = 3,
  ShallowWater= 4,
  Snow        = 5,
  Forest      = 6,
  Rock        = 7,
}
```

Passability: Water and ShallowWater are impassable for land units. Forest tiles are impassable (act as walls). All others are passable.

---

## Map data structure

```typescript
interface TileData {
  terrain: TerrainType;
  elevation: number;    // 0, 1, or 2
  passable: boolean;
  resourceId: number | null;   // index into MapData.resources[]
  objectId: number | null;     // reserved for decorations
}

interface MapData {
  version: number;
  name: string;
  width: number;
  height: number;
  tiles: TileData[][];          // [ty][tx]
  resources: ResourceNode[];
  playerStarts: TileCoord[];
}
```

---

## Known limitations

- No guaranteed land connection between player starts (maps can generate islands)
- No animals (sheep/deer/boar) — needed for food gathering before farms
- No relics
- Larger maps (64×64+) require heap-based A* (current linear open list is O(n))
- No named map types (Arabia, Black Forest, Islands, etc.) — random only
- No terrain blending/transitions between adjacent terrain types
