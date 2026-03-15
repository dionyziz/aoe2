# Age of Empires II Web Clone — Full Specification

## Technology stack

- **Language:** TypeScript (strict mode, ES2022)
- **Build:** Vite
- **Rendering:** HTML5 Canvas 2D API — single canvas, no WebGL, no game framework
- **Entry:** `src/main.ts` → creates `Game`, mounts canvas
- **Simulation rate:** 20 Hz fixed timestep (`TICK_MS = 50ms`)
- **Render rate:** uncapped rAF, lerp-interpolated between ticks

---

## Directory layout

```
aoe-web/
├── src/
│   ├── main.ts
│   ├── constants.ts            TILE_WIDTH=64, TILE_HEIGHT=32, TICK_MS=50, …
│   ├── types/                  Shared TypeScript interfaces (no logic)
│   │   ├── common.ts           Vec2, Rect, TileCoord, WorldPos, Color
│   │   ├── map.ts              TileData, MapData, TerrainType, ResourceNode
│   │   ├── unit.ts             UnitDef, UnitInstance, UnitClass, UnitAge
│   │   ├── building.ts         BuildingDef, BuildingInstance
│   │   ├── tech.ts             TechDef, TechEffect
│   │   ├── resource.ts         ResourceType, ResourceCounts
│   │   └── settings.ts         GameSettings, AudioSettings
│   ├── engine/
│   │   ├── Game.ts             Top-level orchestrator
│   │   ├── GameLoop.ts         rAF + accumulator
│   │   ├── EventBus.ts         Typed pub/sub
│   │   ├── camera/             Camera, CameraController
│   │   ├── renderer/           Renderer, IsoProjection, TerrainRenderer, …
│   │   ├── input/              InputManager, MouseState, KeyboardState
│   │   ├── map/                MapData, MapGenerator, MapLoader, ElevationMap
│   │   ├── units/              Unit, UnitManager, UnitStateMachine, MovementSystem
│   │   ├── pathfinding/        AStar, NavGrid, PathCache
│   │   ├── buildings/          BuildingManager, BuildingPlacementSystem
│   │   ├── player/             Player, PlayerManager
│   │   ├── economy/            GatherSystem, FarmSystem
│   │   ├── combat/             CombatSystem, ProjectileSystem
│   │   ├── tech/               TechSystem
│   │   ├── fog/                FogOfWar, FogRenderer
│   │   ├── win/                WinConditionSystem, WonderSystem
│   │   ├── ai/                 AIController, …
│   │   ├── audio/              AudioSystem, AmbientSystem, MusicSystem
│   │   ├── commands/           CommandSystem, CommandTypes
│   │   └── ui/                 HUD, Minimap, SelectionPanel, Tooltip
│   ├── data/                   Static JSON-style TS modules (never mutated)
│   │   ├── units/index.ts      ALL_UNITS, UNIT_MAP
│   │   ├── buildings/index.ts  ALL_BUILDINGS, BUILDING_MAP
│   │   ├── civilizations/index.ts  ALL_CIVS, CIV_MAP
│   │   └── techs/index.ts      ALL_TECHS, TECH_MAP
│   └── utils/
│       ├── math.ts             clamp, lerp, distance, Vec2 ops
│       ├── pool.ts             Object pool
│       └── logger.ts           Dev logging
├── public/assets/
│   ├── sprites/                PNG + JSON texture atlases
│   ├── sounds/                 OGG audio
│   └── maps/                   JSON map files
└── server/                     Node.js WebSocket server (multiplayer)
```

---

## Spec sections

### Engine
- [Coordinate System & Camera](engine/coordinate-system.md) — isometric math, world↔screen, camera
- [Game Loop & Rendering Pipeline](engine/game-loop.md) — fixed timestep, painter's order, FPS
- [Input System](engine/input.md) — event bus, click routing, selection rules
- [Pathfinding & Movement](engine/pathfinding.md) — A*, NavGrid, formation spreading

### Gameplay
- [Player](gameplay/player.md) — resources, population, age, civilization
- [Units](gameplay/units.md) — states, behaviors, animation
- [Buildings](gameplay/buildings.md) — placement, construction, train queue, garrison
- [Economy](gameplay/economy.md) — gathering, drop-off, farms, trade
- [Combat](gameplay/combat.md) — damage formula, projectiles, stances, death
- [Tech Tree & Ages](gameplay/tech-tree.md) — research, age advancement, civ bonuses
- [Fog of War](gameplay/fog-of-war.md) — visibility states, LOS, rendering
- [Map Generation](gameplay/map-generation.md) — terrain, biomes, spawns
- [Win Conditions](gameplay/win-conditions.md) — conquest, wonder, regicide, diplomacy

### UI
- [HUD & Panels](ui/hud.md) — resource bar, minimap, selection panel, action buttons
- [Menus](ui/menus.md) — main menu, game setup, pause, options

### Systems
- [AI Opponent](ai.md)
- [Audio](audio.md)
- [Multiplayer & Command System](multiplayer.md)

### Reference data
- [Unit Data](data/units.md) — all 146 units with stats
- [Building Data](data/buildings.md) — all 23 buildings with stats
- [Technology Data](data/technologies.md) — all ~120 technologies
- [Civilization Data](data/civilizations.md) — all 39 civilizations

---

## Core constants

| Constant | Value | Meaning |
|----------|-------|---------|
| `TILE_WIDTH` | 64 | Diamond width in pixels at zoom=1 |
| `TILE_HEIGHT` | 32 | Diamond height in pixels at zoom=1 (= TILE_WIDTH/2) |
| `TICK_MS` | 50 | Simulation tick interval (20 Hz) |
| `MIN_ZOOM` | 0.5 | Minimum camera zoom |
| `MAX_ZOOM` | 2.0 | Maximum camera zoom |
| `CAMERA_PAN_SPEED` | 8 | Pixels per frame at zoom=1 |
| `EDGE_SCROLL_THRESHOLD` | 20 | Pixels from edge to trigger edge scroll |
| `UNIT_SPEED` | 0.003 | Default tiles/ms (overridden by UnitDef.speed) |
| `MAX_POPULATION` | 200 | Hard cap for all civs |
| `GAIA_PLAYER_ID` | 0 | Neutral player (forests, mines, animals) |
| `LOCAL_PLAYER_ID` | 1 | Human player |

---

## Key principles

- **Data vs state:** `UnitDef`, `BuildingDef`, `TechDef` are static and never mutated. `UnitInstance`, `BuildingInstance` are per-game mutable state.
- **Player ownership:** Every entity has `playerId`. `0` = Gaia (neutral), `1` = human, `2+` = AI/remote.
- **CommandSystem:** All game-mutating actions go through `CommandSystem.submit()`. In single-player, commands execute immediately. In multiplayer, they are buffered, sent to server, and executed on turn arrival. This keeps multiplayer viable without restructuring the simulation.
- **Determinism:** No `Math.random()` in simulation (seeded RNG only). No `Date.now()` in game logic. Only `dt` from GameLoop flows into updates.
- **Rendering:** All drawing happens in the render path. Simulation never touches the canvas.
