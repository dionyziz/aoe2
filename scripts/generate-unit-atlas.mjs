/**
 * Generates public/assets/sprites/units.json
 * Run: node scripts/generate-unit-atlas.mjs
 */
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../public/assets/sprites/units.json');

const UNITS = [
  // Infantry
  'militia','man_at_arms','long_swordsman','two_handed_swordsman','champion',
  'spearman','pikeman','halberdier',
  // Archers
  'archer','crossbowman','arbalester','skirmisher','elite_skirmisher',
  'hand_cannoneer','cavalry_archer','heavy_cavalry_archer',
  // Cavalry
  'scout_cavalry','light_cavalry','hussar','knight','cavalier','paladin',
  'camel_rider','heavy_camel_rider','steppe_lancer','elite_steppe_lancer',
  // Siege
  'mangonel','onager','siege_onager','scorpion','heavy_scorpion',
  'battering_ram','capped_ram','siege_ram','trebuchet','bombard_cannon','siege_tower',
  // Naval
  'fishing_ship','transport_ship','galley','war_galley','galleon',
  'fire_galley','fire_ship','fast_fire_ship','demolition_raft','demolition_ship',
  'heavy_demolition_ship','cannon_galleon','elite_cannon_galleon','trade_cog',
  // Special
  'villager','monk','trade_cart','petard',
];

const DIRS = ['s','sw','w','nw','n','ne','e','se'];
const STUB = { frame: { x: 0, y: 0, w: 72, h: 80 }, anchor: { x: 36, y: 72 } };

const ANIM_SPECS = [
  { action: 'idle',   dirs: 8, fps: 8,  loop: true,  frames: 6  },
  { action: 'walk',   dirs: 8, fps: 15, loop: true,  frames: 10 },
  { action: 'attack', dirs: 8, fps: 15, loop: false, frames: 8  },
  { action: 'die',    dirs: 1, fps: 10, loop: false, frames: 10 },
];

const atlas = { frames: {}, animations: {} };

for (const unit of UNITS) {
  for (const spec of ANIM_SPECS) {
    const usedDirs = spec.dirs === 8 ? DIRS : ['s'];
    const frameKeys = [];
    for (const dir of usedDirs) {
      const dirFrames = [];
      for (let f = 0; f < spec.frames; f++) {
        const key = `${unit}_${spec.action}_${dir}_${f}`;
        atlas.frames[key] = STUB;
        dirFrames.push(key);
      }
      frameKeys.push(dirFrames);
    }
    atlas.animations[`${unit}_${spec.action}`] = {
      directions: spec.dirs,
      fps: spec.fps,
      loop: spec.loop,
      frameCount: spec.frames,
      frameKeys,
    };
  }
}

writeFileSync(OUT, JSON.stringify(atlas, null, 2));
const fc = Object.keys(atlas.frames).length;
const ac = Object.keys(atlas.animations).length;
console.log(`Written ${OUT}`);
console.log(`  frames: ${fc}, animations: ${ac}`);
