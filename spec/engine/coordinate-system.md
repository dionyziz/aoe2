# Coordinate System & Camera

## Constants

```
TILE_WIDTH  = 64   // diamond width east-west, pixels at zoom=1
TILE_HEIGHT = 32   // diamond height north-south, pixels at zoom=1 (= TILE_WIDTH/2)
```

---

## Coordinate spaces

| Space | Description |
|-------|-------------|
| **World** `(wx, wy)` | Continuous float tile coordinates. `(0,0)` = top-left corner. `wx` increases east, `wy` increases south. |
| **Tile** `(tx, ty)` | Integer part of world coords. `tx = Math.floor(wx)`, `ty = Math.floor(wy)`. |
| **Screen** `(sx, sy)` | Canvas pixels. `(0,0)` = canvas top-left. Incorporates camera offset and zoom. |

---

## World → Screen

```
sx = (wx - wy) * (TILE_WIDTH/2)  * zoom + camera.offsetX
sy = (wx + wy) * (TILE_HEIGHT/2) * zoom  - elevation * (TILE_HEIGHT/2) * zoom + camera.offsetY
```

`elevation` is 0, 1, or 2 (tile elevation levels). Higher elevation shifts the tile upward on screen.

---

## Screen → World

```
px = (sx - camera.offsetX) / zoom
py = (sy - camera.offsetY) / zoom

wx = (px / (TILE_WIDTH/2)  + py / (TILE_HEIGHT/2)) / 2
wy = (py / (TILE_HEIGHT/2) - px / (TILE_WIDTH/2))  / 2
```

Tile coordinate: `tx = Math.floor(wx)`, `ty = Math.floor(wy)`.

---

## Painter's algorithm sort key

Tiles and entities are drawn back-to-front (painter's order) along diagonals:

```
sort key = tx + ty
```

Within the same diagonal (equal `tx + ty`), lower `ty` (further north-east) is drawn first.

Full layer stack from bottom to top:
1. Terrain tiles
2. Terrain overlays (shoreline blending)
3. Resource nodes / decorations
4. Buildings (sorted by south-corner: `tx + size + ty + size`)
5. Units (sorted by `worldX + worldY`)
6. Projectiles
7. Selection rings / HP bars
8. Fog of war overlay
9. HUD / minimap (always on top, unsorted)

---

## Frustum culling

`visibleTileRange()` computes which tiles are on-screen:
1. Convert the 4 canvas corners to world coordinates (ignoring elevation)
2. Take min/max `wx` and `wy` across the 4 corners
3. Add a 2-tile margin on each side to handle tall elevated tiles
4. Clamp to map bounds `[0, mapWidth-1]` × `[0, mapHeight-1]`

Only tiles within this range are iterated for rendering.

---

## Camera state

```typescript
interface Camera {
  offsetX: number;      // screen pixels from world-origin to canvas left
  offsetY: number;      // screen pixels from world-origin to canvas top
  zoom: number;         // 0.5 .. 2.0
  canvasWidth: number;
  canvasHeight: number;
}
```

### Pan

`camera.pan(dx, dy)` adds directly to `offsetX/Y`.

Sign convention:
- W key (move north): `dy += speed`  — tiles slide down, revealing northern tiles
- S key (move south): `dy -= speed`
- A key (move west):  `dx += speed`
- D key (move east):  `dx -= speed`

Same signs apply to edge-scroll and MMB drag.

No hard clamping — camera can pan freely beyond map edges (fog of war provides visual boundary).

### Zoom

Zoom is anchored to a screen point `(sx, sy)`:

```
newOffsetX = sx - (sx - offsetX) * (newZoom / oldZoom)
newOffsetY = sy - (sy - offsetY) * (newZoom / oldZoom)
```

Zoom range: `0.5` (zoomed out) to `2.0` (zoomed in).
Scroll wheel: factor `0.9` (zoom out) or `1.1` (zoom in) per wheel event.

### Center on tile

`camera.centerOnTile(tx, ty)` sets `offsetX/Y` so tile `(tx, ty)` is at the canvas center.

---

## Camera controls

| Input | Action |
|-------|--------|
| W / ↑ | Pan north |
| S / ↓ | Pan south |
| A / ← | Pan west |
| D / → | Pan east |
| Scroll wheel | Zoom at cursor |
| Middle mouse drag | Pan |
| Mouse within 20px of canvas edge | Edge scroll (same as WASD) |
| H (with units selected) | Center on selection |

Edge scroll only activates after the first `mousemove` inside the canvas to prevent movement on page load when the cursor defaults to `(0,0)`.
