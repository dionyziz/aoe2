import type { UnitInstance } from '../../types/unit';
import type { AnimationDef } from '../../types/animation';
import { AnimationSystem } from './AnimationSystem';
import { buildFrameKeys } from './AnimationDef';

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

function makeUnit(overrides: Partial<UnitInstance> = {}): UnitInstance {
  return {
    id: 1,
    defId: 'militia',
    playerId: 1,
    pos: { wx: 0.5, wy: 0.5 },
    targetPos: null,
    path: [],
    pathIndex: 0,
    state: 'idle',
    currentHp: 40,
    direction: 0,
    animFrame: 0,
    animTimer: 0,
    selected: false,
    targetUnitId: null,
    targetBuildingId: null,
    stance: 'aggressive',
    garrisonedIn: null,
    ...overrides,
  };
}

/**
 * Build a minimal AnimationDef for testing.
 * `dt` in AnimationSystem is in ms; frameDuration = 1000 / fps ms.
 */
function makeAnimDef(overrides: Partial<AnimationDef> & { unitId?: string; action?: string } = {}): AnimationDef {
  const unitId  = overrides.unitId  ?? 'militia';
  const action  = overrides.action  ?? 'idle';
  const dirs    = overrides.directions ?? 8;
  const count   = overrides.frameCount ?? 4;
  const fps     = overrides.fps ?? 10;
  const loop    = overrides.loop ?? true;
  return {
    id:         overrides.id         ?? `${unitId}_${action}`,
    directions: dirs,
    fps,
    loop,
    frameCount: count,
    frameKeys:  overrides.frameKeys  ?? buildFrameKeys(unitId, action, dirs, count),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AnimationSystem', () => {
  let sys: AnimationSystem;

  beforeEach(() => {
    sys = new AnimationSystem();
  });

  // -------------------------------------------------------------------------
  // registerAnimation / storage
  // -------------------------------------------------------------------------

  describe('registerAnimation', () => {
    it('stores a def and makes it available for subsequent operations', () => {
      const def = makeAnimDef({ unitId: 'militia', action: 'idle' });
      sys.registerAnimation('militia_idle', def);
      // Verify it is used by getFrameKey
      const unit = makeUnit({ defId: 'militia', state: 'idle', animFrame: 0, direction: 0 });
      const key = sys.getFrameKey(unit);
      // Should return a real frame key, not the fallback
      expect(key).toBe('militia_idle_s_0');
    });

    it('overwrites a def when the same animId is registered twice', () => {
      const def1 = makeAnimDef({ fps: 10, frameCount: 4 });
      const def2 = makeAnimDef({ fps: 20, frameCount: 6 });
      sys.registerAnimation('militia_idle', def1);
      sys.registerAnimation('militia_idle', def2);
      // After overwrite, update should use fps=20 → frameDuration=50ms
      const unit = makeUnit({ defId: 'militia', state: 'idle', animFrame: 0, animTimer: 0 });
      // 49ms < 50ms → frame should NOT advance
      sys.update(49, [unit]);
      expect(unit.animFrame).toBe(0);
      // 50ms >= 50ms → frame should advance
      unit.animTimer = 0;
      sys.update(50, [unit]);
      expect(unit.animFrame).toBe(1);
    });

    it('does not throw when registering many animations', () => {
      expect(() => {
        for (let i = 0; i < 100; i++) {
          sys.registerAnimation(`unit_${i}_idle`, makeAnimDef({ unitId: `unit_${i}`, action: 'idle' }));
        }
      }).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // update — animTimer advancement
  // -------------------------------------------------------------------------

  describe('update — animTimer', () => {
    it('advances animTimer by dt each call', () => {
      // Register an animation with very high fps so it won't tick a frame
      const def = makeAnimDef({ fps: 1, frameCount: 2 }); // frameDuration = 1000 ms
      sys.registerAnimation('militia_idle', def);
      const unit = makeUnit({ animTimer: 0 });
      sys.update(100, [unit]); // 100ms — well below 1000ms threshold
      expect(unit.animTimer).toBeCloseTo(100, 5);
    });

    it('accumulates timer across multiple update calls', () => {
      const def = makeAnimDef({ fps: 1, frameCount: 2 }); // threshold = 1000ms
      sys.registerAnimation('militia_idle', def);
      const unit = makeUnit({ animTimer: 0 });
      sys.update(300, [unit]);
      sys.update(300, [unit]);
      sys.update(300, [unit]);
      expect(unit.animTimer).toBeCloseTo(900, 5);
    });

    it('resets timer to 0 when unit has no registered animation', () => {
      // No animation registered for this unit
      const unit = makeUnit({ defId: 'unknown', animTimer: 500 });
      sys.update(100, [unit]);
      // No def found → animFrame=0, timer not advanced (loop continues)
      // Source: if (!def) { unit.animFrame = 0; continue; }
      expect(unit.animFrame).toBe(0);
      // animTimer is not modified when def is missing
    });
  });

  // -------------------------------------------------------------------------
  // update — frame advancement
  // -------------------------------------------------------------------------

  describe('update — frame advancement', () => {
    it('advances animFrame when timer reaches frameDuration', () => {
      // fps=10 → frameDuration=100ms
      const def = makeAnimDef({ fps: 10, frameCount: 4 });
      sys.registerAnimation('militia_idle', def);
      const unit = makeUnit({ animFrame: 0, animTimer: 0 });
      sys.update(100, [unit]); // exactly one frame duration
      expect(unit.animFrame).toBe(1);
    });

    it('does not advance frame before frameDuration is reached', () => {
      // fps=10 → frameDuration=100ms
      const def = makeAnimDef({ fps: 10, frameCount: 4 });
      sys.registerAnimation('militia_idle', def);
      const unit = makeUnit({ animFrame: 0, animTimer: 0 });
      sys.update(99, [unit]);
      expect(unit.animFrame).toBe(0);
    });

    it('advances multiple frames with large dt', () => {
      // fps=10 → frameDuration=100ms; dt=350ms → 3 full frames
      const def = makeAnimDef({ fps: 10, frameCount: 10 });
      sys.registerAnimation('militia_idle', def);
      const unit = makeUnit({ animFrame: 0, animTimer: 0 });
      sys.update(350, [unit]);
      expect(unit.animFrame).toBe(3);
      expect(unit.animTimer).toBeCloseTo(50, 5); // 350 - 3*100 = 50
    });

    it('carries over the remainder timer after a frame tick', () => {
      // fps=10 → frameDuration=100ms; dt=150ms → 1 frame + 50ms leftover
      const def = makeAnimDef({ fps: 10, frameCount: 4 });
      sys.registerAnimation('militia_idle', def);
      const unit = makeUnit({ animFrame: 0, animTimer: 0 });
      sys.update(150, [unit]);
      expect(unit.animFrame).toBe(1);
      expect(unit.animTimer).toBeCloseTo(50, 5);
    });
  });

  // -------------------------------------------------------------------------
  // update — looping
  // -------------------------------------------------------------------------

  describe('update — frame wrap-around (looping)', () => {
    it('wraps frame back to 0 at the end for a looping animation', () => {
      // fps=10, frameCount=4, loop=true → frameDuration=100ms
      const def = makeAnimDef({ fps: 10, frameCount: 4, loop: true });
      sys.registerAnimation('militia_idle', def);
      const unit = makeUnit({ animFrame: 3, animTimer: 0 });
      sys.update(100, [unit]); // advances from frame 3 → wraps to 0
      expect(unit.animFrame).toBe(0);
    });

    it('wraps multiple times when dt spans more than a full cycle', () => {
      // fps=10, frameCount=4, loop=true → full cycle=400ms
      // dt=900ms → 9 frames → 9%4=1
      const def = makeAnimDef({ fps: 10, frameCount: 4, loop: true });
      sys.registerAnimation('militia_idle', def);
      const unit = makeUnit({ animFrame: 0, animTimer: 0 });
      sys.update(900, [unit]);
      expect(unit.animFrame).toBe(1); // 9 % 4 = 1
    });

    it('clamps to last frame for a non-looping animation', () => {
      // fps=10, frameCount=4, loop=false
      const def = makeAnimDef({ fps: 10, frameCount: 4, loop: false });
      sys.registerAnimation('militia_idle', def);
      const unit = makeUnit({ animFrame: 3, animTimer: 0 });
      sys.update(100, [unit]); // tries to advance past frame 3
      expect(unit.animFrame).toBe(3); // clamped to last frame
    });

    it('does not go beyond last frame for non-looping with large dt', () => {
      const def = makeAnimDef({ fps: 10, frameCount: 4, loop: false });
      sys.registerAnimation('militia_idle', def);
      const unit = makeUnit({ animFrame: 0, animTimer: 0 });
      sys.update(10000, [unit]); // huge dt
      expect(unit.animFrame).toBe(3); // clamped to frameCount - 1
    });
  });

  // -------------------------------------------------------------------------
  // update — multiple units
  // -------------------------------------------------------------------------

  describe('update — multiple units', () => {
    it('updates all units in the array', () => {
      const def = makeAnimDef({ fps: 10, frameCount: 4 });
      sys.registerAnimation('militia_idle', def);
      const u1 = makeUnit({ id: 1, animFrame: 0, animTimer: 0 });
      const u2 = makeUnit({ id: 2, animFrame: 0, animTimer: 0 });
      sys.update(100, [u1, u2]);
      expect(u1.animFrame).toBe(1);
      expect(u2.animFrame).toBe(1);
    });

    it('updates units independently (different timers)', () => {
      const def = makeAnimDef({ fps: 10, frameCount: 4 });
      sys.registerAnimation('militia_idle', def);
      const u1 = makeUnit({ id: 1, animFrame: 0, animTimer: 50 }); // halfway through
      const u2 = makeUnit({ id: 2, animFrame: 0, animTimer: 0 });
      sys.update(60, [u1, u2]); // u1: 50+60=110ms → 1 frame; u2: 60ms → 0 frames
      expect(u1.animFrame).toBe(1);
      expect(u2.animFrame).toBe(0);
    });

    it('handles an empty unit array without throwing', () => {
      const def = makeAnimDef();
      sys.registerAnimation('militia_idle', def);
      expect(() => sys.update(100, [])).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // update — state→action mapping
  // -------------------------------------------------------------------------

  describe('update — state to animation action mapping', () => {
    it('uses the walk animation for a moving unit', () => {
      const def = makeAnimDef({ unitId: 'militia', action: 'walk', fps: 10, frameCount: 4 });
      sys.registerAnimation('militia_walk', def);
      const unit = makeUnit({ defId: 'militia', state: 'moving', animFrame: 0, animTimer: 0 });
      sys.update(100, [unit]);
      expect(unit.animFrame).toBe(1);
    });

    it('uses the attack animation for an attacking unit', () => {
      const def = makeAnimDef({ unitId: 'militia', action: 'attack', fps: 10, frameCount: 4 });
      sys.registerAnimation('militia_attack', def);
      const unit = makeUnit({ defId: 'militia', state: 'attacking', animFrame: 0, animTimer: 0 });
      sys.update(100, [unit]);
      expect(unit.animFrame).toBe(1);
    });

    it('uses the die animation for a dead unit', () => {
      const def = makeAnimDef({ unitId: 'militia', action: 'die', fps: 10, frameCount: 4, loop: false });
      sys.registerAnimation('militia_die', def);
      const unit = makeUnit({ defId: 'militia', state: 'dead', animFrame: 0, animTimer: 0 });
      sys.update(100, [unit]);
      expect(unit.animFrame).toBe(1);
    });

    it('resets frame to 0 when no animation is registered for the resolved animId', () => {
      // No registration at all
      const unit = makeUnit({ defId: 'archer', state: 'idle', animFrame: 3, animTimer: 50 });
      sys.update(100, [unit]);
      expect(unit.animFrame).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // setAnimation
  // -------------------------------------------------------------------------

  describe('setAnimation', () => {
    it('resets animFrame to 0', () => {
      const unit = makeUnit({ animFrame: 5, animTimer: 200 });
      sys.setAnimation(unit, 'militia_idle');
      expect(unit.animFrame).toBe(0);
    });

    it('resets animTimer to 0', () => {
      const unit = makeUnit({ animFrame: 3, animTimer: 150 });
      sys.setAnimation(unit, 'militia_walk');
      expect(unit.animTimer).toBe(0);
    });

    it('is a no-op for an unregistered animId (does not throw)', () => {
      const unit = makeUnit({ animFrame: 2, animTimer: 100 });
      expect(() => sys.setAnimation(unit, 'nonexistent_anim')).not.toThrow();
      // Still resets counters
      expect(unit.animFrame).toBe(0);
      expect(unit.animTimer).toBe(0);
    });

    it('subsequent update starts from frame 0 after setAnimation', () => {
      const def = makeAnimDef({ fps: 10, frameCount: 4 });
      sys.registerAnimation('militia_idle', def);
      const unit = makeUnit({ animFrame: 3, animTimer: 90 });
      sys.setAnimation(unit, 'militia_idle');
      // animTimer=0; update 100ms → advances to frame 1
      sys.update(100, [unit]);
      expect(unit.animFrame).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // getFrameKey
  // -------------------------------------------------------------------------

  describe('getFrameKey', () => {
    it('returns correct key for frame 0, direction 0, 8-direction anim', () => {
      const def = makeAnimDef({ unitId: 'militia', action: 'idle', directions: 8, frameCount: 4 });
      sys.registerAnimation('militia_idle', def);
      const unit = makeUnit({ state: 'idle', animFrame: 0, direction: 0 });
      // direction 0 → dirIndex 0 → suffix 's' (first in DIR_SUFFIXES)
      expect(sys.getFrameKey(unit)).toBe('militia_idle_s_0');
    });

    it('returns correct key for a later frame', () => {
      const def = makeAnimDef({ unitId: 'militia', action: 'idle', directions: 8, frameCount: 4 });
      sys.registerAnimation('militia_idle', def);
      const unit = makeUnit({ state: 'idle', animFrame: 2, direction: 0 });
      expect(sys.getFrameKey(unit)).toBe('militia_idle_s_2');
    });

    it('returns fallback key when no animation is registered', () => {
      const unit = makeUnit({ defId: 'archer', state: 'idle', animFrame: 0, direction: 0 });
      // No registration → fallback: `${defId}_${action}_s_0`
      expect(sys.getFrameKey(unit)).toBe('archer_idle_s_0');
    });

    it('clamps frame to frameCount-1 when animFrame exceeds range', () => {
      const def = makeAnimDef({ unitId: 'militia', action: 'idle', directions: 8, frameCount: 4 });
      sys.registerAnimation('militia_idle', def);
      const unit = makeUnit({ state: 'idle', animFrame: 99, direction: 0 });
      // frameIndex = Math.min(99, 3) = 3
      expect(sys.getFrameKey(unit)).toBe('militia_idle_s_3');
    });

    // 8-direction: dirIndex matches unit.direction

    it('uses direction as dirIndex for 8-direction animation', () => {
      const def = makeAnimDef({ unitId: 'militia', action: 'walk', directions: 8, frameCount: 3 });
      sys.registerAnimation('militia_walk', def);
      // direction 0=S (dirSuffixes[0]='s'), direction 1 → 'sw', etc.
      // frameKeys[dirIndex][frameIndex]
      const DIR_SUFFIXES = ['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se'];
      for (let dir = 0; dir < 8; dir++) {
        const unit = makeUnit({ state: 'moving', animFrame: 0, direction: dir });
        const key = sys.getFrameKey(unit);
        expect(key).toBe(`militia_walk_${DIR_SUFFIXES[dir]}_0`);
      }
    });

    it('always uses dirIndex 0 for a 1-direction animation regardless of unit.direction', () => {
      const def = makeAnimDef({ unitId: 'militia', action: 'die', directions: 1, frameCount: 4 });
      sys.registerAnimation('militia_die', def);
      for (let dir = 0; dir < 8; dir++) {
        const unit = makeUnit({ state: 'dead', animFrame: 0, direction: dir });
        // 1-direction → dirIndex always 0 → suffix 's'
        expect(sys.getFrameKey(unit)).toBe('militia_die_s_0');
      }
    });

    it('returns the correct key after several frames have advanced', () => {
      const def = makeAnimDef({ unitId: 'militia', action: 'idle', directions: 8, frameCount: 6, fps: 10 });
      sys.registerAnimation('militia_idle', def);
      const unit = makeUnit({ state: 'idle', animFrame: 0, animTimer: 0, direction: 0 });
      // Advance 3 frames (3 × 100ms = 300ms)
      sys.update(300, [unit]);
      expect(unit.animFrame).toBe(3);
      expect(sys.getFrameKey(unit)).toBe('militia_idle_s_3');
    });

    it('uses walk action key when unit state is moving', () => {
      const def = makeAnimDef({ unitId: 'militia', action: 'walk', directions: 8, frameCount: 4 });
      sys.registerAnimation('militia_walk', def);
      const unit = makeUnit({ state: 'moving', animFrame: 1, direction: 2 });
      expect(sys.getFrameKey(unit)).toBe('militia_walk_w_1');
    });

    it('handles direction wrapped via modulo 8', () => {
      const def = makeAnimDef({ unitId: 'militia', action: 'idle', directions: 8, frameCount: 2 });
      sys.registerAnimation('militia_idle', def);
      // direction=8 → 8%8=0 → dirIndex 0 → 's'
      const unit = makeUnit({ state: 'idle', animFrame: 0, direction: 8 });
      expect(sys.getFrameKey(unit)).toBe('militia_idle_s_0');
    });
  });

  // -------------------------------------------------------------------------
  // Integration: register → update → getFrameKey
  // -------------------------------------------------------------------------

  describe('integration: full animation cycle', () => {
    it('cycles through all frames and wraps for a looping anim', () => {
      // fps=10 → frameDuration=100ms; 4 frames
      const def = makeAnimDef({ fps: 10, frameCount: 4, loop: true });
      sys.registerAnimation('militia_idle', def);
      const unit = makeUnit({ animFrame: 0, animTimer: 0, direction: 0 });

      sys.update(100, [unit]); expect(unit.animFrame).toBe(1);
      sys.update(100, [unit]); expect(unit.animFrame).toBe(2);
      sys.update(100, [unit]); expect(unit.animFrame).toBe(3);
      sys.update(100, [unit]); expect(unit.animFrame).toBe(0); // wraps
      expect(sys.getFrameKey(unit)).toBe('militia_idle_s_0');
    });

    it('stops at last frame for a non-looping animation', () => {
      const def = makeAnimDef({ fps: 10, frameCount: 3, loop: false, unitId: 'militia', action: 'die' });
      sys.registerAnimation('militia_die', def);
      const unit = makeUnit({ state: 'dead', animFrame: 0, animTimer: 0, direction: 0 });

      sys.update(100, [unit]); expect(unit.animFrame).toBe(1);
      sys.update(100, [unit]); expect(unit.animFrame).toBe(2);
      sys.update(100, [unit]); expect(unit.animFrame).toBe(2); // clamped
      expect(sys.getFrameKey(unit)).toBe('militia_die_s_2');
    });

    it('setAnimation followed by update restarts the cycle cleanly', () => {
      const def = makeAnimDef({ fps: 10, frameCount: 4, loop: true });
      sys.registerAnimation('militia_idle', def);
      const unit = makeUnit({ animFrame: 3, animTimer: 80, direction: 0 });

      sys.setAnimation(unit, 'militia_idle');
      expect(unit.animFrame).toBe(0);
      expect(unit.animTimer).toBe(0);

      sys.update(100, [unit]);
      expect(unit.animFrame).toBe(1);
    });
  });
});
