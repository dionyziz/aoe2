# Menus & Game Setup

## Screen flow

```
Main Menu
  ├─ Single Player → Game Setup → [Start Game]
  ├─ Multiplayer   → Lobby (see multiplayer spec)
  └─ Options       → Settings screen

During game:
  Escape → Pause Menu
    ├─ Resume
    ├─ Options
    ├─ Restart
    └─ Quit to Main Menu
```

All menus are HTML overlays rendered on top of the canvas. The canvas is hidden until a game starts.

---

## Main menu

Full-screen dark background with centered content:
- Game title: "Age of Web"
- Buttons: Single Player, Multiplayer, Options

---

## Game setup screen

### Civilization picker

- 45 civ shields arranged in a grid (7–8 per row)
- Click to select
- Random civ button
- Right panel shows selected civ info:
  - Name
  - Unique unit name + brief description
  - Team bonus (one-line)
  - Full bonus list (scrollable)

### Settings

| Setting | Options | Default |
|---------|---------|---------|
| Civilization | All 45 civs | Random |
| AI opponents | 1–7 | 1 |
| AI difficulty per player | Easiest / Standard / Hard / Hardest | Standard |
| AI civilization | All 45 + Random | Random |
| Map type | Random / Arabia / Black Forest / Islands / Coastal / Rivers / Nomad | Random |
| Map size | Tiny / Small / Medium / Normal / Large / Huge | Normal |
| Starting resources | Standard / Medium / High / Infinite | Standard |
| Population cap | 75 / 100 / 125 / 150 / 175 / 200 | 200 |
| Victory conditions | Conquest / Wonder / Regicide / Score (multi-select) | Conquest |
| Game speed | Slow / Normal / Fast / Fastest | Normal |
| Fog of war | On / Off | On |
| Reveal map | Off / On | Off |

[Start Game] button launches the game with these settings.

Settings are persisted to `localStorage` under key `'aoe-web-game-settings'`.

---

## Map sizes

| Name | Tiles | Recommended players |
|------|-------|---------------------|
| Tiny | 120×120 | 2 |
| Small | 144×144 | 3–4 |
| Medium | 168×168 | 4 |
| Normal | 200×200 | 4–6 |
| Large | 220×220 | 6 |
| Huge | 240×240 | 8 |

Note: maps larger than ~50×50 require a heap-based A* open list (currently not implemented). Starting implementation uses 32×32 only.

---

## Map types (generator presets)

| Type | Water level | Forest density | Notes |
|------|-------------|----------------|-------|
| Random | 0.25 | 0.15 | Balanced mix |
| Arabia | 0.15 | 0.20 | Open grassland, forests in corners |
| Black Forest | 0.10 | 0.60 | Dense forest maze, narrow passages |
| Islands | 0.60 | 0.10 | Separated by water, naval focus |
| Coastal | 0.35 | 0.15 | Land + coast mix |
| Rivers | 0.20 | 0.10 | 1–2 water rivers crossing the map |
| Nomad | 0.15 | 0.15 | No TC at start position |

---

## Game speed

Game speed scales the simulation `dt`:

| Speed | TICK_MS | dt multiplier |
|-------|---------|---------------|
| Slow | 100ms | 0.5× |
| Normal | 50ms | 1× |
| Fast | 33ms | ~1.5× |
| Fastest | 25ms | 2× |

---

## Pause menu

Triggered by Escape key during gameplay. Simulation stops (no `update()` calls); render continues showing the frozen game state.

Centered overlay:
```
PAUSED
[Resume]
[Options]
[Restart]
[Quit to Main Menu]
```

---

## Options screen

Accessible from main menu and pause menu.

### Audio
| Setting | Range | Default |
|---------|-------|---------|
| Master volume | 0–100 | 80 |
| SFX volume | 0–100 | 80 |
| Music volume | 0–100 | 50 |
| Unit voice responses | On/Off | On |

### Video
| Setting | Options | Default |
|---------|---------|---------|
| Show FPS counter | On/Off | Off (On in dev mode) |

### Gameplay
| Setting | Range | Default |
|---------|-------|---------|
| Camera scroll speed | 1–20 | 8 |
| Edge scroll | On/Off | On |
| Minimap position | Bottom-right / Bottom-left | Bottom-right |

Settings persisted under `'aoe-web-audio-settings'` and `'aoe-web-video-settings'` keys.

---

## GameSettings TypeScript interface

```typescript
interface GameSettings {
  humanCivId: string;
  aiPlayers: Array<{ civId: string; difficulty: AIDifficulty }>;
  mapSeed: number;              // 0 = random at launch
  mapType: MapType;
  mapSize: MapSize;
  startingResources: 'standard' | 'medium' | 'high' | 'infinite';
  populationCap: number;
  victoryConditions: VictoryType[];
  gameSpeed: 'slow' | 'normal' | 'fast' | 'fastest';
  fogOfWar: boolean;
  revealMap: boolean;
}

interface AudioSettings {
  masterVolume: number;         // 0..1
  sfxVolume: number;
  musicVolume: number;
  unitAcknowledgements: boolean;
}
```
