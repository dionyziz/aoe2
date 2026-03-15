# Plan 12 — Fog of War

**Status:** 📋 Planned
**Depends on:** 04 (units with LOS values), 07 (unit defs with lineOfSight), 08 (buildings with lineOfSight)

Note: FoW does NOT require Combat (Plan 11). It only needs units and buildings with `lineOfSight` values,
which are available from Plan 07 unit/building data. Combat is listed as a later plan but can be
implemented independently. Add `lineOfSight: number` to `BuildingDef` in `src/types/building.ts` before starting this plan.

---

## Three visibility states (per tile, per player)

| State | Meaning | Render |
|-------|---------|--------|
| Hidden | Never seen | Black (full fog) |
| Explored | Seen before, not currently visible | Dark shroud (~50% black overlay), terrain visible, no units |
| Visible | Currently in LOS of own unit/building | Full color, all entities shown |

---

## Data structure

```typescript
// src/engine/fog/FogOfWar.ts
class FogOfWar {
  // Two Uint8Arrays, one per player (index = ty * mapWidth + tx)
  // Values: 0=hidden, 1=explored, 2=visible
  private explored: Uint8Array;   // persists
  private visible: Uint8Array;    // recomputed each tick

  update(units: UnitInstance[], buildings: BuildingInstance[], mapData: MapData): void {
    // Reset visible to 0
    this.visible.fill(0);
    // For each own unit/building, cast LOS circle
    for (const unit of units) {
      if (unit.playerId !== LOCAL_PLAYER_ID) continue;
      this.revealCircle(unit.pos.wx, unit.pos.wy, UNIT_MAP.get(unit.defId)!.lineOfSight);
    }
    for (const building of buildings) {
      if (building.playerId !== LOCAL_PLAYER_ID) continue;
      const def = BUILDING_MAP.get(building.defId)!;
      const cx = building.tx + def.size / 2;
      const cy = building.ty + def.size / 2;
      this.revealCircle(cx, cy, def.lineOfSight);
    }
  }

  private revealCircle(cx: number, cy: number, radius: number): void {
    const r2 = radius * radius;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx*dx + dy*dy <= r2) {
          const tx = Math.floor(cx + dx);
          const ty = Math.floor(cy + dy);
          const idx = ty * this.width + tx;
          if (idx >= 0 && idx < this.visible.length) {
            this.visible[idx] = 2;
            this.explored[idx] = Math.max(this.explored[idx], 1);
          }
        }
      }
    }
  }

  getState(tx: number, ty: number): 0 | 1 | 2 {
    const idx = ty * this.width + tx;
    if (this.visible[idx] === 2) return 2;
    return this.explored[idx] as 0 | 1;
  }
}
```

---

## LOS values by building

| Building | LOS |
|----------|-----|
| Town Center | 8 |
| Barracks/Stable/etc | 6 |
| Watch Tower | 8 |
| Guard Tower | 9 |
| Keep | 10 |
| Castle | 11 |
| Outpost | 8 |

---

## Rendering the fog

### FogRenderer.ts (`src/engine/renderer/FogRenderer.ts`)

Two approaches — use approach A:

**A) Per-tile overlay (simpler, matches our tile renderer)**
After terrain + entities are drawn, iterate visible tiles and draw a black quad over Hidden tiles, semi-black over Explored:

```typescript
render(ctx: CanvasRenderingContext2D, fog: FogOfWar, camera: Camera): void {
  const range = this.iso.visibleTileRange(camera.canvasWidth, camera.canvasHeight, camera, mapW, mapH);
  for (let d = minD; d <= maxD; d++) {
    for tile in diagonal d:
      const state = fog.getState(tx, ty);
      if (state === 2) continue; // fully visible, skip
      const center = iso.worldToScreen(tx+0.5, ty+0.5, elev, camera);
      ctx.fillStyle = state === 0 ? '#000' : 'rgba(0,0,0,0.55)';
      // draw diamond shape
      drawDiamond(ctx, center, zoom);
  }
}
```

**B) Offscreen canvas with globalCompositeOperation** (better visual but more complex)
- Render fog to offscreen canvas as grayscale mask
- Blit with `destination-in` blend mode

Use A for now, upgrade to B with sprites.

---

## Entity visibility

- Enemy units/buildings in **Hidden** tiles: not drawn at all
- Enemy units/buildings in **Explored** tiles: not drawn (no ghost units in base AoE2, only in some mods)
- Own units always drawn regardless of fog
- Minimap: show explored terrain always, show enemy units only if in visible tiles

---

## Update frequency

FogOfWar.update() runs every simulation tick (20Hz).
LOS radius changes are applied immediately (e.g. tech upgrades).

---

## Performance

- `revealCircle` is O(r²) per unit — for 50 units at LOS 5 this is 50 * 100 = 5000 iterations/tick — very fast
- Avoid re-rendering fog offscreen cache every frame; only invalidate when `visible` array changes (compare hash or use dirty flag)

---

## Cheat code (for testing)

`Ctrl+Shift+F` toggles fog of war off/on (reveal all map).
In the debug console: `window.game.fog.revealAll()`.
