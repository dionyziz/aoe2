# Game Loop & Rendering Pipeline

## Fixed timestep

```
TICK_MS = 50ms  →  20 Hz simulation
```

The loop uses an accumulator to separate simulation from rendering:

```typescript
let accumulator = 0;

function onAnimationFrame(timestamp: number) {
  const elapsed = Math.min(timestamp - lastTime, 200); // cap to avoid spiral of death
  lastTime = timestamp;
  accumulator += elapsed;

  while (accumulator >= TICK_MS) {
    update(TICK_MS);          // fixed simulation step
    accumulator -= TICK_MS;
  }

  const alpha = accumulator / TICK_MS;  // interpolation factor 0..1
  render(alpha);                        // variable-rate render with lerp

  requestAnimationFrame(onAnimationFrame);
}
```

`alpha` is passed to the renderer so that unit positions can be lerp-interpolated between the previous and current simulation tick, producing smooth motion at any frame rate.

The 200ms cap prevents the simulation from running many ticks after a tab was in the background.

---

## FPS counter

Frames per second are measured over 1-second windows:

```typescript
let frameCount = 0;
let fpsWindowStart = 0;
let currentFps = 0;

// In render():
frameCount++;
if (timestamp - fpsWindowStart >= 1000) {
  currentFps = frameCount;
  frameCount = 0;
  fpsWindowStart = timestamp;
}
```

Displayed in the HUD top-right corner in development mode.

---

## Simulation update order (per tick)

Each `update(dt)` call runs these systems in order:

1. **CameraController** — pan, zoom, edge scroll
2. **MovementSystem** — advance unit positions along paths
3. **UnitStateMachine** — state transitions (Idle / Moving / Attacking / Gathering / Dead)
4. **GatherSystem** — villager gather ticks, return trips, drop-off
5. **CombatSystem** — attack cooldowns, damage application, chase
6. **ProjectileSystem** — advance projectiles, apply damage on hit
7. **BuildingManager** — construction progress, train queue ticks
8. **TechSystem** — research queue ticks
9. **FogOfWar** — recompute visible tiles
10. **WinConditionSystem** — check victory/defeat
11. **AIController** (throttled 2Hz) — AI think cycle
12. **AudioSystem** — trigger queued sound events

---

## Rendering pipeline (per frame)

`Renderer.render(alpha)` draws in this order:

```
1. TerrainRenderer.render()
   └─ Blit from off-screen canvas cache (only re-renders if dirty)
   └─ Diagonal painter's order: for d in [minD..maxD]: for each (tx,ty) where tx+ty=d

2. EntityRenderer.renderResources()      decorations, resource nodes

3. EntityRenderer.renderBuildings()      sorted by tx+size+ty+size

4. EntityRenderer.renderUnits()          sorted by wx+wy (lerp-interpolated from alpha)

5. EntityRenderer.renderProjectiles()    small dots/lines

6. EntityRenderer.renderSelectionRings() green selection circles
   EntityRenderer.renderHPBars()         HP bars above damaged units

7. FogRenderer.render()                  black/dim overlays on unexplored/explored tiles

8. UIRenderer.render()
   ├─ Drag selection rectangle
   ├─ Building placement preview (if active)
   ├─ Minimap
   ├─ HUD bar (top)
   └─ Bottom panel (selection info + action buttons)
```

---

## Off-screen terrain cache

`TerrainRenderer` maintains an `OffscreenCanvas` the size of the visible tile area.
It is invalidated (and redrawn on next frame) when:
- Camera pan or zoom changes
- Map tiles change (e.g. a forest tile is cleared)

On a clean frame the terrain pass is a single `ctx.drawImage()` blit — very fast.

---

## EventBus

Typed pub/sub. All inter-system communication uses events, not direct method calls.

```typescript
type EventMap = {
  // Input
  'input:leftClick':  { screenX: number; screenY: number; pos: WorldPos };
  'input:rightClick': { screenX: number; screenY: number; pos: WorldPos };
  'input:boxSelect':  Rect;
  'input:wheel':      { delta: number; screenX: number; screenY: number };
  'input:middleDragStart' | 'input:middleDrag' | 'input:middleDragEnd': { dx: number; dy: number };
  'input:mousemove':  { screenX: number; screenY: number };
  'input:keydown':    { code: string; ctrl: boolean; shift: boolean; alt: boolean };
  'input:keyup':      { code: string };

  // Units
  'unit:selected':    { ids: number[] };
  'unit:died':        { id: number };

  // Buildings
  'building:placed':    { building: BuildingInstance };
  'building:complete':  { building: BuildingInstance };
  'building:destroyed': { buildingId: number };

  // Tech
  'tech:researched':  { techId: string; playerId: number };
  'player:aged_up':   { playerId: number; age: UnitAge };
  'player:eliminated':{ playerId: number };

  // Map
  'map:loaded':       { map: MapData };
  'camera:moved':     void;

  // Win
  'game:over':        { winnerId: number; type: VictoryType };
};
```
