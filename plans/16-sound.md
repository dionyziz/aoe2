# Plan 16 — Sound

**Status:** 📋 Planned
**Depends on:** 08 (buildings), 11 (combat), 13 (tech tree — age-up fanfare)

---

## Overview

AoE2 is famous for its audio: unit acknowledgement responses, the satisfying chop of wood,
the creak of a mangonel, and the age-up fanfare. Web Audio API gives us everything we need.

---

## AudioSystem (`src/engine/audio/AudioSystem.ts`)

```typescript
class AudioSystem {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private sfxGain: GainNode;
  private musicGain: GainNode;
  private buffers: Map<string, AudioBuffer> = new Map();
  private currentMusic: AudioBufferSourceNode | null = null;

  async preload(ids: string[]): Promise<void> { ... }

  play(id: string, options?: { volume?: number; pan?: number; pitch?: number }): void {
    const buf = this.buffers.get(id);
    if (!buf) return;
    const source = this.ctx.createBufferSource();
    source.buffer = buf;
    // connect through gain → panner → sfxGain → masterGain → destination
    source.start();
  }

  setMasterVolume(v: number): void { this.masterGain.gain.value = v; }
  setSfxVolume(v: number): void { this.sfxGain.gain.value = v; }
  setMusicVolume(v: number): void { this.musicGain.gain.value = v; }
}
```

---

## Sound categories and triggers

### Unit acknowledgement sounds

Each unit has a pool of voice lines for selection and command responses.
A random one is picked from the pool each time.

| Event | Unit | Example sounds |
|-------|------|---------------|
| Selected | Villager | "Yes?", "What is it?", "Ready to work" |
| Selected | Militia | "Yes, m'lord?", "For England!" |
| Selected | Archer | "Ready to fire", "At your service" |
| Selected | Monk | "Deus vult", "In nomine Domini" |
| Command (move) | Any unit | "Moving out", "Understood", "As you wish" |
| Command (attack) | Military | "Attacking!", "Charge!", "For the king!" |
| Command (gather) | Villager | "Right away", "I'll get it" |
| Command (build) | Villager | "Building now", "Leave it to me" |
| Dying | Any unit | Grunt/scream |
| Converting | Monk | Chanting |

Debounce: if the same unit type is clicked within 500ms, don't play another acknowledgement.

```typescript
// Sound ID format: '{unitClass}_{action}_{variant}'
// e.g. 'villager_select_0', 'militia_attack_2'

function playUnitAck(unit: UnitInstance, action: 'select' | 'move' | 'attack' | 'gather'): void {
  const def = UNIT_MAP.get(unit.defId)!;
  const pool = SOUND_POOLS[def.class][action];
  const id = pool[Math.floor(Math.random() * pool.length)];
  audioSystem.play(id);
}
```

### Resource gathering sounds

Looped ambient sounds while villagers gather:

| Action | Sound |
|--------|-------|
| Chopping wood | Axe chop loop (~2s) |
| Mining gold/stone | Pickaxe clank loop |
| Farming | Soft digging loop |
| Hunting | Arrow hit + animal sound |

Play when state → Gathering; stop when state changes.

### Building sounds

| Event | Sound |
|-------|-------|
| Placement confirmed | Stone plop / wood thud |
| Construction in progress | Hammering loop |
| Construction complete | Bell chime |
| Building destroyed | Explosion / crumble |
| Building attacked (first hit) | Hit sound |

### Combat sounds

| Event | Sound |
|-------|-------|
| Sword hit | Metal clang |
| Arrow hits unit | Thwack |
| Arrow hits building | Stone thud |
| Mangonel fires | Creak + whoosh |
| Trebuchet fires | Deep thunk + rock whoosh |
| Bombard cannon fires | Cannon blast |
| Unit dies | Class-specific grunt |
| Building explodes | Boom |

### UI sounds

| Event | Sound |
|-------|-------|
| Button click | Short click |
| Research complete | Bell chime |
| Age-up complete | Fanfare |
| Player wins | Victory fanfare |
| Player loses | Defeat horn |
| Wonder countdown warning | Urgent bell |
| Notification | Short tone |

### Ambient sounds

Looped environmental audio based on biome:

| Terrain | Ambient |
|---------|---------|
| Grass/Forest | Birds chirping, wind |
| Water | Water ripple, seagulls (near coast) |
| Desert/Sand | Dry wind |
| Snow | Wind howl |

---

## Audio asset pipeline

AoE2 stores sounds in `sounds.drs` as WAV files.
Until game files are available, use free CC0 audio from:
- freesound.org
- opengameart.org

File format: OGG Vorbis (best browser support + compression).
Fallback: MP3 if OGG not supported.

Asset locations: `public/assets/sounds/`

```
public/assets/sounds/
  units/
    villager_select_0.ogg
    villager_select_1.ogg
    ...
  environment/
    forest_ambient.ogg
    water_ambient.ogg
  ui/
    click.ogg
    age_up_fanfare.ogg
    victory.ogg
  combat/
    sword_hit.ogg
    arrow_hit.ogg
    ...
```

---

## Positional audio

Sounds originating from world positions (combat, gathering) use panning based on screen position:

```typescript
function playPositional(soundId: string, worldX: number, worldY: number, camera: Camera): void {
  const screen = iso.worldToScreen(worldX, worldY, 0, camera);
  const pan = (screen.x / camera.canvasWidth) * 2 - 1; // -1 (left) to +1 (right)
  const distFromCenter = Math.abs(screen.x - camera.canvasWidth / 2) / camera.canvasWidth;
  const volume = Math.max(0, 1 - distFromCenter * 1.5);
  audioSystem.play(soundId, { pan, volume });
}
```

Only play positional sounds when the source tile is within the visible viewport (no sounds from off-screen).

---

## Music

AoE2 has iconic background music (medieval instrumental).
We can't include the original soundtrack.

Options:
1. Silence (no music) — safest for legal reasons
2. Public domain medieval MIDI files converted to OGG
3. Original compositions (if contributor provides them)

Music system:
- Fade between tracks on age advancement
- Separate volume control in settings
- Track loops seamlessly (gapless loop using `AudioBufferSourceNode.loop = true`)

---

## Settings integration

Volume settings stored in `localStorage`:
```typescript
interface AudioSettings {
  masterVolume: number;  // 0..1
  sfxVolume: number;
  musicVolume: number;
  unitAcknowledgements: boolean; // toggle voice responses
}
```

Accessible from the options menu (Plan 17).

---

## Files to create

```
src/engine/audio/AudioSystem.ts       ← Core playback engine
src/engine/audio/SoundPools.ts        ← unit acknowledgement sound pools
src/engine/audio/AmbientSystem.ts     ← looped environmental audio
src/engine/audio/MusicSystem.ts       ← background music, age transitions
src/data/audio/soundPools.ts          ← sound pool mappings by unit class
```

---

## Known limitations

- AudioContext requires user gesture to start (browser policy) — initialize on first click
- iOS requires audio to be unlocked differently from desktop browsers
- No reverb/echo for large open maps (enhancement for later)
