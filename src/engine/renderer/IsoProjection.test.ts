import { IsoProjection } from './IsoProjection';
import { Camera } from '../camera/Camera';
import { TILE_WIDTH, TILE_HEIGHT } from '../../constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCam(opts: {
  zoom?: number;
  offsetX?: number;
  offsetY?: number;
  canvasWidth?: number;
  canvasHeight?: number;
} = {}): Camera {
  const cam = new Camera();
  cam.zoom        = opts.zoom        ?? 1;
  cam.offsetX     = opts.offsetX     ?? 0;
  cam.offsetY     = opts.offsetY     ?? 0;
  cam.canvasWidth  = opts.canvasWidth  ?? 800;
  cam.canvasHeight = opts.canvasHeight ?? 600;
  return cam;
}

// ---------------------------------------------------------------------------
// worldToScreen
// ---------------------------------------------------------------------------

describe('IsoProjection.worldToScreen', () => {
  let cam: Camera;

  beforeEach(() => {
    cam = makeCam(); // zoom=1, offsets=0
  });

  it('maps origin (0,0,0) to screen (0,0)', () => {
    const s = IsoProjection.worldToScreen(0, 0, 0, cam);
    expect(s.x).toBeCloseTo(0, 5);
    expect(s.y).toBeCloseTo(0, 5);
  });

  it('maps (1,0,0) to (TILE_WIDTH/2, TILE_HEIGHT/2)', () => {
    const s = IsoProjection.worldToScreen(1, 0, 0, cam);
    expect(s.x).toBeCloseTo(TILE_WIDTH  / 2, 5); // 32
    expect(s.y).toBeCloseTo(TILE_HEIGHT / 2, 5); // 16
  });

  it('maps (0,1,0) to (-TILE_WIDTH/2, TILE_HEIGHT/2)', () => {
    const s = IsoProjection.worldToScreen(0, 1, 0, cam);
    expect(s.x).toBeCloseTo(-(TILE_WIDTH  / 2), 5); // -32
    expect(s.y).toBeCloseTo(  TILE_HEIGHT / 2,  5); // 16
  });

  it('maps (1,1,0) to (0, TILE_HEIGHT)', () => {
    // sx = (1-1)*32 = 0, sy = (1+1)*16 = 32 = TILE_HEIGHT
    const s = IsoProjection.worldToScreen(1, 1, 0, cam);
    expect(s.x).toBeCloseTo(0,           5);
    expect(s.y).toBeCloseTo(TILE_HEIGHT, 5); // 32
  });

  it('elevation=1 shifts Y up by TILE_HEIGHT/2', () => {
    const base     = IsoProjection.worldToScreen(2, 3, 0, cam);
    const elevated = IsoProjection.worldToScreen(2, 3, 1, cam);
    expect(elevated.x).toBeCloseTo(base.x,                  5);
    expect(elevated.y).toBeCloseTo(base.y - TILE_HEIGHT / 2, 5);
  });

  it('elevation=2 shifts Y up by TILE_HEIGHT', () => {
    const base     = IsoProjection.worldToScreen(0, 0, 0, cam);
    const elevated = IsoProjection.worldToScreen(0, 0, 2, cam);
    expect(elevated.x).toBeCloseTo(base.x,              5);
    expect(elevated.y).toBeCloseTo(base.y - TILE_HEIGHT, 5);
  });

  it('elevation does not affect X', () => {
    const s1 = IsoProjection.worldToScreen(3, 2, 0, cam);
    const s2 = IsoProjection.worldToScreen(3, 2, 5, cam);
    expect(s2.x).toBeCloseTo(s1.x, 5);
  });

  describe('zoom', () => {
    it('zoom=2 doubles screen displacement from origin', () => {
      const camZ2 = makeCam({ zoom: 2 });
      const s1 = IsoProjection.worldToScreen(1, 0, 0, cam);
      const s2 = IsoProjection.worldToScreen(1, 0, 0, camZ2);
      expect(s2.x).toBeCloseTo(s1.x * 2, 5);
      expect(s2.y).toBeCloseTo(s1.y * 2, 5);
    });

    it('zoom=0.5 halves screen displacement from origin', () => {
      const camZ05 = makeCam({ zoom: 0.5 });
      const s1  = IsoProjection.worldToScreen(4, 2, 0, cam);
      const s05 = IsoProjection.worldToScreen(4, 2, 0, camZ05);
      expect(s05.x).toBeCloseTo(s1.x * 0.5, 5);
      expect(s05.y).toBeCloseTo(s1.y * 0.5, 5);
    });

    it('zoom scales elevation displacement proportionally', () => {
      const camZ2 = makeCam({ zoom: 2 });
      const base1    = IsoProjection.worldToScreen(0, 0, 0, cam);
      const elev1    = IsoProjection.worldToScreen(0, 0, 1, cam);
      const base2    = IsoProjection.worldToScreen(0, 0, 0, camZ2);
      const elev2    = IsoProjection.worldToScreen(0, 0, 1, camZ2);
      const shift1 = elev1.y - base1.y;
      const shift2 = elev2.y - base2.y;
      expect(shift2).toBeCloseTo(shift1 * 2, 5);
    });
  });

  describe('camera offset', () => {
    it('offsetX=100 shifts all screen X by 100', () => {
      const camOff = makeCam({ offsetX: 100 });
      const s0   = IsoProjection.worldToScreen(3, 2, 0, cam);
      const sOff = IsoProjection.worldToScreen(3, 2, 0, camOff);
      expect(sOff.x).toBeCloseTo(s0.x + 100, 5);
      expect(sOff.y).toBeCloseTo(s0.y,       5);
    });

    it('offsetY=200 shifts all screen Y by 200', () => {
      const camOff = makeCam({ offsetY: 200 });
      const s0   = IsoProjection.worldToScreen(3, 2, 0, cam);
      const sOff = IsoProjection.worldToScreen(3, 2, 0, camOff);
      expect(sOff.x).toBeCloseTo(s0.x,       5);
      expect(sOff.y).toBeCloseTo(s0.y + 200, 5);
    });

    it('negative offsetX shifts screen X left', () => {
      const camOff = makeCam({ offsetX: -50 });
      const s0   = IsoProjection.worldToScreen(1, 1, 0, cam);
      const sOff = IsoProjection.worldToScreen(1, 1, 0, camOff);
      expect(sOff.x).toBeCloseTo(s0.x - 50, 5);
    });
  });
});

// ---------------------------------------------------------------------------
// screenToWorld
// ---------------------------------------------------------------------------

describe('IsoProjection.screenToWorld', () => {
  let cam: Camera;

  beforeEach(() => {
    cam = makeCam();
  });

  it('maps screen (0,0) to world (0,0) at default camera', () => {
    const w = IsoProjection.screenToWorld(0, 0, cam);
    expect(w.x).toBeCloseTo(0, 5);
    expect(w.y).toBeCloseTo(0, 5);
  });

  it('maps (TILE_WIDTH/2, TILE_HEIGHT/2) to world (1,0)', () => {
    const w = IsoProjection.screenToWorld(TILE_WIDTH / 2, TILE_HEIGHT / 2, cam);
    expect(w.x).toBeCloseTo(1, 5);
    expect(w.y).toBeCloseTo(0, 5);
  });

  it('maps (-TILE_WIDTH/2, TILE_HEIGHT/2) to world (0,1)', () => {
    const w = IsoProjection.screenToWorld(-(TILE_WIDTH / 2), TILE_HEIGHT / 2, cam);
    expect(w.x).toBeCloseTo(0, 5);
    expect(w.y).toBeCloseTo(1, 5);
  });

  it('maps (0, TILE_HEIGHT) to world (1,1)', () => {
    const w = IsoProjection.screenToWorld(0, TILE_HEIGHT, cam);
    expect(w.x).toBeCloseTo(1, 5);
    expect(w.y).toBeCloseTo(1, 5);
  });

  describe('round-trip worldToScreen → screenToWorld', () => {
    const cases: Array<[number, number]> = [
      [0,    0   ],
      [1,    0   ],
      [0,    1   ],
      [5,    3   ],
      [10,   10  ],
      [0.5,  0.5 ],
      [3.7,  2.1 ],
      [15,   20  ],
      [-2,   0   ], // negative world coords
      [0,    -3  ],
    ];

    cases.forEach(([wx, wy]) => {
      it(`round-trips (${wx}, ${wy})`, () => {
        const s = IsoProjection.worldToScreen(wx, wy, 0, cam);
        const w = IsoProjection.screenToWorld(s.x, s.y, cam);
        expect(w.x).toBeCloseTo(wx, 5);
        expect(w.y).toBeCloseTo(wy, 5);
      });
    });

    it('round-trips with zoom=2 and offsets', () => {
      const camZ = makeCam({ zoom: 2, offsetX: 150, offsetY: -80 });
      const s = IsoProjection.worldToScreen(7, 3, 0, camZ);
      const w = IsoProjection.screenToWorld(s.x, s.y, camZ);
      expect(w.x).toBeCloseTo(7, 5);
      expect(w.y).toBeCloseTo(3, 5);
    });

    it('round-trips with zoom=0.5', () => {
      const camZ = makeCam({ zoom: 0.5 });
      const s = IsoProjection.worldToScreen(12, 5, 0, camZ);
      const w = IsoProjection.screenToWorld(s.x, s.y, camZ);
      expect(w.x).toBeCloseTo(12, 5);
      expect(w.y).toBeCloseTo(5,  5);
    });
  });

  describe('with non-zero camera offset', () => {
    it('accounts for offsetX in inverse', () => {
      const camOff = makeCam({ offsetX: 200 });
      const s = IsoProjection.worldToScreen(5, 5, 0, camOff);
      const w = IsoProjection.screenToWorld(s.x, s.y, camOff);
      expect(w.x).toBeCloseTo(5, 5);
      expect(w.y).toBeCloseTo(5, 5);
    });

    it('accounts for offsetY in inverse', () => {
      const camOff = makeCam({ offsetY: -100 });
      const s = IsoProjection.worldToScreen(2, 8, 0, camOff);
      const w = IsoProjection.screenToWorld(s.x, s.y, camOff);
      expect(w.x).toBeCloseTo(2, 5);
      expect(w.y).toBeCloseTo(8, 5);
    });
  });
});

// ---------------------------------------------------------------------------
// screenToTile
// ---------------------------------------------------------------------------

describe('IsoProjection.screenToTile', () => {
  let cam: Camera;

  beforeEach(() => {
    cam = makeCam();
  });

  it('floors world coords to tile coords', () => {
    // worldToScreen(3.7, 2.1) → some screen pos, inverse → (3.7, 2.1) → floor → (3, 2)
    const s = IsoProjection.worldToScreen(3.7, 2.1, 0, cam);
    const t = IsoProjection.screenToTile(s.x, s.y, cam);
    expect(t.tx).toBe(3);
    expect(t.ty).toBe(2);
  });

  it('returns (0,0) for the origin screen position', () => {
    const t = IsoProjection.screenToTile(0, 0, cam);
    expect(t.tx).toBe(0);
    expect(t.ty).toBe(0);
  });

  it('uses tx/ty field names (not x/y)', () => {
    const t = IsoProjection.screenToTile(0, 0, cam);
    expect(t).toHaveProperty('tx');
    expect(t).toHaveProperty('ty');
  });
});

// ---------------------------------------------------------------------------
// visibleTileRange
// ---------------------------------------------------------------------------

describe('IsoProjection.visibleTileRange', () => {
  const MAP_W = 32;
  const MAP_H = 32;

  it('returns an object with minTx, maxTx, minTy, maxTy', () => {
    const cam = makeCam();
    const r = IsoProjection.visibleTileRange(cam, MAP_W, MAP_H);
    expect(r).toHaveProperty('minTx');
    expect(r).toHaveProperty('maxTx');
    expect(r).toHaveProperty('minTy');
    expect(r).toHaveProperty('maxTy');
  });

  it('minTx <= maxTx and minTy <= maxTy', () => {
    const cam = makeCam();
    const r = IsoProjection.visibleTileRange(cam, MAP_W, MAP_H);
    expect(r.minTx).toBeLessThanOrEqual(r.maxTx);
    expect(r.minTy).toBeLessThanOrEqual(r.maxTy);
  });

  it('clamps min values to 0', () => {
    const cam = makeCam();
    const r = IsoProjection.visibleTileRange(cam, MAP_W, MAP_H);
    expect(r.minTx).toBeGreaterThanOrEqual(0);
    expect(r.minTy).toBeGreaterThanOrEqual(0);
  });

  it('clamps max values to mapW-1 / mapH-1', () => {
    const cam = makeCam();
    const r = IsoProjection.visibleTileRange(cam, MAP_W, MAP_H);
    expect(r.maxTx).toBeLessThanOrEqual(MAP_W - 1);
    expect(r.maxTy).toBeLessThanOrEqual(MAP_H - 1);
  });

  it('a tile in the visible area falls within the range', () => {
    // Camera centred on tile (8, 8) should see it
    const cam = makeCam({ canvasWidth: 800, canvasHeight: 600 });
    cam.centerOnTile(8, 8);
    const r = IsoProjection.visibleTileRange(cam, MAP_W, MAP_H);
    expect(8).toBeGreaterThanOrEqual(r.minTx);
    expect(8).toBeLessThanOrEqual(r.maxTx);
    expect(8).toBeGreaterThanOrEqual(r.minTy);
    expect(8).toBeLessThanOrEqual(r.maxTy);
  });

  it('a tile far off-screen is outside the range', () => {
    // Camera at default position (top-left), tile (31, 31) should be off-screen on a 400×300 canvas at zoom=1.
    // An 800×600 canvas at zoom=1 actually covers all 32 tiles diagonally (bottom-right corner maps to
    // world ~(31.25, 6.25)), so use a smaller viewport that genuinely leaves the far corner off-screen.
    const cam = makeCam({ zoom: 1, canvasWidth: 400, canvasHeight: 300 });
    // Don't pan at all — tile (31,31) is far to the right
    const r = IsoProjection.visibleTileRange(cam, MAP_W, MAP_H);
    // The very last tile can't be in a typical 800×600 viewport when camera starts at world origin
    // Verify range is smaller than the full map in at least one axis
    const rangeX = r.maxTx - r.minTx + 1;
    const rangeY = r.maxTy - r.minTy + 1;
    expect(rangeX).toBeLessThan(MAP_W);
    expect(rangeY).toBeLessThan(MAP_H);
  });

  it('larger canvas produces a wider visible range', () => {
    const camSmall = makeCam({ canvasWidth: 400, canvasHeight: 300 });
    const camLarge = makeCam({ canvasWidth: 1600, canvasHeight: 1200 });
    camSmall.centerOnTile(15, 15);
    camLarge.centerOnTile(15, 15);
    const rSmall = IsoProjection.visibleTileRange(camSmall, MAP_W, MAP_H);
    const rLarge = IsoProjection.visibleTileRange(camLarge, MAP_W, MAP_H);
    const rangeXSmall = rSmall.maxTx - rSmall.minTx;
    const rangeXLarge = rLarge.maxTx - rLarge.minTx;
    expect(rangeXLarge).toBeGreaterThanOrEqual(rangeXSmall);
  });

  it('lower zoom reveals more tiles', () => {
    const camZ1   = makeCam({ zoom: 1,   canvasWidth: 800, canvasHeight: 600 });
    const camZ05  = makeCam({ zoom: 0.5, canvasWidth: 800, canvasHeight: 600 });
    camZ1.centerOnTile(15, 15);
    camZ05.centerOnTile(15, 15);
    const r1  = IsoProjection.visibleTileRange(camZ1,  MAP_W, MAP_H);
    const r05 = IsoProjection.visibleTileRange(camZ05, MAP_W, MAP_H);
    const range1  = r1.maxTx  - r1.minTx  + r1.maxTy  - r1.minTy;
    const range05 = r05.maxTx - r05.minTx + r05.maxTy - r05.minTy;
    expect(range05).toBeGreaterThanOrEqual(range1);
  });
});

// ---------------------------------------------------------------------------
// sortKey
// ---------------------------------------------------------------------------

describe('IsoProjection.sortKey', () => {
  it('returns tx + ty', () => {
    expect(IsoProjection.sortKey(3, 5)).toBe(8);
    expect(IsoProjection.sortKey(0, 0)).toBe(0);
    expect(IsoProjection.sortKey(10, 7)).toBe(17);
  });

  it('two tiles with the same sum have the same sort key (painter order)', () => {
    expect(IsoProjection.sortKey(1, 4)).toBe(IsoProjection.sortKey(4, 1));
  });
});
