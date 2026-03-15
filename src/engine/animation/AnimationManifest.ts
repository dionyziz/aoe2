/**
 * Generates the complete animation manifest for all standard units.
 * This is used both to populate units.json (via build script) and at
 * runtime to register animations with AnimationSystem.
 */
import type { AnimationDef } from '../../types/animation';
import { buildFrameKeys } from './AnimationDef';

const FRAME_STUB = { frame: { x: 0, y: 0, w: 72, h: 80 }, anchor: { x: 36, y: 72 } };

// All standard (non-civ-unique) unit IDs
export const STANDARD_UNIT_IDS: readonly string[] = [
  // Infantry
  'militia', 'man_at_arms', 'long_swordsman', 'two_handed_swordsman', 'champion',
  'spearman', 'pikeman', 'halberdier',
  // Archers
  'archer', 'crossbowman', 'arbalester', 'skirmisher', 'elite_skirmisher',
  'hand_cannoneer', 'cavalry_archer', 'heavy_cavalry_archer',
  // Cavalry
  'scout_cavalry', 'light_cavalry', 'hussar', 'knight', 'cavalier', 'paladin',
  'camel_rider', 'heavy_camel_rider', 'steppe_lancer', 'elite_steppe_lancer',
  // Siege
  'mangonel', 'onager', 'siege_onager', 'scorpion', 'heavy_scorpion',
  'battering_ram', 'capped_ram', 'siege_ram', 'trebuchet', 'bombard_cannon', 'siege_tower',
  // Naval
  'fishing_ship', 'transport_ship', 'galley', 'war_galley', 'galleon',
  'fire_galley', 'fire_ship', 'fast_fire_ship', 'demolition_raft', 'demolition_ship',
  'heavy_demolition_ship', 'cannon_galleon', 'elite_cannon_galleon', 'trade_cog',
  // Special
  'villager', 'monk', 'trade_cart', 'petard',
] as const;

interface AnimSpec {
  action: string;
  directions: number;
  fps: number;
  loop: boolean;
  frameCount: number;
}

export const UNIT_ANIM_SPECS: readonly AnimSpec[] = [
  { action: 'idle',   directions: 8, fps: 8,  loop: true,  frameCount: 6  },
  { action: 'walk',   directions: 8, fps: 15, loop: true,  frameCount: 10 },
  { action: 'attack', directions: 8, fps: 15, loop: false, frameCount: 8  },
  { action: 'die',    directions: 1, fps: 10, loop: false, frameCount: 10 },
] as const;

export interface AtlasFrame {
  frame: { x: number; y: number; w: number; h: number };
  anchor: { x: number; y: number };
}

export interface UnitAtlas {
  frames: Record<string, AtlasFrame>;
  animations: Record<string, AnimationDef>;
}

export function buildUnitAtlas(): UnitAtlas {
  const frames: Record<string, AtlasFrame> = {};
  const animations: Record<string, AnimationDef> = {};

  for (const unitId of STANDARD_UNIT_IDS) {
    for (const spec of UNIT_ANIM_SPECS) {
      const { action, directions, fps, loop, frameCount } = spec;
      const frameKeys = buildFrameKeys(unitId, action, directions, frameCount);

      // Register each frame key with a stub rect
      for (const dirFrames of frameKeys) {
        for (const key of dirFrames) {
          frames[key] = FRAME_STUB;
        }
      }

      animations[`${unitId}_${action}`] = { directions, fps, loop, frameCount, frameKeys };
    }
  }

  return { frames, animations };
}

/**
 * Register all standard unit animations with an AnimationSystem instance.
 * Call this once during game initialization.
 */
export function registerAllUnitAnimations(
  system: { registerAnimation(unitId: string, action: string, def: AnimationDef): void }
): void {
  const atlas = buildUnitAtlas();
  for (const [animKey, def] of Object.entries(atlas.animations)) {
    // animKey is e.g. "militia_idle" — split on last underscore-action segment
    // We need to find the unitId prefix. Since unitIds may contain underscores,
    // we match against known unit IDs.
    for (const unitId of STANDARD_UNIT_IDS) {
      for (const spec of UNIT_ANIM_SPECS) {
        if (animKey === `${unitId}_${spec.action}`) {
          system.registerAnimation(unitId, spec.action, def);
        }
      }
    }
  }
}
