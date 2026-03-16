# Confirmed Working Features

This file is the regression contract. Every agent that modifies Game.ts, Renderer.ts,
InputManager.ts, UIRenderer.ts, UnitManager.ts, or any rendering/input subsystem MUST:
1. Read this file before starting
2. After completing, confirm each applicable feature is still present
3. Add new features to this list when they are implemented and verified

---

## Rendering

- [x] Isometric terrain tiles rendered in painter's order (diagonal back-to-front)
- [x] 8 terrain types with distinct colors (Grass, Dirt, Sand, Water, ShallowWater, Snow, Forest, Rock)
- [x] Elevated tiles rendered above lower tiles
- [x] Off-screen terrain cache (only redrawn on camera move/zoom)
- [x] Units rendered as colored ellipses at their world position (blue=player 1, red=player 2)
- [x] Selection ring (green ellipse) drawn beneath selected units
- [x] Buildings rendered as colored diamonds
- [x] FPS counter top-right
- [x] Resource placeholder bar at top of screen
- [x] Minimap (200×200, bottom-right) showing terrain colors and unit dots
- [x] Drag-select rubber-band box (dashed white rectangle drawn while dragging)

## Camera

- [x] WASD pan
- [x] Middle-mouse-button drag pan
- [x] Edge-scroll (mouse within 20px of canvas edge)
- [x] Scroll-wheel zoom centered on cursor
- [x] Zoom clamped to [0.5, 2.0]

## Input & Selection

- [x] Left-click selects unit under cursor (nearest within 20px)
- [x] Left-click on empty ground deselects all
- [x] Left-click + drag box-selects all units inside the rectangle
- [x] Ctrl+A selects all player 1 units
- [x] Escape clears selection
- [x] Right-click issues move order to selected units

## Movement & Pathfinding

- [x] Right-click move order runs A* from each unit's current tile to target tile
- [x] Multiple selected units spread into formation (spiral tile assignment)
- [x] Units move smoothly along path (sub-tile interpolation)
- [x] Unit direction updates based on movement vector (8 directions)
- [x] Unit transitions to Idle when path is complete
- [x] Units respect impassable tiles (Water)
