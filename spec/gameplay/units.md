# Units

## UnitInstance state

```typescript
interface UnitInstance {
  id: number;
  defId: string;                // key into UNIT_MAP
  playerId: number;
  pos: WorldPos;                // current world position (float tile coords)
  prevPos: WorldPos;            // position at start of last tick (for render lerp)
  path: TileCoord[];            // current A* path
  pathIndex: number;            // which path tile we're heading toward
  state: UnitStateId;
  currentHp: number;
  direction: number;            // 0=S, 1=SW, 2=W, 3=NW, 4=N, 5=NE, 6=E, 7=SE
  animFrame: number;
  animTimer: number;
  selected: boolean;
  targetUnitId: number | null;
  targetBuildingId: number | null;
  attackCooldown: number;       // ms remaining until next attack
  // Economy fields
  carryType: ResourceType | null;
  carryAmount: number;
  gatherTargetId: number | null;
  dropOffTargetId: number | null;
}
```

---

## Unit states

```typescript
enum UnitStateId {
  Idle              = 'idle',
  Moving            = 'moving',
  Attacking         = 'attacking',
  ChasingEnemy      = 'chasing_enemy',
  Gathering         = 'gathering',
  ReturningResource = 'returning_resource',
  Farming           = 'farming',
  Building          = 'building',       // constructing a building
  Repairing         = 'repairing',
  Converting        = 'converting',     // monk converting enemy unit
  Dead              = 'dead',
}
```

### State transitions

```
Idle
  ──right-click ground──────────────────── Moving
  ──right-click enemy unit/building──────── ChasingEnemy
  ──right-click resource (villager only)─── Moving → Gathering
  ──right-click drop-off building (carrying)→ ReturningResource
  ──right-click own building (non-garrison)─ Moving → Building
  ──auto-attack enemy in LOS─────────────── ChasingEnemy (if stance allows)

Moving
  ──path complete──────── Idle
  ──attack-move, enemy found─── ChasingEnemy

ChasingEnemy
  ──target in range──────── Attacking
  ──target dies──────────── Idle
  ──target moves─────────── re-path every 500ms

Attacking
  ──target dies──────────── Idle
  ──target out of range───── ChasingEnemy
  ──attack cooldown ticking─ (stay in Attacking)

Gathering
  ──carry full──────────────── ReturningResource → path to drop-off
  ──resource depleted────────── Idle

ReturningResource
  ──adjacent to drop-off────── DropOff → resources added, path back to resource

Dead
  ──death animation done──── (stay Dead, show corpse for 30s, then removed)
```

---

## Unit classes

| Class | Description |
|-------|-------------|
| `infantry` | Foot melee units. Slow to medium speed, moderate HP. |
| `archer` | Foot ranged units. Fast attack rate, low HP. |
| `cavalry` | Mounted melee/ranged. Fast movement, higher HP. |
| `siege` | Slow, high damage. Some have AoE. Must unpack to fire (Trebuchet). |
| `villager` | Economic unit. Gathers resources, constructs buildings. |
| `monk` | No attack. Can convert enemy units. Heals with relic. |
| `ship` | Naval unit. Only passable on water tiles. |

---

## Combat stances

Each unit has a combat stance that controls auto-attack behavior:

| Stance | Auto-attack if enemy approaches? | Chases? |
|--------|----------------------------------|---------|
| Aggressive | Yes (full LOS range) | Yes |
| Defensive (default) | Yes (if within 3 tiles) | No (returns to position) |
| Stand Ground | Yes (if within attack range only) | No |
| No Attack | Never | No |

Stance is changed via action buttons in the selection panel.

---

## Animation states

Each unit class has these animation sets:

| State | Infantry | Archer | Cavalry | Villager | Siege | Monk |
|-------|----------|--------|---------|----------|-------|------|
| Idle | stand | stand | stand | stand | stand | stand |
| Moving | walk | walk | walk | walk | move | walk |
| Attacking | attack | attack | attack | attack | fire | convert |
| Gathering | — | — | — | gather_{wood/food/gold/stone} | — | — |
| Building | — | — | — | build | — | — |
| Dying | die | die | die | die | die | die |

All animations have 8 directions (S, SW, W, NW, N, NE, E, SE).
Until real sprites are available, units are drawn as colored ellipses with a class-letter label.

---

## Death and corpses

1. Unit HP drops to 0 → `state = Dead`
2. Death animation plays once (not looped)
3. After animation: show corpse (last death animation frame) for 30 seconds
4. After 30s: unit removed from `UnitManager.units`
5. NavGrid is **not** updated on death — corpses don't block movement

---

## Garrisoning

Units can enter buildings with `garrisonCapacity > 0`.

While garrisoned:
- Unit is removed from world (not drawn, not targetable)
- HP regenerates at 1 HP/second
- Population still counted against pop cap

Towers and Castles gain +1 range arrow per garrisoned infantry/archer (up to +5).

---

## Selection panel display

**Single unit selected:**
- Portrait (colored ellipse placeholder)
- Name, HP/maxHP
- Attack, armor, speed stats
- Stance buttons (if military)

**Multiple units selected (2-40):**
- Grid of unit icons (up to 40, grouped by type)
- Click icon to select only that unit
- HP bar not shown for multi-select

**Single building selected:** see [Buildings spec](buildings.md).
