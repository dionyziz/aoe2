# Plan 00 — Scaffolding

**Status:** ✅ Done

---

## What was built

- **Vite + TypeScript** project with `es2022` target, strict mode, path aliases (`@engine/`, `@utils/`, etc.)
- **Single `<canvas>`** element, DPI-aware sizing (`devicePixelRatio`), fills the full window, resizes on `window.resize`
- **`GameLoop`** — fixed 20 Hz simulation (`TICK_MS = 50ms`) + variable-rate rAF render
  - Accumulator pattern: `while (acc >= TICK_MS) { update(TICK_MS); acc -= TICK_MS; }`
  - `render(alpha)` receives `alpha = acc / TICK_MS` for lerp interpolation
  - FPS counter measured over 1-second windows
- **`EventBus`** — typed pub/sub, zero dependencies, used for all cross-system communication
- **`Game`** — top-level orchestrator, wires all subsystems, controls initialization order
- **`src/constants.ts`** — `TILE_WIDTH=64`, `TILE_HEIGHT=32`, `TICK_MS=50`, zoom limits, scroll thresholds

## Key decisions

- Single canvas (no separate HUD canvas) — simpler event routing
- Fixed 20 Hz sim + variable render is standard for deterministic game logic
- EventBus is typed via `EventMap` — all events and payloads are documented at compile time

## Files

```
src/main.ts
src/constants.ts
src/engine/Game.ts
src/engine/GameLoop.ts
src/engine/EventBus.ts
src/utils/math.ts
src/utils/pool.ts
src/utils/logger.ts
```
