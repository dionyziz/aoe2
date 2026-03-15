# Multiplayer & Command System

## CommandSystem (single-player prerequisite)

Before multiplayer can work, **all game-mutating actions** must route through `CommandSystem.submit()`. In single-player the command executes immediately; in multiplayer it is buffered and sent to the server, executing when the turn batch arrives.

```typescript
class CommandSystem {
  register<T extends Command>(type: T['type'], handler: CommandHandler<T>): void;
  submit(cmd: Command): void;
  execute(cmd: Command): void;   // called by lockstep manager on turn batch arrival
}
```

### Command types

```typescript
type Command =
  | { type: 'move';          playerId: number; unitIds: number[]; tx: number; ty: number }
  | { type: 'attack';        playerId: number; unitIds: number[]; targetId: number; targetIsBuilding: boolean }
  | { type: 'attack_ground'; playerId: number; unitIds: number[]; wx: number; wy: number }
  | { type: 'stop';          playerId: number; unitIds: number[] }
  | { type: 'patrol';        playerId: number; unitIds: number[]; tx: number; ty: number }
  | { type: 'gather';        playerId: number; villagerId: number; resourceId: number }
  | { type: 'build';         playerId: number; villagerId: number; defId: string; tx: number; ty: number }
  | { type: 'train';         playerId: number; buildingId: number; unitDefId: string }
  | { type: 'research';      playerId: number; buildingId: number; techId: string }
  | { type: 'age_up';        playerId: number; buildingId: number }
  | { type: 'garrison';      playerId: number; unitIds: number[]; buildingId: number }
  | { type: 'ungarrison';    playerId: number; buildingId: number; unitId?: number }
  | { type: 'stance';        playerId: number; unitIds: number[]; stance: CombatStance }
  | { type: 'resign';        playerId: number };
```

All commands carry `playerId`. The server sets this field; the client value is not trusted.

---

## Deterministic lockstep

All clients run the same simulation. Only player *commands* are transmitted over the network.

Requirements:
- No `Math.random()` in simulation (seeded RNG only — already done in MapGenerator)
- No `Date.now()` or `performance.now()` in game logic (only `dt` from GameLoop)
- Floating-point must be consistent — for multiplayer, migrate unit positions to fixed-point integers

### Turn structure

One turn = 2 simulation ticks = 100ms at 20 Hz.

```
Clients A, B, C each collect commands for turn N
  → each sends COMMANDS message to server
  → server waits for all clients
  → server broadcasts TURN_BATCH with all commands for turn N
  → all clients execute batch at tick 2N
```

If a client's COMMANDS message doesn't arrive within 500ms → server broadcasts TURN_BATCH with empty commands for that client (they miss their turn).

---

## WebSocket protocol

Transport: WebSocket binary frames, 1-byte message type prefix.

```typescript
enum MsgType {
  // Lobby
  JOIN_LOBBY  = 0x01,  // client→server: { playerName, civId }
  LOBBY_STATE = 0x02,  // server→client: { players[], mapSeed, settings }
  READY       = 0x03,  // client→server: {}
  GAME_START  = 0x04,  // server→client: { playerId, seed, turnRate }

  // In-game
  COMMANDS    = 0x10,  // client→server: { turn: number, commands: Command[] }
  TURN_BATCH  = 0x11,  // server→client: { turn: number, allCommands: Command[][] }
  SYNC_CHECK  = 0x12,  // client→server: { turn: number, stateHash: number }
  DESYNC      = 0x13,  // server→client: { turn: number, message: string }

  // Social
  CHAT        = 0x20,
  RESIGN      = 0x30,
  PING        = 0x40,
  PONG        = 0x41,
}
```

---

## Sync checking

Every 10 turns, each client sends `SYNC_CHECK` with a hash of critical game state. The server compares hashes from all clients. A mismatch means the simulations have diverged → server broadcasts `DESYNC`, the game ends with an error screen.

```typescript
function computeStateHash(
  units: UnitInstance[],
  buildings: BuildingInstance[],
  resources: ResourceCounts[]
): number {
  let h = 0;
  // Sort by id to ensure deterministic ordering
  for (const u of [...units].sort((a, b) => a.id - b.id)) {
    h = (h * 31 + Math.round(u.pos.wx * 100)) | 0;
    h = (h * 31 + Math.round(u.pos.wy * 100)) | 0;
    h = (h * 31 + u.currentHp) | 0;
  }
  for (const b of [...buildings].sort((a, b) => a.id - b.id)) {
    h = (h * 31 + b.currentHp) | 0;
  }
  return h >>> 0;
}
```

---

## Latency hiding

Command delay: client executes commands 2 turns in the future. This gives 200ms for network delivery before execution is needed. At 150ms RTT, 2 turns (200ms) is comfortably ahead of network latency.

Local prediction: the client shows visual confirmation immediately (unit selection ring flash, move indicator on ground) without waiting for the turn batch. Actual movement begins 2 turns later.

---

## Server

Node.js WebSocket server (`server/index.ts`), managing lobbies of up to 8 players.

```typescript
interface Lobby {
  id: string;
  players: LobbyPlayer[];
  state: 'waiting' | 'in_game';
  turn: number;
  pendingCommands: Map<number, Command[]>;   // playerId → commands for this turn
  settings: GameSettings;
}
```

---

## Determinism audit checklist

- [x] MapGenerator uses seeded LCG RNG
- [ ] Formation spreading uses seeded RNG (not `Math.random()`)
- [ ] A* path deterministic (pure integer ops — should be OK)
- [ ] Movement integration: float positions → fixed-point for multiplayer
- [ ] GatherSystem uses `dt` only
- [ ] CombatSystem uses `dt` only
- [ ] AnimationSystem does not affect game logic
- [ ] No `Date.now()` in any update path

---

## Files

```
server/
  index.ts              Node.js WebSocket server
  Lobby.ts              Lobby state management
  TurnManager.ts        Turn collection and broadcasting

src/engine/commands/
  CommandSystem.ts      Command submission, routing, execution
  CommandTypes.ts       Command union types

src/engine/network/
  NetworkManager.ts     WebSocket client, message send/receive
  LockstepManager.ts    Turn buffering, timing, command delay

src/ui/
  LobbyScreen.ts        Pre-game lobby HTML overlay
```
