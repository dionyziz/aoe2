# Input System

## Pipeline

```
DOM Event → InputManager → EventBus → Subsystem handler
```

`InputManager` owns all canvas DOM listeners. No subsystem touches the DOM directly. All events are translated into typed `EventBus` emissions.

---

## Events emitted

| Event | Payload | Trigger condition |
|-------|---------|-------------------|
| `input:leftClick` | `{ screenX, screenY, pos: WorldPos }` | Mouse button up, drag < 5px threshold |
| `input:rightClick` | `{ screenX, screenY, pos: WorldPos }` | Right mouse button up |
| `input:boxSelect` | `Rect` (screen coords) | Left mouse drag ≥ 5px |
| `input:wheel` | `{ delta, screenX, screenY }` | Scroll wheel |
| `input:middleDragStart` | `{ dx:0, dy:0 }` | Middle button down |
| `input:middleDrag` | `{ dx, dy }` | Middle button held + mouse move |
| `input:middleDragEnd` | `{ dx:0, dy:0 }` | Middle button up |
| `input:mousemove` | `{ screenX, screenY }` | Any mouse move on canvas |
| `input:keydown` | `{ code, ctrl, shift, alt }` | Key pressed |
| `input:keyup` | `{ code }` | Key released |

---

## Click routing (priority order)

When a `input:leftClick` arrives, it is handled by the first matching handler:

1. **Bottom panel action buttons** — if `screenY >= canvasHeight - 120`, route to `UIRenderer.handleClick()`
2. **Building placement active** — if in placement mode, route to `BuildingPlacementSystem.tryPlace()`
3. **Minimap click** — if click inside minimap bounds, route to `camera.centerOnTile()`
4. **Building at tile** — if an owned building is at the clicked tile, `BuildingManager.selectAt()`
5. **Unit under cursor** — `UnitManager` picks the unit nearest to the cursor
6. **Empty ground** — clear all selections

Right-click routing:
1. **Placement mode active** → cancel placement
2. **Unit selected + enemy target** → attack order
3. **Unit selected + resource tile** → gather order (villagers only)
4. **Unit selected + own building (drop-off)** → return resource (villager carrying)
5. **Unit selected + own building (garrison)** → garrison units
6. **Unit selected + ground** → move order

---

## Selection rules

| Action | Result |
|--------|--------|
| Left-click empty ground | Deselect all |
| Left-click own unit | Select that unit only |
| Shift + left-click own unit | Add/remove unit from selection |
| Left-drag | Box-select all own units within the drag rectangle |
| Double-click unit | Select all own units of the same type visible on screen |
| Ctrl+A | Select all own units visible on screen |
| Escape | Clear selection (or cancel placement / close build menu) |

Box-select ignores the bottom 120px panel area and the minimap area.

### Selection priority within a group

If a drag-select contains both military units and villagers, military units take priority (matching AoE2 behavior). The game selects military units only unless the selection contains only villagers.

Monks are treated as military for this purpose.

---

## Keyboard shortcuts

### Camera
| Key | Action |
|-----|--------|
| W / ↑ | Pan north |
| S / ↓ | Pan south |
| A / ← | Pan west |
| D / → | Pan east |
| H | Center on selected units |

### Selection
| Key | Action |
|-----|--------|
| Ctrl+A | Select all visible own units |
| Escape | Clear selection / cancel action |
| Delete | (future) Delete selected units |

### Unit commands
| Key | Action |
|-----|--------|
| S | Stop (all selected) |
| A | Attack-move (then left-click target location) |
| G | Garrison (then left-click building) |
| B | Open build menu (villager selected) |

### Build menu page 1 (economy) — villager selected
| Key | Building |
|-----|---------|
| H | House |
| F | Farm |
| M | Mill |
| L | Lumber Camp |
| N | Mining Camp |
| D | Dock |
| K | Market |
| Tab or → | Switch to page 2 |

### Build menu page 2 (military) — villager selected
| Key | Building |
|-----|---------|
| B | Barracks |
| A | Archery Range |
| S | Stable |
| K | Siege Workshop |
| C | Blacksmith |
| U | University |
| Y | Monastery |
| V | Castle |
| T | Watch Tower |
| P | Palisade Wall |
| W | Stone Wall |
| G | Gate |
| Tab or ← | Switch to page 1 |

### HUD / game
| Key | Action |
|-----|--------|
| F1 | Help overlay |
| Escape | Pause menu |
| Ctrl+Shift+F | Toggle fog of war (debug) |
| Y | Tech tree overlay |
