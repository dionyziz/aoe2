# HUD & Panels

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  🍖 200  🪵 200  💰 0  🪨 0  👥 3/10  [Age: Dark]    [FPS]   │  ← HUD bar (36px)
│                                                                   │
│                   [game canvas]                   [minimap]      │
│                                                  180×180px above │
│                                                   the panel      │
│ ┌──────────────────┐ ┌─────────────────────┐ ┌───────────────┐ │
│ │ Portrait / icons  │ │  Unit info / queue  │ │ Action buttons│ │
│ │                  │ │                     │ │  5 × 2 grid   │ │
└─────────────────────────────────────────────────────────────────┘
                                                        ↑ panel (120px)
```

---

## HUD bar (top strip, 36px)

Dark background, full canvas width.

Contents left to right:
- 🍖 Food count
- 🪵 Wood count
- 💰 Gold count
- 🪨 Stone count
- 👥 Population / pop cap (turns red when population = pop cap)
- Age icon (Dark / Feudal / Castle / Imperial)
- FPS counter (right side, dev mode only)

Resource counts display as integers (floor of the float value).
When a resource changes, a floating `+N` / `-N` text animates near the icon and fades over 2 seconds.

---

## Minimap (180×180px)

Positioned: right side, directly above the bottom panel (`canvasHeight - 180 - 120 - 4` from top).

Contents:
- Terrain rendered to an `OffscreenCanvas` (cached; invalidated on map change or fog change)
- Enemy units: shown only in visible tiles (`fogState === 2`)
- Own units: always shown as 2px radius colored dots
- Viewport rectangle: white outline showing the current camera view, clamped to map bounds

The minimap clips its drawing with `ctx.save() / ctx.beginPath() / ctx.rect() / ctx.clip() / ctx.restore()` to prevent the viewport rectangle from bleeding outside the minimap area.

**Click to pan:** left-click on minimap converts the click position to a world tile and calls `camera.centerOnTile(tx, ty)`.

---

## Bottom panel (120px, full width)

### Single unit selected

```
┌──────────┬────────────────────────────────────┬────────────────────┐
│ Portrait │  Name                              │  Action buttons    │
│          │  HP: 40/40                         │  (5 × 2 grid)      │
│  (60×60) │  Attack: 4   Armor: 0/1   Spd: 0.9│                    │
└──────────┴────────────────────────────────────┴────────────────────┘
```

### Single villager selected

Same as above, plus:
- If villager is carrying resources: "Carrying: 12 Wood"
- Action buttons: Stop, Build (opens build menu), Repair

### Single building selected

```
┌──────────────────────────────────────┬────────────────────┐
│  Building Name                       │  Action buttons    │
│  HP bar (color-coded)                │  (train / research │
│  [Train queue: icon icon icon ... ]  │   / garrison)      │
│  Garrison: 3 / 15                    │                    │
└──────────────────────────────────────┴────────────────────┘
```

Train queue shows up to 5 unit icons in a row. The first icon has a circular progress arc drawn over it showing training progress. Right-click on a queued icon to cancel and refund cost.

If `constructionProgress < 1`: shows construction progress bar instead of HP bar.

### Multiple units selected (2–40)

```
┌────────────────────────────────────────────────────────────────┐
│  [icon] [icon] [icon] [icon] [icon] ...  (unit type grid)      │
│  (click icon to select only that unit; Shift+click to deselect)│
└────────────────────────────────────────────────────────────────┘
```

### More than 40 units selected

Show count only: "40+ units selected"

---

## Action buttons (5×2 grid)

Located in the bottom-right of the panel. Each button is 48×48px with a 1px gap.

Button layout indices:
```
[0][1][2][3][4]
[5][6][7][8][9]
```

Buttons show:
- Icon placeholder (colored rectangle until real icons are available)
- Keyboard shortcut letter (bottom-right corner)
- Highlighted border on hover

### Context rules

| Selection | Buttons |
|-----------|---------|
| Villager (normal mode) | Stop (S), Build (B), Repair (R) |
| Villager (build mode page 1) | House (H), Farm (F), Mill (M), Lumber Camp (L), Mining Camp (N), Dock (D), Market (K), → next page (col 4, row 0) |
| Villager (build mode page 2) | Barracks (B), Archery Range (A), Stable (S), Siege Workshop (K), Blacksmith (C), University (U), Monastery (Y), Castle (V), Watch Tower (T), Palisade Wall (P), Stone Wall (W), Gate (G), ← back |
| Military unit | Stop (S), Attack-move (A), Patrol (P), Hold Position (H) |
| Monk | Stop (S), Convert (C), Heal (H) |
| Building (with trainable units) | Train buttons for each trainable unit |
| Building (with research) | Research buttons for available techs |
| Town Center | Train Villager, Advance Age button |
| Building (no actions) | (empty) |

Greyed-out buttons:
- Can't afford the action
- Wrong age requirement
- Population cap reached (train buttons)
- Already researched (tech buttons)

Tooltip on hover (future): shows name, cost, description.

---

## Drag selection rectangle

When the user drags to box-select, a thin light-blue rectangle is drawn in screen space over the game canvas. Updates every frame while dragging.
