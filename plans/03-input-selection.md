# Plan 03 — Input & Selection

**Status:** ✅ Done

---

## Input pipeline

```
DOM Event → InputManager → EventBus → Subsystem handler
```

`InputManager` owns the canvas DOM listeners and translates raw events into typed EventBus emissions. No subsystem touches the DOM directly.

## Events emitted

| Event | Payload | Trigger |
|-------|---------|---------|
| `input:leftClick` | `{ pos: WorldPos, screenX, screenY }` | Mouse up (no drag) |
| `input:rightClick` | `{ pos: WorldPos, screenX, screenY }` | Right mouse up |
| `input:boxSelect` | `Rect` (screen coords) | Left drag > 5px threshold |
| `input:wheel` | `{ delta, screenX, screenY }` | Scroll |
| `input:middleDragStart/Drag/End` | `{ dx, dy }` | MMB drag |
| `input:mousemove` | `{ screenX, screenY }` | Every mouse move |
| `input:keydown` | `{ code, ctrl, shift, alt }` | Key down |
| `input:keyup` | `{ code }` | Key up |

## Selection rules (matching AoE2)

- **Left-click empty ground** → deselect all
- **Left-click unit** → select that unit only
- **Left-click with Shift** → add/remove unit from selection (not yet implemented)
- **Drag** → box select all units whose screen position is inside the drag rect
- **Ctrl+A** → select all own units visible on screen
- **Escape** → clear selection (or cancel placement / close build menu)
- **Right-click** → move/attack order for selected units (context-sensitive in Phase 11)
- **Double-click** → select all units of same type on screen (not yet implemented)

## Click routing (order of priority)

1. Bottom panel action buttons → `UIRenderer.handleClick()` → `handleActionClick()`
2. Building placement active → `placementSystem.tryPlace()`
3. Minimap click → `camera.centerOnTile()`
4. Building at tile → `buildingManager.selectAt()`
5. Unit under cursor → `unitManager` (own listener)
6. Empty ground → clear selection

`UnitManager` ignores clicks where `screenY >= canvasHeight - 120` (inside UI panel) to prevent clearing selection when clicking action buttons.

## Files

```
src/engine/input/InputManager.ts
src/engine/input/MouseState.ts
src/engine/input/KeyboardState.ts
src/engine/units/UnitManager.ts   ← selection handling
```
