# Design System — Age of Web

## Overview

Age of Web uses a cohesive dark-medieval visual language drawn from AoE2's iconic aesthetic, adapted for modern browsers. All visual values are encoded as CSS custom properties in `src/ui/design-tokens.css` and shared across every CSS module.

---

## Visual language

### Palette rationale

The UI communicates "ancient manuscript illuminated by firelight." The core palette layers three levels:

| Role | Value | Rationale |
|------|-------|-----------|
| Background (darkest) | `#0e0a04` | Near-black with warm brown undertone — avoids cold grey |
| Panel backgrounds | `rgba(18,12,4,0.94)` | Semi-transparent so terrain is subtly visible behind panels |
| Panel borders | `#5a4020` (dim) / `#8a6030` (bright) | Oxidized copper / aged wood |
| Gold accent | `#d4aa20` / `#f0cc40` | Primary interactive highlight; all clickable elements glow gold on hover |
| Parchment text | `#e8d890` (primary) / `#b09060` (secondary) / `#706040` (muted) | Three-tier text hierarchy; no pure white |

### Resource colors

Distinct hues prevent confusion even in peripheral vision:

| Resource | Color | Token |
|----------|-------|-------|
| Food | `#d44030` (red-orange) | `--color-food` |
| Wood | `#5a8a2a` (forest green) | `--color-wood` |
| Gold | `#d4aa20` (amber) | `--color-gold-r` |
| Stone | `#a0a0a0` (grey) | `--color-stone` |

### Player colors

Sourced from `spec/gameplay/player.md`. CSS custom properties `--player-0` through `--player-8`:

| Index | Name | Hex |
|-------|------|-----|
| 0 | Gaia / White | `#ffffff` |
| 1 | Blue | `#0055ff` |
| 2 | Red | `#ff0000` |
| 3 | Green | `#00aa00` |
| 4 | Yellow | `#ffdd00` |
| 5 | Teal | `#00aaaa` |
| 6 | Purple | `#aa00aa` |
| 7 | Grey | `#888888` |
| 8 | Orange | `#ff6600` |

---

## Typography

### Font stack

| Variable | Fonts | Use when |
|----------|-------|----------|
| `--font-ui` | Cinzel → Palatino Linotype → Georgia → serif | Section titles, unit names, button labels, age display — anything decorative |
| `--font-body` | Book Antiqua → Palatino Linotype → Georgia → serif | Descriptive text, tooltips, stat labels, settings forms |
| `--font-mono` | Courier New → Courier → monospace | Resource counts, FPS counter, numeric stats requiring tabular alignment |

Cinzel is loaded from Google Fonts (`@import` in `design-tokens.css`). The fallback chain means the UI remains readable if the web font fails to load.

### Type scale

| Token | Size | Usage |
|-------|------|-------|
| `--text-xs` | 10px | Hotkey badges, HP label, tooltip cost lines |
| `--text-sm` | 12px | Resource values, stat rows, settings controls |
| `--text-md` | 14px | Unit names, standard body text |
| `--text-lg` | 17px | Menu button labels, civ name in info panel |
| `--text-xl` | 22px | Primary CTA buttons (Start Game) |
| `--text-2xl` | 30px | Pause / modal headings |
| `--text-title` | 48px | Game title on main menu only |

### Rules
- Minimum rendered size: **11px** (WCAG AA compliance at standard zoom).
- Numbers in HUD (resources, HP) use `font-variant-numeric: tabular-nums` to prevent jitter as values change.

---

## Layout principles

1. **Canvas fills full screen.** The `<canvas>` element sits at `z-index: 0` and expands to `100vw × 100vh`.
2. **HUD overlays with `pointer-events: none`.** The `#hud` root element uses `position: absolute; inset: 0; pointer-events: none`. Only interactive children (buttons, the minimap, the bottom bar) re-enable `pointer-events: auto`. This ensures mouse events fall through to the canvas by default.
3. **HUD never exceeds 20% of screen height.** The top bar is 36px; the bottom bar is 170px. On a 720p display that totals 206px / 720px ≈ 28.6%. Below 900px the action buttons shrink to 40px to meet the target.
4. **Three zones:**
   - *Top bar* — resources (food, wood, gold, stone), population, current age
   - *Bottom bar* — selection panel (left, 240px) + action grid (center, flexible) + minimap (right, floats above bar)
   - *Overlays* — menu screens, tech tree, and tooltips render above the HUD via `z-index` layering

5. **Semi-transparency.** All panels use `rgba()` backgrounds at ~94% opacity so the game world is subtly perceptible behind them — this preserves immersion.

---

## Component inventory

All components live in `src/ui/`.

### HUD components (`hud.css`)

| Component | CSS class(es) | Description |
|-----------|--------------|-------------|
| ResourceDisplay | `.resource-display`, `.resource-icon`, `.resource-value` | Colored 16×16 icon + tabular numeric value; one per resource type |
| ResourceDelta | `.resource-delta.gain` / `.resource-delta.loss` | Floating `+N`/`-N` animation, 2s fade-out |
| PopDisplay | `.pop-display`, `.pop-display.at-cap` | Shows `👥 current / cap`; turns red when at cap |
| AgeDisplay | `.age-display` | Cinzel font, gold color, shows current age name |
| HPBar | `.hp-bar-track`, `.hp-bar-fill.high/.medium/.low` | 6px track; fill color thresholds: >66% green, >33% yellow, ≤33% red |
| ConstructionBar | `.construction-bar-track`, `.construction-bar-fill` | Replaces HP bar while building is under construction |
| UnitPortrait | `.unit-portrait` | 64×64 dark box; `::after` pseudo adds 3px player-color strip at bottom |
| UnitHeader | `.unit-header`, `.unit-info`, `.unit-name`, `.unit-task` | Portrait + name + HP + task/carry text |
| UnitStats | `.unit-stats`, `.stat-item`, `.stat-label` | Flex row of ATK / ARM / LOS / SPD values |
| TrainQueue | `.train-queue`, `.queue-slot`, `.queue-slot.active`, `.queue-progress-bar` | Up to 5 unit-icon slots; first slot shows training progress |
| MultiSelectGrid | `.multi-select-grid`, `.multi-unit-thumb` | 28×28 thumbnails in 8-column grid (for 2–40 units selected) |
| ActionButton | `.action-btn`, `.btn-icon`, `.action-btn .hotkey` | 48×48 dark button with 32×32 icon placeholder and hotkey badge in bottom-right corner |
| Minimap | `#minimap-panel`, `#minimap-canvas`, `.minimap-viewport` | 200×200 canvas; positioned above bottom bar, right edge |
| DragSelectRect | `#drag-select-rect` | Light-blue box drawn during drag-select operations |
| Tooltip | `#hud-tooltip`, `.tooltip-name`, `.tooltip-cost`, `.tooltip-desc` | 300ms hover delay; appears above/below cursor |
| AgeUpBanner | `#age-up-banner` | Centered text banner announcing age advancement; 5s fade |

### Menu components (`menus.css`)

| Component | CSS class(es) | Description |
|-----------|--------------|-------------|
| MenuScreen | `.menu-screen`, `.menu-screen.hidden` | Full-screen dark radial gradient overlay |
| MenuCard | `.menu-card`, `.menu-card.wide` | Semi-transparent panel with bright gold border |
| GameTitle | `.game-title` | 48px Cinzel with gold glow text-shadow |
| GameSubtitle | `.game-subtitle` | Smaller parchment-dim subtitle beneath the title |
| DecoRule | `.menu-divider`, `.menu-divider.bright` | Ornamental horizontal rule |
| MenuButton | `.menu-btn` | Full-width dark button; hover = gold border + glow |
| PrimaryButton | `.menu-btn.primary` | Larger, pre-gilded button for the main CTA |
| CivGrid | `.civ-grid` | 8-column scrollable grid of CivShields |
| CivShield | `.civ-shield`, `.civ-shield.selected`, `.civ-shield-inner` | Shield shape via `border-radius 2px 2px 50% 50%`; selected = gold border |
| CivInfoPanel | `.civ-info-panel`, `.civ-info-name`, `.civ-info-unique-unit`, `.civ-bonus-list` | Scrollable civ details panel |
| SettingsRow | `.settings-row`, `.settings-label`, `.settings-control` | Flex row: label left, control right; styled `<select>` elements |
| PauseOverlay | `#pause-overlay`, `.pause-title` | Semi-transparent black overlay during game pause |
| TechTreeOverlay | `#tech-tree-overlay`, `.tech-tree-inner`, `.tech-column`, `.tech-age-section` | Full-screen scrollable tech tree |
| TechButton | `.tech-btn`, `.tech-btn.researched`, `.tech-btn.available`, `.tech-btn.locked`, `.tech-btn.civ-locked` | Individual researchable technology item |
| VersionTag | `.version-tag` | Fixed bottom-right monospace version string |

---

## Interaction patterns

### Hover states
Every interactive element changes border color to `--color-gold` and adds `--glow-gold` box-shadow on hover. Transitions are `0.1–0.15s ease` to feel responsive but not jarring.

### Keyboard focus
All buttons receive a `2px solid var(--color-gold)` outline on `:focus-visible` (keyboard navigation only, not mouse click).

### Hotkey visibility
Every `ActionButton` displays its keyboard shortcut in the bottom-right corner as a `9–10px` gold-dim badge. This is always visible — no need to hover. Full name, cost, and effect appear in the tooltip after a 300ms delay.

### Disabled states
Disabled buttons use `opacity: 0.35` (or `0.20` for empty slots). The `disabled` class also sets `pointer-events: none` so they don't trigger tooltip calculations.

### Tooltip delay
The HUD tooltip (`#hud-tooltip`) is shown by JS after 300ms hover. It disappears immediately on `mouseleave`. The tooltip repositions to stay within the viewport.

---

## HP bar — accessibility note

The HP bar communicates health through **two independent channels**, making it colorblind-safe:

1. **Width** — the bar shrinks as HP decreases (shape information)
2. **Color** — green (>66%), yellow (>33%), red (≤33%)

Players with protanopia or deuteranopia who cannot distinguish red from green can still read health from the bar width alone. The accompanying numeric label (`96 / 120 HP`) provides a third channel.

---

## Responsive behavior

**Target minimum:** 1280 × 720px. The game canvas always fills available space.

| Breakpoint | Adaptation |
|-----------|------------|
| < 1280px wide | HUD panel width reduces from 240px to 200px; action buttons reduce from 48px to 40px |
| < 900px tall | Bottom bar height reduces to 140px; portraits scale to 52×52px |
| < 720px tall | Bottom bar collapses to icon-only mode (no stat text) |

All HUD dimensions use CSS custom properties so breakpoint overrides only need to redefine token values:

```css
@media (max-width: 1280px) {
  :root {
    --hud-panel-width:     200px;
    --hud-action-btn-size: 40px;
  }
}
```

---

## File structure

```
src/ui/
├── design-tokens.css        ← Single source of all CSS custom properties
├── hud.css                  ← HUD overlay (imports design-tokens.css)
├── menus.css                ← Menu screens and tech tree (imports design-tokens.css)
└── wireframes/
    ├── hud.html             ← Standalone HUD wireframe (CSS inlined)
    ├── main-menu.html       ← Standalone main menu wireframe (CSS inlined)
    ├── game-setup.html      ← Standalone game setup wireframe (CSS inlined)
    └── tech-tree.html       ← Standalone tech tree wireframe (CSS inlined)
```

---

## Design token usage guide

Import `design-tokens.css` at the top of every CSS file:

```css
@import './design-tokens.css';   /* relative to src/ui/ */
```

Never hard-code colors, font stacks, or spacing values in component CSS — always reference a token. If a new value is needed, add it to `design-tokens.css` first with a descriptive name.
