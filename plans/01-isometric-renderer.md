# Plan 01 — Isometric Renderer

**Status:** ✅ Done

---

## Coordinate system

```
World → Screen:
  sx = (wx - wy) * (TILE_WIDTH/2)  * zoom + camera.offsetX
  sy = (wx + wy) * (TILE_HEIGHT/2) * zoom - elevation * (TILE_HEIGHT/2) * zoom + camera.offsetY

Screen → World:
  px = (sx - offsetX) / zoom
  py = (sy - offsetY) / zoom
  wx = (px/(TILE_WIDTH/2) + py/(TILE_HEIGHT/2)) / 2
  wy = (py/(TILE_HEIGHT/2) - px/(TILE_WIDTH/2)) / 2
```

- **Tile (0,0)** is top of the diamond. X increases east-southeast, Y increases west-southwest.
- **Sort key** for painter's order: `tx + ty`. Within a diagonal, lower `ty` renders first (north side appears behind south side).
- **Elevation** shifts tiles upward on screen by `elevation * TILE_HEIGHT/2 * zoom` pixels.

## Painter's algorithm

Terrain renders in diagonal strips to guarantee correct overdraw:
```
for d from minDiagonal to maxDiagonal:
  for ty from max(minTy, d-maxTx) to min(maxTy, d-minTx):
    tx = d - ty
    drawTile(tx, ty)
```

Entities (units, buildings) are sorted by `wx + wy` before drawing.

## Frustum culling

`IsoProjection.visibleTileRange()` transforms the 4 screen corners to world space and returns a clamped tile range. At typical zoom and map size this reduces ~4096 tiles to ~300.

## Elevation walls

Tiles with `elevation > 0` draw south-east and south-west wall faces below the top diamond, making terrain feel three-dimensional.

## Terrain colors (placeholder until sprites)

| Terrain | Fill | Border |
|---------|------|--------|
| Grass | #4a7c3f | #3a6230 |
| Dirt | #8B6914 | #6b5010 |
| Sand | #c2a24c | #9e8230 |
| Water | #1a4a8c | #103a6c |
| ShallowWater | #4a7abc | #3a6a9c |
| Snow | #dce8ef | #bcd8ef |
| Forest | #1e5c1e | #0e4c0e |
| Rock | #6b6b6b | #4b4b4b |

## Files

```
src/engine/renderer/IsoProjection.ts    ← all math, everything depends on this
src/engine/renderer/TerrainRenderer.ts  ← painter-order loop, tile drawing
src/engine/renderer/Renderer.ts         ← main canvas orchestrator
src/types/common.ts                     ← Vec2, Rect, TileCoord, WorldPos
src/types/map.ts                        ← TerrainType enum, TileData, MapData
```
