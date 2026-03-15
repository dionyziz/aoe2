# Win Conditions

## Victory types

| Type | Condition | Default? |
|------|-----------|---------|
| Conquest | Eliminate all enemy players | Yes |
| Wonder Race | Build Wonder, survive 200 game-years | Optional |
| Regicide | Kill the enemy King unit | Optional |
| Score | Highest score at time limit | Optional |

Multiple victory conditions can be active simultaneously. First to satisfy any active condition wins.

---

## Conquest

A player is **eliminated** when they have:
- Zero living units, AND
- Zero standing buildings

Grace period: the player has 30 seconds after their last building is destroyed before elimination triggers. During this time they can re-train from a captured TC (if applicable) or ungarrison units.

```typescript
function checkConquest(players: Player[], units: UnitInstance[], buildings: BuildingInstance[]): number | null {
  for (const player of players) {
    if (player.id === GAIA_ID || player.eliminated) continue;
    const hasUnits = units.some(u => u.playerId === player.id && u.state !== UnitStateId.Dead);
    const hasBuildings = buildings.some(b => b.playerId === player.id);
    if (!hasUnits && !hasBuildings) {
      if (!player.eliminationGraceStart) {
        player.eliminationGraceStart = currentTick;
      } else if (currentTick - player.eliminationGraceStart >= GRACE_TICKS) {
        player.eliminated = true;
      }
    } else {
      player.eliminationGraceStart = null;  // reset grace if they retrain
    }
  }
  const remaining = players.filter(p => p.id !== GAIA_ID && !p.eliminated);
  return remaining.length === 1 ? remaining[0].id : null;
}
```

In team games: a team wins when all players on all enemy teams are eliminated.

---

## Wonder Race

The Wonder is a 4×4 building costing 1000 wood, 1000 stone, 1000 gold (most expensive in the game). Requires Imperial Age.

Once a Wonder completes construction:
1. A countdown timer starts (200 game-years)
2. The opponent receives a notification: "The [CivName] have built a Wonder! Destroy it or lose the game!"
3. A red countdown bar appears at the top of the screen for all players
4. If the Wonder survives until the timer reaches 0 → builder wins
5. If the Wonder is destroyed → timer stops and is removed

200 game-years to real-time conversion:
```
GAME_YEAR_MS = 60000ms (1 minute real-time per game year at Normal speed)
WONDER_DURATION_MS = 200 * GAME_YEAR_MS = 200 minutes at Normal speed
```

(This is intentionally very long; players are expected to destroy the Wonder, not wait it out.)

---

## Regicide

Each player starts with one **King** unit placed in their starting Town Center.

King stats:
- HP: 75
- Speed: 0.8 tiles/s
- Attack: 0 (cannot attack)
- Armor: 0/0
- Population cost: 1

If the King is killed → that player is immediately eliminated (no grace period).
The King does not respawn.

In Regicide mode, players typically garrison their King in a Castle or Town Center and play more defensively.

---

## Score

Score accumulates throughout the game from:
- **Military** (25% weight): units trained × cost, enemy units killed
- **Economy** (30%): total resources gathered
- **Technology** (25%): technologies researched, age reached
- **Society** (20%): population maintained over time, wonders built

Score is displayed in the HUD (top-right, next to FPS in dev mode).

When the time limit expires, the player with the highest score wins.
In team games: the average score of living team members is used.

---

## Win/loss screen

When `game:over` is emitted:
1. Simulation loop stops
2. Fade-to-black overlay over 1 second
3. Center screen: "VICTORY" (gold text) or "DEFEAT" (red text)
4. Stats summary:
   - Score breakdown by category
   - Total resources gathered
   - Units trained / units killed
   - Technologies researched
   - Elapsed game time
5. Buttons: "Play Again", "Main Menu"

---

## WinConditionSystem

```typescript
class WinConditionSystem {
  private activeConditions: VictoryType[];

  check(snapshot: GameStateSnapshot): WinResult | null {
    for (const cond of this.activeConditions) {
      // ... check each condition
    }
    return null;  // game continues
  }
}

interface WinResult {
  type: VictoryType;
  winnerId: number;       // -1 for draw (score tie, both teams eliminated)
  loserIds: number[];
}
```

`WinConditionSystem.check()` runs every simulation tick.

---

## Diplomacy

Diplomacy state between player pairs is managed by `PlayerManager`:

```typescript
type DiplomacyState = 'ally' | 'neutral' | 'enemy';
```

Effect of diplomacy:
- **Ally**: share LOS, can't accidentally attack, trigger allied victory together
- **Neutral**: can't attack directly (not yet implemented in UI)
- **Enemy**: all units auto-attack, buildings auto-target

Diplomacy changes require consent from both parties in 1v1; in team games, teams are fixed at game start.
