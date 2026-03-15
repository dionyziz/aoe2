# Plan 14 — Win Conditions

**Status:** 📋 Planned
**Depends on:** 09 (Player System), 11 (Combat — unit/building destruction), 13 (Tech Tree — Wonder)

---

## Victory types (matching AoE2)

| Type | Condition | Default? |
|------|-----------|---------|
| Conquest | Eliminate all enemy players (kill all units + destroy all buildings) | Yes |
| Wonder Race | Build a Wonder and survive for 200 in-game years (clock in top-right) | Optional |
| Regicide | Kill the enemy King unit | Optional |
| Score | Highest score at time limit (rarely used in multiplayer) | Optional |

Game Setup (Plan 17) lets the host choose which victory conditions are active (multiple can be on simultaneously).

---

## Conquest victory

```
Condition: all enemy players are eliminated
Eliminated = no units AND no buildings remaining
```

```typescript
function checkConquest(players: Player[], units: UnitInstance[], buildings: BuildingInstance[]): number | null {
  for (const player of players) {
    if (player.id === GAIA_ID) continue;
    const hasUnits = units.some(u => u.playerId === player.id);
    const hasBuildings = buildings.some(b => b.playerId === player.id);
    if (!hasUnits && !hasBuildings) {
      player.eliminated = true;
    }
  }
  const activePlayers = players.filter(p => p.id !== GAIA_ID && !p.eliminated);
  if (activePlayers.length === 1) return activePlayers[0].id;  // winner
  return null;
}
```

Note: AoE2 gives a small grace period (30 seconds after last building destroyed) before elimination,
allowing the player to retrain villagers from a captured TC or save garrisoned units.

---

## Wonder victory

A Wonder is a special 4×4 building (most expensive in the game: 1000w, 1000s, 1000g).
Once a Wonder is complete, a countdown timer appears (200 in-game years ≈ variable real-time
depending on game speed).

```typescript
class WonderSystem {
  private wonderCountdowns: Map<number, number> = new Map(); // playerId → remaining ms

  WONDER_DURATION_MS = 200 * GAME_YEAR_MS; // 200 game years

  update(dt: number, buildings: BuildingInstance[]): number | null {
    // Start countdown for newly completed Wonders
    for (const b of buildings) {
      if (b.defId === 'wonder' && b.constructionProgress >= 1 && !this.wonderCountdowns.has(b.playerId)) {
        this.wonderCountdowns.set(b.playerId, this.WONDER_DURATION_MS);
      }
    }
    // Cancel countdown if Wonder is destroyed
    for (const [playerId] of this.wonderCountdowns) {
      const wonder = buildings.find(b => b.defId === 'wonder' && b.playerId === playerId);
      if (!wonder) this.wonderCountdowns.delete(playerId);
    }
    // Tick down
    for (const [playerId, remaining] of this.wonderCountdowns) {
      const newRemaining = remaining - dt;
      if (newRemaining <= 0) return playerId; // wonder victory
      this.wonderCountdowns.set(playerId, newRemaining);
    }
    return null;
  }
}
```

UI: A red countdown bar appears at the top of the screen when an enemy builds a Wonder.
Player notification: "The [Civ] have built a Wonder! Destroy it or lose the game!"

---

## Regicide victory

Each player starts with one King unit in their Town Center.
The King has high HP (75) but no attack.
Killing the enemy King wins the game.

```typescript
// King unit definition added to unit data:
{
  id: 'king',
  name: 'King',
  class: UnitClass.Infantry,
  hp: 75,
  speed: 0.8,
  attackDamage: 0,
  // ...
  // unique spawn: one per player at game start, placed in/near TC
}
```

```typescript
function checkRegicide(players: Player[], units: UnitInstance[]): number | null {
  for (const player of players) {
    const kingAlive = units.some(u => u.defId === 'king' && u.playerId === player.id);
    if (!kingAlive) {
      player.eliminated = true;
    }
  }
  const activePlayers = players.filter(p => !p.eliminated);
  if (activePlayers.length === 1) return activePlayers[0].id;
  return null;
}
```

Regicide also enables the Regicide AI personality which plays much more defensively.

---

## Score victory

Score is accumulated over the game from:
- Military: units trained, units killed, buildings destroyed
- Economy: resources gathered
- Technology: technologies researched, age reached
- Society: population maintained, wonders built

Score is shown on the HUD (top-right corner, next to FPS in dev mode).

When time limit expires, player with highest score wins.
Score victory is rarely used in competitive play but useful for testing.

---

## Diplomacy states

Each pair of players has a diplomacy stance:

```typescript
type DiplomacyState = 'ally' | 'neutral' | 'enemy';

// In PlayerManager:
getDiplomacy(playerA: number, playerB: number): DiplomacyState { ... }
setDiplomacy(playerA: number, playerB: number, state: DiplomacyState): void { ... }
```

Default: all players are enemies except within the same team.

Team support:
- Players on the same team share line of sight (FoW)
- Resources can be tributed to allies
- Victory is shared (allied victory condition — any one ally wins → all allies win)
- Team game: 2v2, 3v3, 4v4

---

## WinConditionSystem (`src/engine/win/WinConditionSystem.ts`)

```typescript
export class WinConditionSystem {
  private activeConditions: VictoryType[];
  private wonderSystem = new WonderSystem();

  check(gameState: GameStateSnapshot): WinResult | null {
    for (const cond of this.activeConditions) {
      switch (cond) {
        case 'conquest': {
          const winner = checkConquest(gameState.players, gameState.units, gameState.buildings);
          if (winner !== null) return { type: 'conquest', winnerId: winner };
          break;
        }
        case 'wonder': {
          const winner = this.wonderSystem.update(gameState.dt, gameState.buildings);
          if (winner !== null) return { type: 'wonder', winnerId: winner };
          break;
        }
        case 'regicide': {
          const winner = checkRegicide(gameState.players, gameState.units);
          if (winner !== null) return { type: 'regicide', winnerId: winner };
          break;
        }
      }
    }
    return null;
  }
}
```

---

## Win/loss screen

On game end:
1. Fade to black overlay
2. Show "VICTORY" (gold) or "DEFEAT" (red) in center screen
3. Show stats summary:
   - Score breakdown
   - Resources gathered
   - Units trained/killed
   - Technologies researched
4. "Play Again" and "Main Menu" buttons

`'game:over'` event emitted with `{ winnerId, type }`. `Game.ts` stops the simulation loop.

---

## Files to create/modify

```
src/engine/win/WinConditionSystem.ts  ← Create
src/engine/win/WonderSystem.ts        ← Create
src/engine/player/Player.ts           ← Add eliminated, score, diplomacy
src/engine/renderer/UIRenderer.ts     ← Wonder countdown bar, score display, end screen
src/engine/EventBus.ts                ← 'game:over', 'player:eliminated', 'wonder:built'
src/types/unit.ts                     ← King unit def (regicide mode)
```
