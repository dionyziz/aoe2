# Economy

## Villager gather loop

```
1. Player right-clicks a resource tile with villager selected
2. Villager paths to a tile adjacent to the resource
3. On arrival: state → Gathering, animates gather loop
4. Each tick: resource node depletes, unit.carryAmount increases
5. When carryAmount reaches carry capacity:
   → find nearest valid drop-off building
   → path to drop-off
   → state → ReturningResource
6. On arrival adjacent to drop-off:
   → player.add(carryType, carryAmount)
   → carryAmount = 0, carryType = null
   → path back to resource node
   → state → Gathering
7. If resource depleted on return:
   → state → Idle (auto-reassign in future)
```

---

## Resource types and rates

| Resource | Carry Cap | Base Rate | Drop-off buildings |
|----------|-----------|-----------|-------------------|
| Wood | 35 | 25/min | Lumber Camp, TC |
| Food (hunt) | 35 | 40/min | Mill, TC |
| Food (berry) | 35 | 26/min | Mill, TC |
| Food (farm) | 10 | 22/min | Mill, TC |
| Gold | 35 | 30/min | Mining Camp, TC |
| Stone | 35 | 28/min | Mining Camp, TC |

Rates are modified by research (see [Tech Tree spec](tech-tree.md)).

---

## Resource nodes

```typescript
interface ResourceNode {
  id: number;
  type: ResourceType;   // 'wood' | 'food' | 'gold' | 'stone'
  remaining: number;    // depletes as gathered; 0 = exhausted
  tx: number;
  ty: number;
}
```

Starting amounts:
- Forest tile (wood): 100 per tile
- Gold mine: 800
- Stone mine: 350
- Berry bush: 125
- Deer: 140 food
- Boar: 340 food
- Sheep: 100 food

When `remaining <= 0`:
- Node removed from `MapData.resources`
- Tile becomes passable (NavGrid updated)
- Minimap terrain cache invalidated

---

## Farm system

Farms are placed like buildings (build menu, villager constructs it) but function differently:
- Farm produces food over time when a villager is assigned to it (right-click farm with villager)
- Each farm requires exactly one villager
- Villager plays farm animation, standing on the farm tile
- Food generated at 22/min (base), improved by Mill upgrades
- Each farm has `foodRemaining` starting at 250 food (modified by Mill upgrades: +75 / +125 / +125)
- When `foodRemaining <= 0`: farm shows "needs reseeding" indicator
- Auto-reseed: if enabled on the farm, automatically spends 60 wood and resets `foodRemaining`
- Multiple farms can be built; each needs its own assigned villager

Farm upgrades (Mill):
| Tech | Effect on farm food |
|------|---------------------|
| Horse Collar | +75 food per farm |
| Heavy Plow | +125 food per farm |
| Crop Rotation | +125 food per farm |

---

## Drop-off buildings

A villager will path to the nearest building of the correct drop-off type:

| Resource | Valid drop-off |
|----------|---------------|
| Any | Town Center (always valid) |
| Wood | Lumber Camp |
| Food | Mill |
| Gold | Mining Camp |
| Stone | Mining Camp |

If no valid drop-off building exists (e.g. Lumber Camp not built yet), villager paths to TC.

---

## GatherSystem

```typescript
class GatherSystem {
  update(unit: UnitInstance, dt: number, mapData: MapData, buildings: BuildingInstance[], player: Player): void {
    switch (unit.state) {
      case UnitStateId.Gathering:
        this.tickGather(unit, dt, mapData);
        break;
      case UnitStateId.ReturningResource:
        this.tickReturn(unit, dt, buildings, player);
        break;
    }
  }
}
```

---

## Trade (Market)

Once a Market is built, trade carts can be trained and sent to an ally's Market or the player's own distant Market.

Trade cart behavior:
- Path to target market
- On arrival: generate gold proportional to travel distance
- Return home, repeat

Gold per trip = `distance * BASE_TRADE_RATE` (modified by Banking / Guilds / Caravan techs).
Minimum distance: 5 tiles (no gain for adjacent markets).

Not yet implemented — planned for after basic economy.

---

## UI indicators

**Villager carrying resources:**
A small icon appears above the villager's head when `carryAmount > 0`:
- Wood: brown axe
- Food: red meat/wheat
- Gold: yellow coin
- Stone: grey rock

**Resource node tooltip:**
Hovering over a resource tile shows a tooltip with remaining amount.

**HUD resource change indicators:**
When resource totals change, a floating `+N` or `-N` text appears near the resource icon and fades out over 2 seconds. Useful for showing gold gained from trade or tribute.
