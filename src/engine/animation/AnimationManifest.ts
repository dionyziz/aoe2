import { buildFrameKeys, type AnimationDef } from './AnimationDef';
import type { AnimationSystem } from './AnimationSystem';

// All standard (non-civ-unique) unit IDs
export const STANDARD_UNIT_IDS = [
  // Infantry
  'militia', 'man_at_arms', 'long_swordsman', 'two_handed_swordsman', 'champion',
  'spearman', 'pikeman', 'halberdier', 'eagle_scout', 'eagle_warrior', 'elite_eagle_warrior',
  // Archers
  'archer', 'crossbowman', 'arbalester', 'skirmisher', 'elite_skirmisher',
  'hand_cannoneer', 'cavalry_archer', 'heavy_cavalry_archer',
  // Cavalry
  'scout_cavalry', 'light_cavalry', 'hussar', 'knight', 'cavalier', 'paladin',
  'camel_rider', 'heavy_camel_rider', 'steppe_lancer', 'elite_steppe_lancer',
  // Siege
  'battering_ram', 'capped_ram', 'siege_ram',
  'mangonel', 'onager', 'siege_onager',
  'scorpion', 'heavy_scorpion',
  'trebuchet', 'bombard_cannon', 'siege_tower',
  // Naval
  'fishing_ship', 'transport_ship',
  'galley', 'war_galley', 'galleon',
  'fire_galley', 'fire_ship', 'fast_fire_ship',
  'demolition_raft', 'demolition_ship', 'heavy_demolition_ship',
  'cannon_galleon', 'elite_cannon_galleon', 'trade_cog',
  // Civilian & misc
  'villager', 'monk', 'trade_cart', 'petard',
] as const;

export type StandardUnitId = typeof STANDARD_UNIT_IDS[number];

/**
 * Build animation definitions for a single unit.
 * Returns: idle, walk, attack, die
 */
function buildUnitAnims(unitId: string): Record<string, AnimationDef> {
  const isSiege = ['battering_ram','capped_ram','siege_ram','siege_tower',
                   'trebuchet'].includes(unitId);
  const isShip  = unitId.includes('ship') || unitId.includes('galley') ||
                  unitId.includes('raft') || unitId.includes('cog') ||
                  unitId === 'cannon_galleon' || unitId === 'elite_cannon_galleon';

  return {
    [`${unitId}_idle`]: {
      directions: 8, fps: 6, loop: true, frameCount: 6,
      frameKeys: buildFrameKeys(unitId, 'idle', 8, 6),
    },
    [`${unitId}_walk`]: {
      directions: 8, fps: 15, loop: true,
      frameCount: isShip ? 8 : (isSiege ? 8 : 10),
      frameKeys: buildFrameKeys(unitId, 'walk', 8, isShip ? 8 : (isSiege ? 8 : 10)),
    },
    [`${unitId}_attack`]: {
      directions: 8, fps: 15, loop: false,
      frameCount: isSiege ? 10 : 8,
      frameKeys: buildFrameKeys(unitId, 'attack', 8, isSiege ? 10 : 8),
    },
    [`${unitId}_die`]: {
      directions: 1, fps: 10, loop: false, frameCount: 10,
      frameKeys: buildFrameKeys(unitId, 'die', 1, 10),
    },
  };
}

/** Build the full animation manifest for all standard units */
export function buildFullManifest(): Record<string, AnimationDef> {
  const manifest: Record<string, AnimationDef> = {};
  for (const id of STANDARD_UNIT_IDS) {
    Object.assign(manifest, buildUnitAnims(id));
  }
  return manifest;
}

/** Register all standard unit animations with an AnimationSystem instance */
export function registerAllUnitAnimations(animSystem: AnimationSystem): void {
  for (const id of STANDARD_UNIT_IDS) {
    const anims = buildUnitAnims(id);
    for (const [fullName, def] of Object.entries(anims)) {
      // fullName is like "militia_idle" — extract the action part
      const action = fullName.slice(id.length + 1); // remove "unitId_" prefix
      animSystem.registerAnimation(id, action, def);
    }
  }
}
