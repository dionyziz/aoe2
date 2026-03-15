# Plan 02 — Camera

**Status:** ✅ Done

---

## State

```typescript
Camera {
  offsetX: number      // screen pixels from world origin to canvas left
  offsetY: number      // screen pixels from world origin to canvas top
  zoom: number         // 0.5 .. 2.0
  canvasWidth: number
  canvasHeight: number
}
```

## Pan

`camera.pan(dx, dy)` adds directly to offsetX/Y. To reveal tiles to the **north** (W key), `offsetY` must *increase* (tiles slide down on screen). Signs:
- W / ↑ / mouse-at-top-edge → `dy += speed`
- S / ↓ / mouse-at-bottom-edge → `dy -= speed`
- A / ← / mouse-at-left-edge → `dx += speed`
- D / → / mouse-at-right-edge → `dx -= speed`

No hard map clamp — camera can pan freely (fog of war provides soft visual boundary).

## Zoom

Zoom anchored to cursor position:
```
newOffsetX = screenX - (screenX - offsetX) * (newZoom / oldZoom)
newOffsetY = screenY - (screenY - offsetY) * (newZoom / oldZoom)
```
Range: 0.5 (zoomed out) to 2.0 (zoomed in). Scroll wheel: factor 0.9 (out) / 1.1 (in).

## Controls

| Input | Action |
|-------|--------|
| W/A/S/D or arrow keys | Pan |
| Scroll wheel | Zoom at cursor |
| Middle mouse drag | Pan |
| Mouse within 20px of edge | Edge scroll |
| H (when units selected) | Center on selection |

## Edge scroll

Only activates after the first `mousemove` event inside the canvas (`mouseInCanvas` flag). Prevents unwanted scroll on page load when mouse position defaults to (0,0).

## Files

```
src/engine/camera/Camera.ts
src/engine/camera/CameraController.ts
```
