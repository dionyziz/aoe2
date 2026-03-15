import type { MouseState } from '../input/MouseState';
import type { UnitInstance } from '../../types/unit';
import type { BuildingInstance } from '../../types/building';
import type { HUD } from '../ui/HUD';
import type { Minimap } from '../ui/Minimap';
import type { Camera } from '../camera/Camera';
import type { ResourceCounts } from '../../types/resource';
import { UNIT_MAP } from '../../data/units/index';
import { BUILDING_MAP } from '../../data/buildings/index';

export interface ActionButton {
  id: string;
  label: string;
  key: string;
  col: number; // 0-4
  row: number; // 0-1
  enabled: boolean;
}

export class UIRenderer {
  // Track which button is hovered for highlight
  private hoveredAction: string | null = null;
  // Build submenu open?
  private buildMenuOpen = false;
  // Callbacks set by Game
  onActionClick?: (actionId: string) => void;
  onBuildingSelect?: (defId: string) => void;

  private getActionButtons(
    selectedUnits: UnitInstance[],
    selectedBuilding: BuildingInstance | null
  ): ActionButton[] {
    if (selectedBuilding) {
      const def = BUILDING_MAP.get(selectedBuilding.defId);
      if (!def || def.trainableUnitIds.length === 0) return [];
      return def.trainableUnitIds.slice(0, 10).map((uid, i) => {
        const udef = UNIT_MAP.get(uid);
        return {
          id: `train:${uid}`,
          label: udef ? udef.name.split(' ').map((w: string) => w[0]).join('') : uid.slice(0, 3).toUpperCase(),
          key: '',
          col: i % 5,
          row: Math.floor(i / 5),
          enabled: true,
        };
      });
    }
    if (selectedUnits.length === 0) return [];

    const unit = selectedUnits[0];
    const def = UNIT_MAP.get(unit.defId);
    const unitClass = def?.class ?? 'infantry';

    const buttons: ActionButton[] = [];

    if (unitClass === 'villager') {
      if (this.buildMenuOpen) {
        // Build submenu
        const buildableIds = ['house','barracks','archery_range','stable','mill','mining_camp','lumber_camp','farm','watch_tower','palisade_wall','market','blacksmith','monastery','dock','university','siege_workshop'];
        buildableIds.slice(0, 10).forEach((bid, i) => {
          const bdef = BUILDING_MAP.get(bid);
          buttons.push({ id: `build:${bid}`, label: bdef?.name.slice(0, 4) ?? bid, key: '', col: i % 5, row: Math.floor(i / 5), enabled: true });
        });
        buttons.push({ id: 'build_cancel', label: '<', key: 'Escape', col: 4, row: 1, enabled: true });
      } else {
        buttons.push({ id: 'stop',   label: 'Stop',   key: 'S', col: 0, row: 0, enabled: true });
        buttons.push({ id: 'build',  label: 'Build',  key: 'B', col: 1, row: 0, enabled: true });
        buttons.push({ id: 'repair', label: 'Repair', key: 'T', col: 2, row: 0, enabled: true });
      }
    } else {
      buttons.push({ id: 'stop',   label: 'Stop',   key: 'S', col: 0, row: 0, enabled: true });
      buttons.push({ id: 'attack', label: 'Attack', key: 'A', col: 1, row: 0, enabled: true });
      buttons.push({ id: 'patrol', label: 'Patrol', key: 'P', col: 2, row: 0, enabled: true });
      buttons.push({ id: 'hold',   label: 'Hold',   key: 'H', col: 3, row: 0, enabled: true });
    }

    return buttons;
  }

  openBuildMenu(): void { this.buildMenuOpen = true; }
  closeBuildMenu(): void { this.buildMenuOpen = false; }
  isBuildMenuOpen(): boolean { return this.buildMenuOpen; }

  handleClick(
    sx: number,
    sy: number,
    canvasWidth: number,
    canvasHeight: number,
    selectedUnits: UnitInstance[],
    selectedBuilding: BuildingInstance | null
  ): string | null {
    const PANEL_H = 120;
    const BTN_SIZE = 48;
    const BTN_GAP = 4;
    const ACTIONS_X = canvasWidth - (BTN_SIZE + BTN_GAP) * 5 - 10;
    const ACTIONS_Y = canvasHeight - PANEL_H + 8;

    if (sy < canvasHeight - PANEL_H) return null;

    const buttons = this.getActionButtons(selectedUnits, selectedBuilding);
    for (const btn of buttons) {
      const bx = ACTIONS_X + btn.col * (BTN_SIZE + BTN_GAP);
      const by = ACTIONS_Y + btn.row * (BTN_SIZE + BTN_GAP);
      if (sx >= bx && sx <= bx + BTN_SIZE && sy >= by && sy <= by + BTN_SIZE) {
        return btn.id;
      }
    }
    return null;
  }

  updateHover(
    sx: number,
    sy: number,
    canvasWidth: number,
    canvasHeight: number,
    selectedUnits: UnitInstance[],
    selectedBuilding: BuildingInstance | null
  ): void {
    const PANEL_H = 120;
    const BTN_SIZE = 48;
    const BTN_GAP = 4;
    const ACTIONS_X = canvasWidth - (BTN_SIZE + BTN_GAP) * 5 - 10;
    const ACTIONS_Y = canvasHeight - PANEL_H + 8;

    this.hoveredAction = null;
    if (sy < canvasHeight - PANEL_H) return;

    const buttons = this.getActionButtons(selectedUnits, selectedBuilding);
    for (const btn of buttons) {
      const bx = ACTIONS_X + btn.col * (BTN_SIZE + BTN_GAP);
      const by = ACTIONS_Y + btn.row * (BTN_SIZE + BTN_GAP);
      if (sx >= bx && sx <= bx + BTN_SIZE && sy >= by && sy <= by + BTN_SIZE) {
        this.hoveredAction = btn.id;
        break;
      }
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    mouse: MouseState,
    selectedUnits: UnitInstance[],
    selectedBuilding: BuildingInstance | null,
    allUnits: UnitInstance[],
    fps: number,
    canvasWidth: number,
    canvasHeight: number,
    hud: HUD,
    minimap: Minimap,
    camera: Camera,
    resources: ResourceCounts,
    population: number,
    popCap: number
  ): void {
    // [1] HUD bar
    hud.render(ctx, resources, population, popCap, canvasWidth);

    // [2] Drag selection box
    if (mouse.isDragging && mouse.isLeftDown) {
      const rect = mouse.dragRect;
      ctx.strokeStyle = '#00cc00';
      ctx.lineWidth = 1;
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      ctx.fillStyle = 'rgba(0,200,0,0.05)';
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    }

    // [3] FPS
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(canvasWidth - 80, 40, 70, 24);
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${fps} FPS`, canvasWidth - 14, 58);
    ctx.textAlign = 'left';

    // [4] Bottom panel
    const PANEL_H = 120;
    ctx.fillStyle = 'rgba(20,15,5,0.92)';
    ctx.fillRect(0, canvasHeight - PANEL_H, canvasWidth, PANEL_H);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, canvasHeight - PANEL_H, canvasWidth, PANEL_H);

    if (selectedUnits.length === 1 && !selectedBuilding) {
      this.renderSingleUnit(ctx, selectedUnits[0], canvasWidth, canvasHeight, PANEL_H);
    } else if (selectedBuilding && selectedUnits.length === 0) {
      this.renderSingleBuilding(ctx, selectedBuilding, canvasWidth, canvasHeight, PANEL_H);
    } else if (selectedUnits.length > 1) {
      this.renderMultiSelect(ctx, selectedUnits, canvasWidth, canvasHeight, PANEL_H);
    }

    // [5] Action buttons
    this.renderActionButtons(ctx, selectedUnits, selectedBuilding, canvasWidth, canvasHeight, PANEL_H);

    // [6] Minimap
    minimap.render(ctx, camera, allUnits, canvasWidth, canvasHeight);
  }

  private renderSingleUnit(ctx: CanvasRenderingContext2D, unit: UnitInstance, cw: number, ch: number, ph: number): void {
    const def = UNIT_MAP.get(unit.defId);
    const PLAYER_COLORS: Record<number, string> = { 1: '#4169E1', 2: '#DC143C', 0: '#888' };

    // Portrait box
    const px = 8, py = ch - ph + 8, pw = 80, pheight = ph - 16;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(px, py, pw, pheight);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, pw, pheight);

    // Unit shape in portrait
    const cx2 = px + pw / 2, cy2 = py + pheight / 2;
    ctx.fillStyle = PLAYER_COLORS[unit.playerId] ?? '#888';
    ctx.beginPath();
    ctx.ellipse(cx2, cy2, 18, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Class letter
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    const classLetters: Record<string, string> = {
      infantry: 'I', archer: 'A', cavalry: 'C', siege: 'S', villager: 'V', monk: 'M', ship: 'N'
    };
    ctx.fillText(classLetters[def?.class ?? 'infantry'] ?? '?', cx2, cy2 + 6);
    ctx.textAlign = 'left';

    // Info
    const ix = px + pw + 12, iy = ch - ph + 14;
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(def?.name ?? unit.defId, ix, iy);

    // HP bar
    const hpFrac = Math.max(0, unit.currentHp / (def?.hp ?? 40));
    const barW = 160, barH = 10;
    const barY = iy + 8;
    ctx.fillStyle = '#333';
    ctx.fillRect(ix, barY, barW, barH);
    ctx.fillStyle = hpFrac > 0.5 ? '#44cc44' : hpFrac > 0.25 ? '#cccc00' : '#cc2222';
    ctx.fillRect(ix, barY, barW * hpFrac, barH);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.strokeRect(ix, barY, barW, barH);

    ctx.fillStyle = '#ccc';
    ctx.font = '12px sans-serif';
    ctx.fillText(`HP: ${unit.currentHp} / ${def?.hp ?? '?'}`, ix, barY + barH + 14);

    if (def) {
      ctx.fillText(`Atk: ${def.attackDamage}  Arm: ${def.armor.melee}/${def.armor.pierce}  Spd: ${def.speed.toFixed(2)}`, ix, barY + barH + 30);
      ctx.fillText(`State: ${unit.state}`, ix, barY + barH + 46);
    }
  }

  private renderSingleBuilding(ctx: CanvasRenderingContext2D, building: BuildingInstance, cw: number, ch: number, ph: number): void {
    const def = BUILDING_MAP.get(building.defId);

    // Portrait box
    const px = 8, py = ch - ph + 8, pw = 80, pheight = ph - 16;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(px, py, pw, pheight);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, pw, pheight);

    // Building icon (simple box)
    ctx.fillStyle = '#2255cc';
    ctx.fillRect(px + 10, py + 15, pw - 20, pheight - 30);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(def?.name.slice(0, 4) ?? '?', px + pw / 2, py + pheight / 2 + 4);
    ctx.textAlign = 'left';

    // Info
    const ix = px + pw + 12, iy = ch - ph + 14;
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(def?.name ?? building.defId, ix, iy);

    // HP bar
    const hpFrac = building.currentHp / building.maxHp;
    const barW = 160, barH = 10;
    const barY = iy + 8;
    ctx.fillStyle = '#333';
    ctx.fillRect(ix, barY, barW, barH);
    ctx.fillStyle = hpFrac > 0.5 ? '#44cc44' : hpFrac > 0.25 ? '#cccc00' : '#cc2222';
    ctx.fillRect(ix, barY, barW * hpFrac, barH);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.strokeRect(ix, barY, barW, barH);

    ctx.fillStyle = '#ccc';
    ctx.font = '12px sans-serif';
    ctx.fillText(`HP: ${building.currentHp} / ${building.maxHp}`, ix, barY + barH + 14);
    if (def) {
      ctx.fillText(`Size: ${def.size}x${def.size}`, ix, barY + barH + 30);
    }
  }

  private renderMultiSelect(ctx: CanvasRenderingContext2D, units: UnitInstance[], cw: number, ch: number, ph: number): void {
    const ICON_SIZE = 44, GAP = 4, MAX = 18;
    const startX = 8, startY = ch - ph + 8;

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`${units.length} units selected`, startX, startY - 2 + (ph / 2 - 22));

    const display = units.slice(0, MAX);
    display.forEach((unit, i) => {
      const col = i % 9, row = Math.floor(i / 9);
      const x = startX + col * (ICON_SIZE + GAP);
      const y = startY + row * (ICON_SIZE + GAP);
      const def = UNIT_MAP.get(unit.defId);
      const PLAYER_COLORS: Record<number, string> = { 1: '#4169E1', 2: '#DC143C', 0: '#888' };

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(x, y, ICON_SIZE, ICON_SIZE);
      ctx.strokeStyle = unit.selected ? '#ffff00' : '#8B6914';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, ICON_SIZE, ICON_SIZE);

      ctx.fillStyle = PLAYER_COLORS[unit.playerId] ?? '#888';
      ctx.beginPath();
      ctx.ellipse(x + ICON_SIZE / 2, y + ICON_SIZE / 2, 12, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // HP sliver at bottom
      const hpFrac = unit.currentHp / (def?.hp ?? 40);
      ctx.fillStyle = hpFrac > 0.5 ? '#44cc44' : '#cc2222';
      ctx.fillRect(x + 2, y + ICON_SIZE - 5, (ICON_SIZE - 4) * hpFrac, 3);
    });
  }

  private renderActionButtons(
    ctx: CanvasRenderingContext2D,
    selectedUnits: UnitInstance[],
    selectedBuilding: BuildingInstance | null,
    cw: number,
    ch: number,
    ph: number
  ): void {
    const BTN_SIZE = 48, BTN_GAP = 4;
    const ACTIONS_X = cw - (BTN_SIZE + BTN_GAP) * 5 - 10;
    const ACTIONS_Y = ch - ph + 8;
    const MINIMAP_W = 200; // avoid minimap
    if (ACTIONS_X < MINIMAP_W) return;

    const buttons = this.getActionButtons(selectedUnits, selectedBuilding);

    for (const btn of buttons) {
      const bx = ACTIONS_X + btn.col * (BTN_SIZE + BTN_GAP);
      const by = ACTIONS_Y + btn.row * (BTN_SIZE + BTN_GAP);
      const hovered = this.hoveredAction === btn.id;

      ctx.fillStyle = hovered ? 'rgba(180,140,40,0.9)' : 'rgba(60,45,15,0.9)';
      ctx.fillRect(bx, by, BTN_SIZE, BTN_SIZE);
      ctx.strokeStyle = hovered ? '#ffdd44' : '#8B6914';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, by, BTN_SIZE, BTN_SIZE);

      ctx.fillStyle = btn.enabled ? '#ffd700' : '#888';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';

      // Wrap label if needed
      const words = btn.label.split(' ');
      if (words.length > 1 && btn.label.length > 7) {
        ctx.fillText(words[0], bx + BTN_SIZE / 2, by + BTN_SIZE / 2 - 4);
        ctx.fillText(words.slice(1).join(' '), bx + BTN_SIZE / 2, by + BTN_SIZE / 2 + 10);
      } else {
        ctx.fillText(btn.label, bx + BTN_SIZE / 2, by + BTN_SIZE / 2 + 4);
      }

      // Keyboard shortcut hint
      if (btn.key) {
        ctx.fillStyle = '#aaa';
        ctx.font = '9px sans-serif';
        ctx.fillText(btn.key, bx + BTN_SIZE - 10, by + BTN_SIZE - 4);
      }

      ctx.textAlign = 'left';
    }
  }
}
