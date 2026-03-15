# AoE2 Web Clone — Claude Notes

## Project Overview
Age of Empires II: The Conquerors web clone built from scratch.

**Stack:** TypeScript + Vite, HTML5 Canvas 2D, no game framework

## Architecture

### Coordinate System
- `TILE_WIDTH = 64`, `TILE_HEIGHT = 32`
- World → Screen: `sx = (wx - wy) * 32 * zoom + offsetX`, `sy = (wx + wy) * 16 * zoom - elev * 16 * zoom + offsetY`
- Screen → World: inverse of above (see `IsoProjection.ts`)
- Painter's order sort key: `tx + ty`

### Key Entry Points
- `src/main.ts` — creates `Game`, mounts canvas
- `src/engine/Game.ts` — wires all subsystems
- `src/engine/GameLoop.ts` — fixed 20 Hz sim + variable render

### Game Loop
- Fixed timestep: `TICK_MS = 50ms` (20 Hz)
- Render: variable (rAF), passes `alpha = acc / TICK_MS` for lerp
- Pattern: accumulator; `update()` then `render(alpha)`

### Subsystems
| System | File | Notes |
|--------|------|-------|
| Isometric math | `engine/renderer/IsoProjection.ts` | All world↔screen conversion |
| Camera | `engine/camera/Camera.ts` | offsetX/Y, zoom (0.5–2.0), zoomAt |
| Camera input | `engine/camera/CameraController.ts` | WASD, edge scroll, MMB drag, wheel |
| Terrain render | `engine/renderer/TerrainRenderer.ts` | Painter order, elevation walls |
| Entity render | `engine/renderer/EntityRenderer.ts` | Units sorted by wx+wy |
| UI overlay | `engine/renderer/UIRenderer.ts` | FPS, drag rect, selection panel |
| Input | `engine/input/InputManager.ts` | DOM → EventBus |
| Units | `engine/units/UnitManager.ts` | Selection, orders, A* pathing |
| Pathfinding | `engine/pathfinding/AStar.ts` | 8-directional, octile heuristic |
| Nav grid | `engine/pathfinding/NavGrid.ts` | Uint8Array passability |
| Movement | `engine/units/MovementSystem.ts` | Per-frame pos integration |

### EventBus Events
- `input:leftClick` → unit selection
- `input:rightClick` → move/attack order
- `input:boxSelect` → drag-select
- `input:wheel` → camera zoom
- `input:middleDrag` → camera pan
- `input:keydown` → shortcuts (Ctrl+A = select all, Escape = deselect, WASD = pan)

### Map Format
- `MapData.createFlat(w, h)` generates a test map (no file needed)
- JSON maps in `public/assets/maps/`
- Terrain types: Grass=0, Dirt=1, Sand=2, Water=3, ShallowWater=4, Snow=5, Forest=6, Rock=7

## Development Phases

| # | Phase | Status |
|---|-------|--------|
| 0 | Scaffolding (Vite+TS, canvas, GameLoop, FPS) | ✅ Done |
| 1 | Terrain rendering (IsoProjection, colored diamonds, elevation) | ✅ Done |
| 2 | Camera (pan/zoom/edge-scroll, offscreen cache) | ✅ Done |
| 3 | Input + selection (click, drag-select, Ctrl+A) | ✅ Done |
| 4 | Movement + pathfinding (A*, NavGrid, MovementSystem) | ✅ Done |
| 5 | Sprites + animations (atlas loader, AnimationSystem) | Stub ready |
| 6 | HUD + minimap | Stub ready |
| 7 | Map loader + generator | Loader ready, generator TBD |
| 8 | Economy | Not started |
| 9 | Combat | Not started |
| 10 | Buildings | Not started |
| 11 | Tech tree + ages | Not started |
| 12 | AI opponent | Not started |
| 13 | Multiplayer (stretch) | Not started |

## Notes
- `enum` (not `const enum`) used throughout — Vite/esbuild doesn't support `const enum` across files
- `import.meta.env.DEV` used in logger (Vite-specific)
- Units are currently drawn as colored ellipses (fallback — no sprites loaded yet)
- Player 1 = blue, Player 2 = red
- Test map spawns 3 militia at (4.5, 4.5) for player 1, 1 militia at (27.5, 27.5) for player 2
