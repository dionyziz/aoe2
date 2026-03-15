# Audio

## AudioSystem

Web Audio API. `AudioContext` is created on first user gesture (browser policy requires interaction before audio can play).

```typescript
class AudioSystem {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private sfxGain: GainNode;
  private musicGain: GainNode;

  async preload(ids: string[]): Promise<void>;
  play(id: string, opts?: { volume?: number; pan?: number; pitch?: number }): void;
  setMasterVolume(v: number): void;   // 0..1
  setSfxVolume(v: number): void;
  setMusicVolume(v: number): void;
}
```

Audio graph: source → panner → sfxGain → masterGain → destination.

---

## Sound triggers

### Unit acknowledgements

Played on unit selection and command. Each unit class has pools of 3–4 variants per action.
Debounced: same class + same action within 500ms → no duplicate.

| Event | Trigger |
|-------|---------|
| select | Left-click selects a unit |
| move | Right-click ground |
| attack | Right-click enemy |
| gather | Right-click resource (villager) |
| build | Right-click own building to build/repair |

Sound ID format: `'{class}_{action}_{variant}'` — e.g. `villager_select_0`, `infantry_attack_2`.

### Gathering loops

Looped ambient sound while villager is in `Gathering` state. Stops on state change.

| Resource | Sound |
|----------|-------|
| Wood | Axe chop loop (~2s cycle) |
| Gold/Stone | Pickaxe clank loop |
| Food (farm) | Soft digging loop |
| Food (hunt) | Arrow hit + animal grunt |
| Food (berry) | Picking sounds |

### Building sounds

| Event | Sound |
|-------|-------|
| Placement confirmed | Thud (wood) or stone plop |
| Construction in progress | Hammering loop |
| Construction complete | Bell chime |
| Building attacked (first hit) | Impact thud |
| Building destroyed | Explosion / crumble |

### Combat sounds

| Event | Sound |
|-------|-------|
| Sword/axe hit | Metal clang |
| Arrow hits unit | Thwack |
| Arrow hits building | Stone thud |
| Mangonel fires | Creak + whoosh |
| Trebuchet fires | Deep thunk + stone whoosh |
| Bombard/cannon fires | Cannon blast |
| Unit dies | Class-specific grunt |

### UI sounds

| Event | Sound |
|-------|-------|
| Button click | Short click |
| Research complete | Bell chime |
| Age-up complete | Fanfare |
| Player wins | Victory fanfare |
| Player loses | Defeat horn |
| Wonder countdown warning | Urgent bell |

### Ambient

Looped environmental audio based on map biome, crossfading when camera moves to different terrain:

| Terrain | Ambient |
|---------|---------|
| Grass / Forest | Birds, wind |
| Water / Coastal | Water ripple, seagulls |
| Desert / Sand | Dry wind |
| Snow | Wind howl |

---

## Positional audio

Sounds originating from world positions use panning:

```typescript
function playPositional(id: string, wx: number, wy: number, camera: Camera): void {
  const screen = iso.worldToScreen(wx, wy, 0, camera);
  const pan = (screen.x / camera.canvasWidth) * 2 - 1;   // -1..+1
  const distFraction = Math.abs(screen.x - camera.canvasWidth / 2) / camera.canvasWidth;
  const volume = Math.max(0, 1 - distFraction * 1.5);
  audioSystem.play(id, { pan, volume });
}
```

Off-screen sounds (source tile not in viewport) are not played.

---

## Music

Background medieval instrumental music. Cannot use original AoE2 soundtrack (copyright).
Options: public-domain MIDI converted to OGG, or original compositions.

Music system:
- Loops a track seamlessly using `AudioBufferSourceNode.loop = true`
- Crossfades to a new track on age advancement (500ms fade out, 500ms fade in)
- Separate volume control from SFX

---

## Asset format

Format: OGG Vorbis (best browser support + compression).
Location: `public/assets/sounds/`

```
public/assets/sounds/
  units/                  villager_select_0.ogg, infantry_attack_1.ogg, …
  environment/            forest_ambient.ogg, water_ambient.ogg, …
  ui/                     click.ogg, age_up_fanfare.ogg, victory.ogg, …
  combat/                 sword_hit.ogg, arrow_hit.ogg, cannon.ogg, …
  buildings/              build_complete.ogg, construct_loop.ogg, …
  music/                  theme_dark.ogg, theme_feudal.ogg, …
```
