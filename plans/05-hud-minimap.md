# Plan 05 — HUD & Minimap

**Status:** ✅ Done

---

## Layout

```
┌──────────────────────────────────────────────────────┐
│  🍖 200  🪵 200  💰 0  🪨 0  👥 3/10        [FPS]  │  ← HUD bar (36px)
│                                                      │
│              [game canvas]                           │
│                                                      │
│                                         [minimap]    │
│  [portrait] [unit info / train queue] [action btns]  │  ← panel (120px)
└──────────────────────────────────────────────────────┘
```

- **HUD bar**: top, 36px, dark background. Food/Wood/Gold/Stone/Pop with emoji icons.
- **Bottom panel**: 120px, full width.
- **Minimap**: 180×180px, positioned directly above the bottom panel (right side).
- **Action buttons**: 5×2 grid of 48×48px buttons, bottom-right of panel. Context-sensitive.
- **Selection display**: left portion of panel. Single unit → portrait + stats. Multi → icon grid.

## Minimap

- Terrain rendered to `OffscreenCanvas` and cached (dirty flag on map change)
- Unit dots: 2px radius, player color
- Viewport rectangle: white outline, clamped to map bounds and clipped to minimap area
- Click-to-pan: left-click on minimap calls `camera.centerOnTile()`

## Action buttons

Context rules:
| Selection | Buttons |
|-----------|---------|
| Villager (normal) | Stop, Build, Repair |
| Villager (build menu) | 10 building buttons + ← back |
| Military unit | Stop, Attack, Patrol, Hold Position |
| Building w/ trainable units | Train buttons (abbreviated names) |
| Building w/o trainable units | (empty) |

## Known issues / remaining work

- Action button keyboard shortcuts are shown but not yet handled by `KeyboardState`
- Tooltip on button hover not yet implemented
- Build menu has only one page — two-page layout is in Plan 08
- Train queue display is stubbed (Plan 08 completes this)
- Resource change animation (+N floaters) not yet implemented (Plan 09)

## Files

```
src/engine/ui/HUD.ts
src/engine/ui/Minimap.ts
src/engine/renderer/UIRenderer.ts
src/engine/renderer/Renderer.ts
```
