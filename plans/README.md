# AoE2 Web Clone — Master Plan

## Status legend
- ✅ Done — implemented and working
- 🔄 In Progress — partially implemented
- 📋 Planned — design complete, not started
- ⏳ Blocked — waiting on external dependency
- 🔵 Stretch — post-MVP

---

## Phase map

```
[00 Scaffolding] ──→ [01 Iso Renderer] ──→ [02 Camera] ──→ [03 Input/Selection]
                                                                    │
                                                                    ↓
[07 Unit Data] ←── [06 Map Generator] ←── [05 HUD/Minimap] ←── [04 Pathfinding]
      │
      ↓
[08 Buildings] ──→ [09 Player System] ──→ [10 Economy] ──→ [11 Combat]
      │                                        │                  │
      ↓                                        ↓                  ↓
[12 Fog of War]                         [13 Tech Tree]     [14 Win Conditions]
                                               │
                                               ↓
                                        [15 AI Opponent]
                                               │
                                               ↓
                                        [16 Sound]
                                               │
                                               ↓
                                        [17 Game Setup]
                                               │
                                               ↓
                                        [18 Multiplayer] 🔵
```

---

## Plan index

| # | File | System | Status | Key output |
|---|------|--------|--------|------------|
| 00 | [00-scaffolding.md](00-scaffolding.md) | Vite+TS, canvas, GameLoop, FPS counter | ✅ Done | `Game`, `GameLoop`, `EventBus` |
| 01 | [01-isometric-renderer.md](01-isometric-renderer.md) | IsoProjection math, terrain tiles, painter sort, elevation | ✅ Done | `IsoProjection`, `TerrainRenderer` |
| 02 | [02-camera.md](02-camera.md) | Pan, zoom, edge scroll, WASD, MMB drag | ✅ Done | `Camera`, `CameraController` |
| 03 | [03-input-selection.md](03-input-selection.md) | Click, drag-select, box select, Ctrl+A | ✅ Done | `InputManager`, `UnitManager` selection |
| 04 | [04-pathfinding-movement.md](04-pathfinding-movement.md) | A*, NavGrid, formation spread, smooth walk | ✅ Done | `AStar`, `NavGrid`, `MovementSystem` |
| 05 | [05-hud-minimap.md](05-hud-minimap.md) | Resource bar, minimap, selection panel | ✅ Done | `HUD`, `Minimap`, `UIRenderer` |
| 06 | [06-map-generator.md](06-map-generator.md) | Value-noise terrain, elevation, resource placement | ✅ Done | `MapGenerator`, `MapData` |
| 07 | [07-unit-data.md](07-unit-data.md) | 146 unit defs, 39 civs, visual classes | ✅ Done | `ALL_UNITS`, `UNIT_MAP`, `ALL_CIVS` |
| 08 | [08-buildings.md](08-buildings.md) | Building defs, placement, selection, train queue, construction | 🔄 In Progress | `BuildingManager`, `BuildingPlacementSystem` |
| 09 | [09-player-system.md](09-player-system.md) | Player class, resources, pop cap, age, tech state | 📋 Planned | `Player`, `PlayerManager` |
| 10 | [10-economy.md](10-economy.md) | Villager gather/drop-off/farm, resource depletion | 📋 Planned | `GatherSystem`, `FarmSystem` |
| 11 | [11-combat.md](11-combat.md) | Attack FSM, damage formula, projectiles, death, garrison | 📋 Planned | `CombatSystem`, `ProjectileSystem` |
| 12 | [12-fog-of-war.md](12-fog-of-war.md) | Hidden/Explored/Visible tiles, LOS, shroud render | 📋 Planned | `FogOfWar`, `FogRenderer` |
| 13 | [13-tech-tree.md](13-tech-tree.md) | Technologies, ages, civ bonuses, research UI | 📋 Planned | `TechSystem`, `Player.research()` |
| 14 | [14-win-conditions.md](14-win-conditions.md) | Conquest, Wonder, Regicide, diplomacy states | 📋 Planned | `WinConditionSystem` |
| 15 | [15-ai-opponent.md](15-ai-opponent.md) | Scripted FSM, build orders, attack, difficulty | 📋 Planned | `AIController` |
| 16 | [16-sound.md](16-sound.md) | Web Audio, unit responses, ambient, music | 📋 Planned | `AudioSystem` |
| 17 | [17-game-setup.md](17-game-setup.md) | Main menu, civ picker, map settings, lobby | 📋 Planned | `MenuScreen`, `GameSettings` |
| 18 | [18-multiplayer.md](18-multiplayer.md) | Deterministic lockstep, WebSocket, sync | 🔵 Stretch | `CommandSystem`, `NetworkManager` |
| 09s | [09-sprites-animations.md](09-sprites-animations.md) | openage extraction, atlas format, directional anims | ⏳ Blocked | `SpriteSheet`, `AnimationSystem` |

---

## Cross-cutting concerns

### CommandSystem (prerequisite for multiplayer)
All game-mutating actions must go through a `CommandSystem` rather than directly modifying state.
Start simple (commands execute immediately), but structure it so multiplayer can batch+delay them.
Document in [18-multiplayer.md](18-multiplayer.md).

### Determinism
Tracked in [18-multiplayer.md](18-multiplayer.md). Short version:
- No `Math.random()` in simulation (seeded RNG only — already done in MapGenerator)
- No wall-clock time in simulation logic (only `dt` from GameLoop)
- Float positions are fine for single-player; fixed-point needed for multiplayer

### Player ownership
All game entities (units, buildings, resources) are owned by a `playerId: number`.
`playerId = 0` = Gaia (neutral — forests, mines, animals).
`playerId = 1` = local human player.
`playerId >= 2` = AI or remote players.

### Data vs state
- `UnitDef`, `BuildingDef`, `TechDef` — static, shared, never mutated
- `UnitInstance`, `BuildingInstance` — per-game mutable state
- `Player` — per-player mutable state (resources, age, researched techs)
