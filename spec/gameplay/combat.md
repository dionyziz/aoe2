# Combat

## Damage formula

```
damage = max(1, attackDamage + sum(attackBonuses) - armor)
```

`armor` is `armor.melee` or `armor.pierce` depending on the attacker's `attackType`.

The minimum of 1 ensures attacks always deal at least 1 damage.

### Attack bonuses

Attack bonuses are applied when the defender belongs to a specific armor class:

| Attacker | Bonus | Target class |
|----------|-------|-------------|
| Spearman line | +15 | Cavalry |
| Spearman line | +12 | Camel |
| Spearman line | +9 | Elephant |
| Archer | +3 | Spearman |
| Teutonic Knight | +4 | Buildings |
| Mangonel line | +8 | Infantry, Archer |
| Trebuchet | +200 | Buildings |
| Petard | +500 | Buildings, Walls |

Phase 1 uses only flat `armor.melee` / `armor.pierce` from `UnitDef`. Full `armorClasses[]` + `attackBonuses[]` arrays are added when implementing tech upgrades (Plan 13).

### Siege AoE

Mangonel, Onager, Siege Onager, and Scorpion deal damage in an area around impact:
- Mangonel: radius 0.5 tiles
- Onager: radius 1.0 tile
- Siege Onager: radius 1.5 tiles
- Scorpion: pierces in a line (first unit hit takes full damage; subsequent units take reduced damage)

---

## Combat state machine

```
Idle / Moving
  └─ right-click enemy unit ─────── ChasingEnemy
  └─ right-click enemy building ──── ChasingEnemy
  └─ auto-attack (if stance allows) ─ ChasingEnemy

ChasingEnemy
  └─ target within attackRange ────── Attacking
  └─ target dies ──────────────────── Idle
  └─ target moves ─────────────────── re-path every 500ms

Attacking
  └─ attackCooldown ticking ─────── (stay)
  └─ attackCooldown = 0, target in range ── apply damage, reset cooldown
  └─ attackCooldown = 0, target out of range ── ChasingEnemy
  └─ target dies ──────────────────── Idle

Dead
  └─ play death animation once ─── corpse shown for 30s ── removed
```

---

## Attack execution

```typescript
tickAttack(unit: UnitInstance, dt: number): void {
  unit.attackCooldown -= dt;
  if (unit.attackCooldown > 0) return;

  const target = findTarget(unit);  // re-find each attack cycle
  if (!target) { unit.state = UnitStateId.Idle; return; }

  const dist = distance(unit.pos, getTargetPos(target));
  if (dist > getDef(unit).attackRange + 0.5) {
    unit.state = UnitStateId.ChasingEnemy;
    return;
  }

  unit.direction = angleToDirection(unit.pos, getTargetPos(target));

  if (getDef(unit).attackType === 'ranged') {
    spawnProjectile(unit, target);  // damage applied on projectile arrival
  } else {
    applyDamage(unit, target);      // immediate damage
  }

  unit.attackCooldown = 1000 / getDef(unit).attackSpeed;  // ms
}
```

---

## Projectiles

For ranged units, damage is applied when the projectile reaches its target, not when fired.

```typescript
interface Projectile {
  id: number;
  fromX: number; fromY: number;   // world coords
  toX: number;   toY: number;
  progress: number;               // 0..1
  speed: number;                  // tiles/second
  damage: number;
  attackerId: number;
  targetId: number;
  targetIsBuilding: boolean;
}
```

Projectile speeds:
| Projectile | Speed (tiles/s) |
|------------|----------------|
| Arrow | 7 |
| Bolt (crossbow) | 7 |
| Thrown axe | 5.5 |
| Hand cannon | 5 |
| Cannon ball | 5 |
| Trebuchet rock | 3 |

On hit (`progress >= 1`): damage applied to target (which may have moved — projectile follows).
Rendering: small dot or line segment, colored by player.

---

## Combat stances

| Stance | Auto-attack at full LOS? | Chases attacker? | Returns to position? |
|--------|--------------------------|------------------|---------------------|
| Aggressive | Yes | Yes | No |
| Defensive (default) | If within 3 tiles | No | Yes |
| Stand Ground | If within attack range | No | No |
| No Attack | Never | No | — |

---

## Auto-attack (passive)

Each tick, idle and moving units scan for enemies within `lineOfSight` tiles:
- If stance is Aggressive: attack any enemy found
- If Defensive: attack enemies within 3 tiles of current position
- If Stand Ground: attack enemies within `attackRange` only
- If No Attack: ignore all enemies

---

## Attack-ground

`A` key + left-click on an empty tile:
- Ranged and siege units fire projectiles toward that tile
- Useful for hitting a cluster of units, or damaging units inside a building
- Command type: `{ type: 'attack_ground', playerId, unitIds, wx, wy }`

---

## Building combat

Towers, Castles, and Town Centers auto-attack nearby enemies using the same combat system.
Buildings cannot chase (no move state) — if the target moves out of range, they stop attacking.

| Building | Attack | Range | Attack Speed | Atk Type |
|----------|--------|-------|-------------|---------|
| Watch Tower | 5 | 6 | 1.0/s | pierce |
| Guard Tower | 6 | 8 | 1.0/s | pierce |
| Keep | 7 | 8 | 1.0/s | pierce |
| Bombard Tower | 40 | 9 | 0.2/s | siege |
| Castle | 11 | 11 | ~1.0/s | pierce |
| Town Center | 5 | 6 | 1.0/s | pierce |

Castle gains extra arrows per garrisoned infantry/archer (up to +5 at 1/arrow).

---

## Garrison in combat

Right-click on an allied building with garrison capacity to garrison selected units:
- Units teleport inside the building (removed from world)
- They heal at 1 HP/s while garrisoned
- Right-click to ungarrison (all units exit at nearest spawn tile)

Towers fire additional arrows equal to their garrison count (up to 5 extra).

---

## HP bars

HP bars are shown:
- Always for selected units/buildings
- For any unit/building with `currentHp < maxHp` (damaged)

Color thresholds (based on `currentHp / maxHp`):
- > 0.50: green
- 0.25–0.50: yellow
- < 0.25: red
