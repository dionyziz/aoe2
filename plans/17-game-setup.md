# Plan 17 — Game Setup & Main Menu

**Status:** 📋 Planned
**Depends on:** 06 (MapGenerator — map settings), 09 (Player System — civ selection), 15 (AI opponent)

---

## Overview

Currently the game launches directly into a hard-coded match. This plan adds:
1. A main menu screen
2. Single-player game setup (civ picker, map settings, difficulty)
3. Saved settings persistence
4. Pause menu and in-game options

---

## Screen flow

```
Main Menu
  ├─ Single Player → Game Setup → [Launch Game]
  ├─ Multiplayer   → Lobby (Plan 18)
  ├─ Load Game     → (stretch — save/load not planned yet)
  └─ Options       → Audio/video settings

Game Setup
  ├─ Civilization picker (human player)
  ├─ AI opponent count (1–7) + difficulty per AI
  ├─ Map type (Random, Arabia, Islands, Black Forest, ...)
  ├─ Map size (Tiny 2p, Small 4p, Medium 6p, Normal 6p, Large 8p, Huge 8p)
  ├─ Starting resources (Standard / Medium / High / Infinite)
  ├─ Population cap (75 / 100 / 125 / 150 / 175 / 200)
  ├─ Victory conditions (Conquest / Wonder / Regicide / Score / All)
  ├─ Game speed (Slow / Normal / Fast / Fastest)
  └─ [Start Game] button
```

---

## Main menu screen

Rendered on a separate `<div>` overlay (HTML, not canvas) for simplicity.
Canvas is hidden until game starts.

```html
<div id="main-menu">
  <h1>Age of Web</h1>
  <nav>
    <button id="btn-singleplayer">Single Player</button>
    <button id="btn-multiplayer">Multiplayer</button>
    <button id="btn-options">Options</button>
  </nav>
</div>
```

CSS: full-screen, dark background with background art (later: generated map preview).

---

## Civilization picker

Grid of 39 civ shields (icons). Click to select.
Right side panel shows selected civ info:
- Civ name
- Unique unit name + description
- Team bonus
- Full list of civilization bonuses (text)
- Architecture style (European / Middle Eastern / Asian / Native American)

For now: text-based display (no actual civ bonus sprites).

Random civ button: picks one at random.

---

## Game settings interface

```typescript
export interface GameSettings {
  // Players
  humanCivId: string;
  aiPlayers: Array<{ civId: string; difficulty: AIDifficulty }>;

  // Map
  mapSeed: number;       // 0 = random on launch
  mapType: MapType;      // 'random' | 'arabia' | 'islands' | etc.
  mapSize: MapSize;      // 'tiny' | 'small' | 'medium' | 'normal' | 'large' | 'huge'

  // Resources
  startingResources: 'standard' | 'medium' | 'high' | 'infinite';
  populationCap: 75 | 100 | 125 | 150 | 175 | 200;

  // Victory
  victoryConditions: VictoryType[];

  // Gameplay
  gameSpeed: 'slow' | 'normal' | 'fast' | 'fastest';
  fogOfWar: boolean;
  revealMap: boolean;    // cheat/spectate mode
  lockTeams: boolean;
}
```

Map sizes:

| Size | Tiles |
|------|-------|
| Tiny | 120×120 |
| Small | 144×144 |
| Medium | 168×168 |
| Normal | 200×200 |
| Large | 220×220 |
| Huge | 240×240 |

Note: our current map generator is tested at 32×32. Larger maps need heap-based A* (see Plan 04 limitations).
Initial implementation targets 32×32 (custom/tiny) to match existing code.

---

## Map types

Each map type passes different options to `MapGenerator`:

| Map Type | Description | Generator options |
|----------|-------------|-------------------|
| Random | Mix of terrain | Default options |
| Arabia | Open grassland, few forests | Low water, dense forests in corners |
| Black Forest | Dense forest maze | Very dense forest, narrow passages |
| Islands | Separated by water | High water level, large island clusters |
| Coastal | Land + sea mix | Medium water level along edges |
| Rivers | One or two rivers crossing | Water bands procedurally placed |
| Nomad | No TC at start, random spawn | TC excluded from spawns |
| Migration | Thin land bridge | Extreme water level |

Initially implement: Random only. Other types are just different `MapGenOptions` presets.

---

## Pause menu

Triggered by `Escape` key during gameplay.

```
┌─────────────────────────┐
│        PAUSED           │
├─────────────────────────┤
│  [Resume]               │
│  [Options]              │
│  [Restart]              │
│  [Quit to Main Menu]    │
└─────────────────────────┘
```

When paused: `GameLoop` stops calling `update()` but render still runs (shows frozen game state).

---

## Options screen

Accessible from main menu and pause menu.

Sections:
- **Audio**: Master volume, SFX volume, Music volume, Unit voice toggle
- **Video**: Resolution (canvas size), Show FPS counter
- **Gameplay**: Scroll speed, Edge scroll on/off, Minimap position

Settings persist to `localStorage`:
```typescript
const SETTINGS_KEY = 'aoe-web-settings';
const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
```

---

## Game speed

Game speed modifies `TICK_MS` and animation speeds:

| Speed | TICK_MS | Real-time factor |
|-------|---------|-----------------|
| Slow | 100ms | 0.5× |
| Normal | 50ms | 1× |
| Fast | 33ms | 1.5× |
| Fastest | 25ms | 2× |

Game speed is applied by multiplying `dt` in the simulation:
```typescript
const effectiveDt = dt * gameSpeedMultiplier;
```

---

## Hotkeys for navigation

| Key | Action |
|-----|--------|
| `Escape` | Toggle pause menu |
| `F1` | Help overlay |
| `Alt+F4` / `Cmd+Q` | Quit (handled by browser) |

---

## Files to create/modify

```
src/ui/MainMenu.ts          ← Create: main menu HTML injection + event handlers
src/ui/GameSetupScreen.ts   ← Create: setup screen, civ picker
src/ui/PauseMenu.ts         ← Create: pause overlay
src/ui/OptionsScreen.ts     ← Create: options panel
src/types/settings.ts       ← Create: GameSettings, AudioSettings interfaces
src/engine/Game.ts          ← Accept GameSettings, pass to MapGenerator/PlayerManager
src/main.ts                 ← Show MainMenu before creating Game
```

---

## Known limitations / future work

- No save/load game (requires serializing full game state)
- No replay system
- Map preview thumbnail not generated (would require running MapGenerator headlessly)
- Nomad mode (no TC at start) requires special spawning logic
- Score display and final stats screen (see Plan 14)
