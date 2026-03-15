# AI Opponent

## Architecture

The AI runs in the main simulation thread. It executes at **2 Hz** (every 500ms) to avoid CPU spikes. Each AI player has one `AIController` instance.

AI issues orders through `CommandSystem.submit()` — identical to how the human player issues commands. This ensures AI decisions are reproducible and multiplayer-compatible.

---

## Difficulty levels

| Difficulty | Max villagers | Age-up timing | First attack | Resource trickle |
|------------|--------------|---------------|-------------|-----------------|
| Easiest | 15 | ~20 min | Never | — |
| Standard | 22 | ~12 min | ~15 min | — |
| Hard | 30 | ~9 min | ~10 min | 50/resource/min |
| Hardest | 40 | ~7 min | ~8 min | 200/resource/min |

Hard and Hardest also start with doubled starting resources.

---

## FSM phases

```
dark_age_economy
  → Villagers: 40% food, 35% wood, 15% gold, 10% stone
  → Build houses as pop approaches cap
  → TC trains villagers continuously
  → Transition: food >= 500 AND pop >= 18

feudal_age_up
  → Queue Feudal Age research at TC
  → Queue Barracks + Archery Range construction
  → Continue economy during age-up
  → Transition: currentAge === 'feudal'

feudal_economy
  → Build Barracks, Archery Range if not built
  → Continue villagers to 28 pop
  → Train archers + spearmen
  → Transition: militaryCount >= 8 AND food >= 800

castle_age_up
  → Queue Castle Age research at TC
  → Transition: currentAge === 'castle'

castle_military
  → Build Stable (x2)
  → Build Siege Workshop
  → Train knights + mangonels
  → Transition: militaryCount >= 15

attack
  → Issue move-attack orders toward enemy TC
  → Siege: target nearest building
  → Melee/Ranged: attack-move toward enemy TC position
  → If all military dead: back to castle_military
```

---

## Build order (Standard)

| Step | Action |
|------|--------|
| 1 | 4 villagers → food (berries/sheep near TC) |
| 2 | 2 villagers → build Lumber Camp, then gather wood |
| 3 | Train villagers until 14 pop |
| 4 | 2 villagers → Mining Camp + gold |
| 5 | Build houses when pop approaching cap |
| 6 | Age up to Feudal at 500 food |
| 7 | Build Barracks + Archery Range |
| 8 | Train 4 archers |
| 9 | Age up to Castle at 800f+200g |
| 10 | Build 2 Stables |
| 11 | Train knights; accumulate 15 military |
| 12 | Attack |

---

## Villager allocation

```typescript
function getTargetRatios(phase: AIPhase, resources: ResourceCounts): ResourceTargets {
  // Adjusts ratios based on what's currently needed
  if (resources.food < 300)  → increase food ratio
  if (resources.wood < 200)  → increase wood ratio
  if (needsGold)             → increase gold ratio
  return { food: 0.40, wood: 0.35, gold: 0.15, stone: 0.10 };
}
```

Idle villagers are reassigned each AI think cycle to the nearest resource node of the target type.

---

## Scouting

One Scout Cavalry (or Eagle Scout for Mesoamerican civs) is sent out at game start to explore the map. It follows a spiral path from the base. When the enemy TC is found, `knownEnemyTC` is recorded and used for attack pathfinding.

---

## Files

```
src/engine/ai/AIController.ts      — Main brain, FSM phases
src/engine/ai/AIBuildOrder.ts      — Build order tables, construction queue
src/engine/ai/AIResourceManager.ts — Villager allocation
src/engine/ai/AICombatManager.ts   — Attack/retreat decisions
src/engine/ai/AIScouting.ts        — Exploration, enemy tracking
```
