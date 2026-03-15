# Plan 09 — Sprites & Animations

**Status:** ⏳ Blocked (need AoE2 game files)
**Depends on:** 08 (buildings rendered), 07 (unit classes)

---

## AoE2 sprite format

AoE2 stores graphics in SLP files packed inside DRS archives:
- `graphics.drs` — units, buildings, terrain overlays
- `terrain.drs` — base terrain tiles
- `interfac.drs` — UI elements (buttons, panels, icons)

Each SLP contains one animation, split into up to 8 directions (S, SW, W, NW, N, NE, E, SE).
Each frame has a per-pixel command list (not raw pixels) and a hotspot (anchor point).

### openage extraction pipeline

```
AoE2DE install dir
  └─ resources/_common/drs/graphics/
       ├── graphics.drs
       ├── terrain.drs
       └── interfac.drs
         ↓
openage-convert --game-dir <path> --output-dir ./extracted
         ↓
extracted/
  ├── age2_x1/
  │   ├── graphics/          ← PNG per SLP frame + CSV metadata
  │   ├── terrain/
  │   └── interface/
```

Command to run once game files are available:
```bash
python3 -m openage convert \
  --game-dir "$HOME/Library/Application Support/Steam/steamapps/common/AoE2DE" \
  --output-dir /Users/dionyziz/workspace/aoe-web/public/assets/extracted
```

---

## Our texture atlas format

After extraction we run a packer script (`scripts/pack-atlas.ts`) that:
1. Reads openage PNG + metadata per unit animation
2. Stitches frames into a single sprite sheet PNG
3. Emits `units.json` / `terrain.json` / `buildings.json` in our atlas format:

```json
{
  "frames": {
    "militia_walk_s_0": {
      "frame": { "x": 0, "y": 0, "w": 72, "h": 80 },
      "anchor": { "x": 36, "y": 70 }
    }
  },
  "animations": {
    "militia_walk": {
      "directions": 8,
      "fps": 15,
      "loop": true,
      "frameCount": 10,
      "frameKeys": [
        ["militia_walk_s_0", ..., "militia_walk_s_9"],
        ["militia_walk_sw_0", ...],
        ...8 directions...
      ]
    }
  }
}
```

Direction order: S=0, SW=1, W=2, NW=3, N=4, NE=5, E=6, SE=7
(matches `unit.direction` field in `UnitInstance`)

---

## Animation state machine

Each unit class has these animations:

| State | Infantry | Archer | Cavalry | Villager | Siege | Monk |
|-------|----------|--------|---------|----------|-------|------|
| Idle | stand (8 dir) | stand | stand | stand | stand | stand |
| Moving | walk (8 dir) | walk | walk | walk | move | walk |
| Attacking | attack (8 dir) | attack | attack | attack | fire | convert |
| Dying | die (8 dir) | die | die | die | die | die |
| Dead | dead_frame | dead_frame | dead_frame | dead_frame | dead_frame | dead_frame |
| Gathering | — | — | — | gather_{wood,food,gold,stone} | — | — |
| Building | — | — | — | build | — | — |

### Direction from velocity

```
dx = targetX - unitX
dy = targetY - unitY
angle = atan2(dy, dx)   // -π to π, 0 = east
// Map to 8 directions (0=S clockwise):
dirIndex = round(angle / (π/4) + 2) mod 8
```

### AnimationSystem.ts (update)

```typescript
update(unit: UnitInstance, dt: number): void {
  const anim = getAnimForState(unit.defId, unit.state, unit.gatherType);
  if (!anim) return;
  unit.animTimer += dt;
  const frameDur = 1000 / anim.fps;
  while (unit.animTimer >= frameDur) {
    unit.animTimer -= frameDur;
    unit.animFrame++;
    if (unit.animFrame >= anim.frameCount) {
      unit.animFrame = anim.loop ? 0 : anim.frameCount - 1;
      if (!anim.loop) unit.animDone = true;
    }
  }
}
```

---

## SpriteSheet.drawUnit()

```typescript
drawUnit(ctx, unit, camera, spriteSheet) {
  const anim = getAnim(unit.defId, unit.state);
  if (!anim) { drawFallback(ctx, unit); return; }
  const frameKey = anim.frameKeys[unit.direction][unit.animFrame];
  const screen = iso.worldToScreen(unit.pos.wx, unit.pos.wy, elevation, camera);
  spriteSheet.drawSprite(ctx, frameKey, screen.x, screen.y);
}
```

---

## Terrain tiles

AoE2 terrain tiles are 97×49px diamonds (in original res), doubled to 193×97 in HD/DE.
We scale to our TILE_WIDTH=64, TILE_HEIGHT=32.

Each terrain type has:
- Base tile (flat)
- Up to 6 transition/blend frames for edges between terrain types
- Animated tiles for water (cycled at ~4 fps)

Terrain rendering pipeline (after sprites available):
1. Replace `TerrainRenderer` color fills with `spriteSheet.drawSprite(ctx, 'terrain_grass_0', ...)`
2. Add blend layer: detect tile neighbours with different terrain, draw transition sprite on top
3. Water animation: increment frame counter at 4fps, use `terrain_water_{frame}`

---

## Building sprites

Buildings in AoE2 have:
- Construction frames (5 stages: 0%, 25%, 50%, 75%, 100%)
- Complete sprite (static, no animation except fire/smoke when damaged)
- Damaged overlay at <50% HP (fire/smoke particles)
- Foundation outline (1 tile = 1 frame)

---

## UI icons

`interfac.drs` contains:
- Unit portrait icons (50×50 px per unit)
- Building icons (50×50 px)
- Resource icons (food/wood/gold/stone)
- Button backgrounds (normal, hover, pressed, disabled)
- Age icons

These replace our current text-based action buttons.

---

## Scripts to write (when game files available)

- `scripts/extract-sprites.sh` — runs openage-convert
- `scripts/pack-atlas.ts` — stitches PNGs into atlas sheets
- `scripts/pack-terrain.ts` — packs terrain tiles + transitions
- `scripts/pack-icons.ts` — packs UI icons from interfac.drs

---

## Fallback rendering (current)

Until sprites are available, the game uses:
- Colored ellipses per unit class (V/I/A/C/S/N/M letter labels)
- Colored diamond tiles per terrain type
- Colored footprints for buildings

This is already fully functional for testing all gameplay logic.
