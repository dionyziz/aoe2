# Plan 11 — Combat

**Status:** 📋 Planned
**Depends on:** 04 (pathfinding), 08 (buildings), 09 (Player System — playerId for enemy detection), 10 (economy — unit training)

---

## Attack resolution formula

AoE2 damage formula:
```
damage = max(1, attackDamage + attackBonuses - (armor.melee | armor.pierce))
```

Attack bonuses are per-unit-class multipliers, e.g.:
- Spearman: +15 vs cavalry, +12 vs camel, +9 vs elephant
- Archer: +3 vs spearman
- Teutonic Knight: +4 vs buildings

Armor classes (each unit has a list of armor class memberships):
- Infantry, Archer, Cavalry, Camel, Elephant, Monk, Siege, Ship, Building, Wall
- Each armor class has a melee and pierce armor value

Full armor system:
```typescript
interface ArmorEntry {
  classId: number;   // armor class id (see aoe2 unit class constants)
  value: number;
}

interface AttackBonus {
  classId: number;
  bonus: number;
}

// In UnitDef:
armorClasses: ArmorEntry[];
attackBonuses: AttackBonus[];
```

Phase 1: use flat `melee`/`pierce` armor from `UnitDef.armor`.
Phase 2 (Plan 13): extend with full `armorClasses[]` and `attackBonuses[]` arrays when implementing tech tree upgrades.

---

## Attack-ground command

`A` key + left-click on an empty tile fires projectiles toward that tile (ranged/siege only).
Useful for attacking garrisoned units or hitting a spot without a target unit.

```typescript
// command type: 'attack_ground'
{ type: 'attack_ground'; playerId: number; unitIds: number[]; wx: number; wy: number }
```

---

## Garrison system

Units can garrison inside buildings for protection and faster healing.

Buildings that can garrison:
| Building | Capacity |
|----------|---------|
| Town Center | 15 |
| Castle | 20 |
| Watch/Guard Tower/Keep | 5 |
| Palisade/Stone Gate | 4 |

```typescript
// In BuildingInstance:
garrisonedUnitIds: number[];

// Garrison order (right-click building with units selected):
{ type: 'garrison'; playerId: number; unitIds: number[]; buildingId: number }

// Ungarrison (button in building panel, or Ctrl+click):
{ type: 'ungarrison'; playerId: number; buildingId: number; unitId?: number } // null = all
```

Garrisoned units:
- Removed from world (not visible, not targetable)
- Heal at 1 HP/sec while garrisoned
- TC/Castle population slot still counts against pop cap

Garrison mechanics affecting combat:
- Towers/Castles gain +1 range arrow per garrisoned infantry/archer (up to 5 extra arrows)
- Garrisoned units can be converted by Monks with Redemption tech

---

## Combat state machine

```
Idle
  → right-click enemy unit or building → ChasingEnemy
ChasingEnemy
  → if target within attackRange tiles: stop, face target → Attacking
  → if target dies: → Idle
  → if target moves: recalculate path every 0.5s
Attacking
  → play attack animation
  → at frame N (impact frame): apply damage to target
  → wait attackSpeed seconds between attacks
  → if target dies: emit 'unit:died', → Idle
  → if target moves out of range: → ChasingEnemy
Dead
  → play death animation once
  → after death animation: show corpse for 30s, then remove
```

---

## CombatSystem.ts  (`src/engine/combat/CombatSystem.ts`)

```typescript
class CombatSystem {
  update(
    unit: UnitInstance,
    dt: number,
    allUnits: UnitInstance[],
    buildings: BuildingInstance[],
    navGrid: NavGrid
  ): void {
    if (unit.state === UnitStateId.Attacking) {
      this.tickAttack(unit, dt, allUnits, buildings);
    } else if (unit.state === UnitStateId.ChasingEnemy) {
      this.tickChase(unit, dt, allUnits, buildings, navGrid);
    }
  }

  private tickAttack(unit, dt, allUnits, buildings) {
    unit.attackCooldown -= dt;
    if (unit.attackCooldown > 0) return;

    const target = findTarget(unit, allUnits, buildings);
    if (!target) { unit.state = UnitStateId.Idle; return; }

    const dist = distanceTo(unit, target);
    if (dist > unit.attackRange + 0.5) {
      unit.state = UnitStateId.ChasingEnemy;
      return;
    }

    // Apply damage
    const damage = calcDamage(unit, target);
    target.currentHp -= damage;
    unit.attackCooldown = 1000 / unit.attackSpeed;

    // Face target
    unit.direction = angleToDirection(unit.pos, getTargetPos(target));

    if (target.currentHp <= 0) {
      killTarget(target);  // emit 'unit:died' or 'building:destroyed'
      unit.state = UnitStateId.Idle;
      unit.targetUnitId = null;
    }
  }
}

function calcDamage(attacker: UnitInstance, target: UnitInstance | BuildingInstance): number {
  const def = UNIT_MAP.get(attacker.defId)!;
  const targetDef = UNIT_MAP.get((target as UnitInstance).defId);
  const armor = targetDef
    ? (def.attackType === 'ranged' ? targetDef.armor.pierce : targetDef.armor.melee)
    : 0;
  return Math.max(1, def.attackDamage - armor);
}
```

---

## Projectiles

For ranged units: a projectile travels from attacker to target, damage applied on hit.

```typescript
interface Projectile {
  id: number;
  fromX: number; fromY: number;
  toX: number; toY: number;
  progress: number;   // 0..1
  speed: number;      // tiles/sec
  damage: number;
  attackerId: number;
  targetId: number;
  targetIsBuilding: boolean;
}
```

`ProjectileSystem.update(dt)`:
- Move progress forward by `speed * dt / distanceToTarget`
- When progress >= 1: apply damage to target
- Render: small dot or line, colored by player

Projectile speed by type:
- Arrow: 7 tiles/sec
- Bolt (crossbow): 7 tiles/sec
- Thrown axe: 5.5 tiles/sec
- Cannon ball: 5 tiles/sec
- Trebuchet rock: 3 tiles/sec (large, area damage)

---

## Attack orders

`UnitManager.handleRightClick` extended:
- If target tile has an enemy unit: set `unit.targetUnitId`, state → `ChasingEnemy`
- If target tile has an enemy building: set `unit.targetBuildingId`, state → `ChasingEnemy`
- Cursor changes to sword icon over enemies

---

## Auto-attack (passive)

- When a unit is Idle or Moving, check for enemies within `lineOfSight` range each tick
- If found: interrupt current order, transition to `ChasingEnemy`
- Controlled by stance:
  - Aggressive: always auto-attack
  - Defensive (default): only auto-attack if enemy comes within small radius (3 tiles)
  - Stand Ground: never chase, attack only if enemy is in attack range
  - No Attack: never attack

---

## Death and corpses

On unit death:
- `unit.state = UnitStateId.Dead`
- Play death animation once (not looped)
- After death animation completes: show corpse sprite (last death frame)
- Corpse fades/disappears after 30 seconds
- Unit removed from `UnitManager.units` after corpse removal
- `navGrid` NOT updated on death (infantry corpses don't block movement)

---

## Building attacks

- Towers/Castles/TC auto-attack enemies in range
- Same combat system applies
- Buildings don't move so no chase phase

Range by building:
- Watch Tower: 6 tiles, 5 damage, 1.0 attack speed (pierce)
- Guard Tower: 8 tiles, 6 damage, 1.0 attack speed
- Keep: 8 tiles, 7 damage, 1.0 attack speed
- Castle: 11 tiles, 11 damage, 1.03 attack speed
- Bombard Tower: 9 tiles, 40 damage, 0.2 attack speed

---

## UI changes for combat

### HP bars
- Show HP bar above every unit when they're damaged (hp < maxHp)
- Always show HP bar on selected units
- Color: green > 50%, yellow 25-50%, red < 25%

### Damage numbers (optional, not in original AoE2 but helpful)
- Small floating number at impact point, fades in 0.5s
- Color matches damage type: white=melee, yellow=pierce, orange=siege

### Attack cursor
- Right-click over enemy unit/building: cursor becomes red sword
- Not yet implemented (requires custom cursor CSS)
