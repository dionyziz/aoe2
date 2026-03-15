# Plan 18 — Multiplayer (Stretch Goal)

**Status:** 🔵 Stretch goal
**Depends on:** All previous phases, especially CommandSystem (see below)

---

## Architecture: Deterministic Lockstep

AoE2 uses deterministic lockstep — all clients run the same simulation. Only player *inputs*
(commands) are sent over the network, not game state. Every client applies the same commands
at the same simulation tick and reaches identical state.

Requirements:
1. Simulation must be **fully deterministic** — same inputs → same output on every machine
2. No `Math.random()` in simulation code (use seeded RNG only — already done in MapGenerator)
3. No `Date.now()` or `performance.now()` in game logic
4. Floating-point must be consistent (use integer arithmetic for positions, or fixed-point math)

---

## CommandSystem (prerequisite — implement before multiplayer)

**All game-mutating actions** must go through a `CommandSystem` rather than directly modifying state.
This is the critical architectural prerequisite for multiplayer.

```typescript
// src/engine/commands/CommandSystem.ts
export class CommandSystem {
  private handlers: Map<string, CommandHandler> = new Map();

  register<T extends Command>(type: T['type'], handler: (cmd: T, game: GameState) => void): void {
    this.handlers.set(type, handler as CommandHandler);
  }

  submit(cmd: Command): void {
    // In single-player: execute immediately
    // In multiplayer: buffer and send to server, execute when turn batch arrives
    this.execute(cmd);
  }

  execute(cmd: Command): void {
    const handler = this.handlers.get(cmd.type);
    if (handler) handler(cmd, this.gameState);
  }
}
```

Every action currently wired directly (`unitManager.moveTo(...)`, `buildingManager.place(...)`)
must be refactored to go through `commandSystem.submit(...)`.

---

## Command types

```typescript
type Command =
  | { type: 'move';     playerId: number; unitIds: number[]; tx: number; ty: number }
  | { type: 'attack';   playerId: number; unitIds: number[]; targetId: number; targetIsBuilding: boolean }
  | { type: 'stop';     playerId: number; unitIds: number[] }
  | { type: 'patrol';   playerId: number; unitIds: number[]; tx: number; ty: number }
  | { type: 'gather';   playerId: number; villagerId: number; resourceId: number }
  | { type: 'build';    playerId: number; villagerId: number; defId: string; tx: number; ty: number }
  | { type: 'train';    playerId: number; buildingId: number; unitDefId: string }
  | { type: 'research'; playerId: number; buildingId: number; techId: string }
  | { type: 'age_up';   playerId: number; buildingId: number }
  | { type: 'garrison'; playerId: number; unitIds: number[]; buildingId: number }
  | { type: 'resign';   playerId: number };
```

All commands include `playerId` so they can be validated: commands from player 1 cannot affect
player 2's units. In multiplayer, `playerId` is set by the server (not trusted from the client).

---

## Turn structure

Commands are batched into **turns** (not individual simulation ticks):
- 1 turn = 2 simulation ticks = 100ms at 20 Hz
- Each client collects commands for turn N, sends them to server
- Server waits for all clients' commands for turn N, then broadcasts the batch
- All clients execute the batch at the same tick

If a client's commands arrive late → all clients pause and wait (causes visible lag).

```
Client A: [cmd: move unit 5 to (10,12)] ──┐
Client B: [cmd: attack unit 3]             ├──→ Server ──→ All clients execute turn N
Client C: [cmd: train archer]              ┘
```

---

## Protocol

Transport: WebSocket (binary, 1-byte type prefix).

```typescript
enum MsgType {
  // Lobby
  JOIN_LOBBY   = 0x01,  // client → server: { playerName, civId }
  LOBBY_STATE  = 0x02,  // server → client: { players[], mapSeed, settings }
  READY        = 0x03,  // client → server: {}
  GAME_START   = 0x04,  // server → client: { playerId, seed, turnRate }

  // In-game
  COMMANDS     = 0x10,  // client → server: { turn, commands[] }
  TURN_BATCH   = 0x11,  // server → client: { turn, allCommands[] }
  SYNC_CHECK   = 0x12,  // client → server: { turn, stateHash }
  DESYNC       = 0x13,  // server → client: { turn, message }

  // Social
  CHAT         = 0x20,
  RESIGN       = 0x30,
  PING         = 0x40,
  PONG         = 0x41,
}
```

---

## Server

Simple Node.js WebSocket server (`server/index.ts`):
- Manages lobbies (up to 8 players)
- Receives command batches per turn per player
- Waits for all players before broadcasting turn batch
- Turn timeout (500ms): if a client hasn't sent, broadcast with empty commands for that player
- Detects desync via state hash comparison

```typescript
// server/index.ts
import { WebSocketServer } from 'ws';

interface Lobby {
  id: string;
  players: LobbyPlayer[];
  state: 'waiting' | 'in_game';
  turn: number;
  pendingCommands: Map<number, Command[]>; // playerId → commands
  settings: GameSettings;
}
```

---

## Sync checking

Every 10 turns, clients compute a deterministic hash of critical game state:

```typescript
function computeStateHash(
  units: UnitInstance[],
  buildings: BuildingInstance[],
  resources: ResourceCounts[]
): number {
  let h = 0;
  // Sort by id to ensure consistent ordering
  for (const u of [...units].sort((a, b) => a.id - b.id)) {
    h = (h * 31 + Math.round(u.pos.wx * 100)) | 0;
    h = (h * 31 + Math.round(u.pos.wy * 100)) | 0;
    h = (h * 31 + u.currentHp) | 0;
  }
  for (const b of [...buildings].sort((a, b) => a.id - b.id)) {
    h = (h * 31 + b.currentHp) | 0;
    h = (h * 31 + Math.round(b.constructionProgress * 1000)) | 0;
  }
  return h >>> 0;
}
```

Hash mismatch → server broadcasts DESYNC, clients show error.

---

## Lobby UI

- Full-screen lobby screen before game starts
- Player list: name, civilization shield, ready status
- Host controls: map type, map size, victory conditions, game speed
- Chat box
- Ready check (all must be ready before host can start)
- Civ picker per player

---

## Determinism audit checklist

Before multiplayer can work, audit simulation code:
- [x] `Math.random()` in MapGenerator replaced with seeded RNG (done)
- [ ] Verify A* produces identical paths (pure integer ops — should be OK)
- [ ] Movement integration uses deterministic `dt` (float — may need fixed-point)
- [ ] No `Date.now()` in update paths
- [ ] No `Math.random()` in formation spreading
- [ ] GatherSystem uses `dt` only (not wall clock)
- [ ] CombatSystem uses `dt` only
- [ ] AnimationSystem: animation timers must not affect game logic (only visual)
- [ ] All `seededRng()` calls use the same seed on all clients

---

## Latency hiding

Even with lockstep, players feel lag if the turn rate is slow.
Techniques:
- **Command delay**: client executes commands 2–3 turns in the future (gives time for network delivery)
- **Local prediction**: show move confirmation immediately (ring flash); sync on turn batch arrival
- At 100ms turn rate + 150ms RTT: 2-turn command delay (200ms) is acceptable

---

## Files to create

```
server/
  index.ts              ← Node.js WebSocket server
  Lobby.ts              ← Lobby management
  TurnManager.ts        ← Per-turn command collection and broadcasting

src/engine/commands/
  CommandSystem.ts      ← Command submission, routing, execution
  CommandTypes.ts       ← All Command union types

src/engine/network/
  NetworkManager.ts     ← WebSocket client, send/receive
  LockstepManager.ts    ← Turn buffering, timing

src/ui/
  LobbyScreen.ts        ← Pre-game lobby UI
```
