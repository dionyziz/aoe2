#!/usr/bin/env node
/**
 * Generates public/assets/sprites/units.json with complete frame + animation
 * entries for all 50 standard unit types. All frame pixel coords are stubs
 * (0,0,72,80) — replace with real atlas coords when art exists.
 *
 * Usage: node scripts/generate-unit-atlas.mjs
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const UNIT_IDS = [
  'militia','man_at_arms','long_swordsman','two_handed_swordsman','champion',
  'spearman','pikeman','halberdier','eagle_scout','eagle_warrior','elite_eagle_warrior',
  'archer','crossbowman','arbalester','skirmisher','elite_skirmisher',
  'hand_cannoneer','cavalry_archer','heavy_cavalry_archer',
  'scout_cavalry','light_cavalry','hussar','knight','cavalier','paladin',
  'camel_rider','heavy_camel_rider','steppe_lancer','elite_steppe_lancer',
  'battering_ram','capped_ram','siege_ram',
  'mangonel','onager','siege_onager',
  'scorpion','heavy_scorpion',
  'trebuchet','bombard_cannon','siege_tower',
  'fishing_ship','transport_ship',
  'galley','war_galley','galleon',
  'fire_galley','fire_ship','fast_fire_ship',
  'demolition_raft','demolition_ship','heavy_demolition_ship',
  'cannon_galleon','elite_cannon_galleon','trade_cog',
  'villager','monk','trade_cart','petard',
];

const DIR_SUFFIXES = ['s','sw','w','nw','n','ne','e','se'];

const ANIMS = [
  { action: 'idle',   directions: 8, fps: 6,  loop: true,  frameCount: 6  },
  { action: 'walk',   directions: 8, fps: 15, loop: true,  frameCount: 10 },
  { action: 'attack', directions: 8, fps: 15, loop: false, frameCount: 8  },
  { action: 'die',    directions: 1, fps: 10, loop: false, frameCount: 10 },
];

const frames = {};
const animations = {};

for (const unitId of UNIT_IDS) {
  for (const { action, directions, fps, loop, frameCount } of ANIMS) {
    const frameKeys = [];
    const dirs = directions === 8 ? DIR_SUFFIXES : ['s'];
    for (const dir of dirs) {
      const row = [];
      for (let f = 0; f < frameCount; f++) {
        const key = `${unitId}_${action}_${dir}_${f}`;
        frames[key] = { frame: { x: 0, y: 0, w: 72, h: 80 }, anchor: { x: 36, y: 72 } };
        row.push(key);
      }
      frameKeys.push(row);
    }
    animations[`${unitId}_${action}`] = { directions, fps, loop, frameCount, frameKeys };
  }
}

const atlas = { frames, animations };
const outPath = join(__dirname, '..', 'public', 'assets', 'sprites', 'units.json');
writeFileSync(outPath, JSON.stringify(atlas, null, 2));
console.log(`Written ${Object.keys(frames).length} frames and ${Object.keys(animations).length} animations to ${outPath}`);
