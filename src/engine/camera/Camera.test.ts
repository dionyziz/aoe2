import { Camera } from './Camera';
import { MIN_ZOOM, MAX_ZOOM } from '../../constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCam(opts: {
  zoom?: number;
  offsetX?: number;
  offsetY?: number;
  canvasWidth?: number;
  canvasHeight?: number;
  mapW?: number;
  mapH?: number;
} = {}): Camera {
  const cam = new Camera();
  cam.zoom         = opts.zoom         ?? 1;
  cam.offsetX      = opts.offsetX      ?? 0;
  cam.offsetY      = opts.offsetY      ?? 0;
  cam.canvasWidth  = opts.canvasWidth  ?? 800;
  cam.canvasHeight = opts.canvasHeight ?? 600;
  if (opts.mapW !== undefined && opts.mapH !== undefined) {
    cam.setMapSize(opts.mapW, opts.mapH);
  }
  return cam;
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('Camera initial state', () => {
  it('starts with zoom=1', () => {
    const cam = new Camera();
    expect(cam.zoom).toBe(1.0);
  });

  it('starts with offsetX=0, offsetY=0', () => {
    const cam = new Camera();
    expect(cam.offsetX).toBe(0);
    expect(cam.offsetY).toBe(0);
  });

  it('starts with default canvas 800×600', () => {
    const cam = new Camera();
    expect(cam.canvasWidth).toBe(800);
    expect(cam.canvasHeight).toBe(600);
  });
});

// ---------------------------------------------------------------------------
// pan
// ---------------------------------------------------------------------------

describe('Camera.pan', () => {
  let cam: Camera;

  beforeEach(() => {
    cam = makeCam();
  });

  it('increases offsetX by dx', () => {
    cam.pan(50, 0);
    expect(cam.offsetX).toBeCloseTo(50, 5);
  });

  it('increases offsetY by dy', () => {
    cam.pan(0, 75);
    expect(cam.offsetY).toBeCloseTo(75, 5);
  });

  it('moves both axes simultaneously', () => {
    cam.pan(30, -20);
    expect(cam.offsetX).toBeCloseTo(30,  5);
    expect(cam.offsetY).toBeCloseTo(-20, 5);
  });

  it('accumulates across multiple pan calls', () => {
    cam.pan(10, 5);
    cam.pan(20, -5);
    expect(cam.offsetX).toBeCloseTo(30, 5);
    expect(cam.offsetY).toBeCloseTo(0,  5);
  });

  it('panning by negative dx moves offsetX left', () => {
    cam.pan(-100, 0);
    expect(cam.offsetX).toBeCloseTo(-100, 5);
  });

  it('does not change zoom', () => {
    cam.pan(50, 50);
    expect(cam.zoom).toBeCloseTo(1, 5);
  });

  it('does not change canvasWidth or canvasHeight', () => {
    cam.pan(100, 200);
    expect(cam.canvasWidth).toBe(800);
    expect(cam.canvasHeight).toBe(600);
  });

  it('pan(0, 0) is a no-op', () => {
    cam.offsetX = 123;
    cam.offsetY = 456;
    cam.pan(0, 0);
    expect(cam.offsetX).toBeCloseTo(123, 5);
    expect(cam.offsetY).toBeCloseTo(456, 5);
  });

  it('large positive pan is allowed (no hard clamp)', () => {
    cam.pan(999999, 999999);
    expect(cam.offsetX).toBeCloseTo(999999, 5);
    expect(cam.offsetY).toBeCloseTo(999999, 5);
  });

  it('large negative pan is allowed (no hard clamp)', () => {
    cam.pan(-999999, -999999);
    expect(cam.offsetX).toBeCloseTo(-999999, 5);
    expect(cam.offsetY).toBeCloseTo(-999999, 5);
  });
});

// ---------------------------------------------------------------------------
// zoomAt
// ---------------------------------------------------------------------------

describe('Camera.zoomAt', () => {
  let cam: Camera;

  beforeEach(() => {
    cam = makeCam(); // zoom=1, offsets=0
  });

  // --- zoom value changes ---

  it('multiplies zoom by factor', () => {
    cam.zoomAt(2, 400, 300);
    expect(cam.zoom).toBeCloseTo(2, 5);
  });

  it('zoom in by 1.5×', () => {
    cam.zoomAt(1.5, 0, 0);
    expect(cam.zoom).toBeCloseTo(1.5, 5);
  });

  it('zoom out by 0.5×', () => {
    cam.zoomAt(0.5, 0, 0);
    expect(cam.zoom).toBeCloseTo(0.5, 5);
  });

  it('sequential zoom in and out returns to original zoom', () => {
    cam.zoomAt(2, 400, 300);
    cam.zoomAt(0.5, 400, 300);
    expect(cam.zoom).toBeCloseTo(1, 5);
  });

  // --- zoom clamping ---

  it('cannot zoom below MIN_ZOOM (0.5)', () => {
    cam.zoomAt(0.1, 400, 300);
    expect(cam.zoom).toBeCloseTo(MIN_ZOOM, 5);
  });

  it('cannot zoom above MAX_ZOOM (2.0)', () => {
    cam.zoomAt(10, 400, 300);
    expect(cam.zoom).toBeCloseTo(MAX_ZOOM, 5);
  });

  it('zoom stays at MAX_ZOOM if already at max and zooming in further', () => {
    cam.zoom = MAX_ZOOM;
    cam.zoomAt(2, 400, 300);
    expect(cam.zoom).toBeCloseTo(MAX_ZOOM, 5);
  });

  it('zoom stays at MIN_ZOOM if already at min and zooming out further', () => {
    cam.zoom = MIN_ZOOM;
    cam.zoomAt(0.1, 400, 300);
    expect(cam.zoom).toBeCloseTo(MIN_ZOOM, 5);
  });

  it('zoom factor=1 is a no-op on zoom value', () => {
    cam.zoom = 1.3;
    cam.zoomAt(1, 400, 300);
    expect(cam.zoom).toBeCloseTo(1.3, 5);
  });

  // --- pivot: the world point under cursor must not move ---

  it('world point under cursor stays fixed (zoom=1 → 2, cursor at origin)', () => {
    // offsetX=0, offsetY=0, screenX=0, screenY=0 — world point is (0,0)
    // After zoom: newOffsetX = 0 - (0 - 0)*(2/1) = 0
    cam.zoomAt(2, 0, 0);
    expect(cam.offsetX).toBeCloseTo(0, 5);
    expect(cam.offsetY).toBeCloseTo(0, 5);
  });

  it('world point under cursor stays fixed when cursor is at canvas centre', () => {
    // With offsetX=0, zoom=1: point under screen (400,300) is some world pos.
    // After zoomAt(2, 400, 300): formula gives
    //   newOffsetX = 400 - (400 - 0) * (2/1) = 400 - 800 = -400
    //   newOffsetY = 300 - (300 - 0) * (2/1) = 300 - 600 = -300
    cam.zoomAt(2, 400, 300);
    expect(cam.offsetX).toBeCloseTo(-400, 5);
    expect(cam.offsetY).toBeCloseTo(-300, 5);
  });

  it('world point under cursor stays fixed when cursor is at arbitrary position', () => {
    cam.offsetX = 50;
    cam.offsetY = 80;
    const screenX = 200;
    const screenY = 150;
    // Capture world position under cursor before zoom
    // screenToWorld formula: px = (sx - offsetX)/zoom = (200-50)/1 = 150
    //                        py = (sy - offsetY)/zoom = (150-80)/1 = 70
    // After zoomAt(1.5, 200, 150):
    //   newZoom = 1.5
    //   newOffsetX = 200 - (200 - 50) * (1.5/1) = 200 - 225 = -25
    //   newOffsetY = 150 - (150 - 80) * (1.5/1) = 150 - 105 =  45
    cam.zoomAt(1.5, screenX, screenY);
    expect(cam.offsetX).toBeCloseTo(-25, 5);
    expect(cam.offsetY).toBeCloseTo( 45, 5);
    expect(cam.zoom).toBeCloseTo(1.5, 5);
  });

  it('offset formula matches documented invariant: newOffsetX = screenX - (screenX - offsetX)*(newZoom/zoom)', () => {
    const screenX = 320;
    const screenY = 240;
    const factor  = 1.25;
    const prevZoom   = cam.zoom;
    const prevOffX   = cam.offsetX;
    const prevOffY   = cam.offsetY;
    const newZoom    = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prevZoom * factor));
    const expectedX  = screenX - (screenX - prevOffX) * (newZoom / prevZoom);
    const expectedY  = screenY - (screenY - prevOffY) * (newZoom / prevZoom);

    cam.zoomAt(factor, screenX, screenY);
    expect(cam.offsetX).toBeCloseTo(expectedX, 5);
    expect(cam.offsetY).toBeCloseTo(expectedY, 5);
    expect(cam.zoom).toBeCloseTo(newZoom, 5);
  });

  it('zoom-at pivot is correct when clamping kicks in', () => {
    // Already at zoom=1, ask for ×0.1 → clamped to MIN_ZOOM=0.5
    const screenX = 400;
    const screenY = 300;
    cam.offsetX = 100;
    cam.offsetY = 50;
    const prevZoom = cam.zoom; // 1
    const newZoom  = MIN_ZOOM; // 0.5
    const expectedX = screenX - (screenX - 100) * (newZoom / prevZoom);
    const expectedY = screenY - (screenY - 50)  * (newZoom / prevZoom);

    cam.zoomAt(0.1, screenX, screenY);
    expect(cam.zoom).toBeCloseTo(MIN_ZOOM, 5);
    expect(cam.offsetX).toBeCloseTo(expectedX, 5);
    expect(cam.offsetY).toBeCloseTo(expectedY, 5);
  });
});

// ---------------------------------------------------------------------------
// setCanvasSize
// ---------------------------------------------------------------------------

describe('Camera.setCanvasSize', () => {
  it('updates canvasWidth and canvasHeight', () => {
    const cam = new Camera();
    cam.setCanvasSize(1920, 1080);
    expect(cam.canvasWidth).toBe(1920);
    expect(cam.canvasHeight).toBe(1080);
  });

  it('does not change zoom or offsets', () => {
    const cam = makeCam({ zoom: 1.5, offsetX: 30, offsetY: -20 });
    cam.setCanvasSize(1280, 720);
    expect(cam.zoom).toBeCloseTo(1.5, 5);
    expect(cam.offsetX).toBeCloseTo(30,  5);
    expect(cam.offsetY).toBeCloseTo(-20, 5);
  });
});

// ---------------------------------------------------------------------------
// setMapSize
// ---------------------------------------------------------------------------

describe('Camera.setMapSize', () => {
  it('can be set without throwing', () => {
    const cam = new Camera();
    expect(() => cam.setMapSize(64, 64)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// centerOn / centerOnTile
// ---------------------------------------------------------------------------

describe('Camera.centerOn', () => {
  it('centers the canvas on the given world position', () => {
    const cam = makeCam({ canvasWidth: 800, canvasHeight: 600 });
    // After centerOn(0, 0): offsetX = 400 - 0 = 400, offsetY = 300 - 0 = 300
    cam.centerOn(0, 0);
    expect(cam.offsetX).toBeCloseTo(400, 5);
    expect(cam.offsetY).toBeCloseTo(300, 5);
  });

  it('formula: offsetX = canvasWidth/2 - (wx-wy)*(TILE_WIDTH/2)*zoom', () => {
    const cam = makeCam({ canvasWidth: 800, canvasHeight: 600, zoom: 1 });
    cam.centerOn(4, 2);
    // offsetX = 400 - (4-2)*32*1 = 400 - 64 = 336
    // offsetY = 300 - (4+2)*16*1 = 300 - 96 = 204
    expect(cam.offsetX).toBeCloseTo(336, 5);
    expect(cam.offsetY).toBeCloseTo(204, 5);
  });

  it('respects current zoom when computing offsets', () => {
    const cam = makeCam({ canvasWidth: 800, canvasHeight: 600, zoom: 2 });
    cam.centerOn(4, 2);
    // offsetX = 400 - (4-2)*32*2 = 400 - 128 = 272
    // offsetY = 300 - (4+2)*16*2 = 300 - 192 = 108
    expect(cam.offsetX).toBeCloseTo(272, 5);
    expect(cam.offsetY).toBeCloseTo(108, 5);
  });
});

describe('Camera.centerOnTile', () => {
  it('centers on tile centre (tx+0.5, ty+0.5)', () => {
    const cam = makeCam({ canvasWidth: 800, canvasHeight: 600, zoom: 1 });
    cam.centerOnTile(3, 3);
    // Equivalent to centerOn(3.5, 3.5)
    // offsetX = 400 - (3.5-3.5)*32 = 400
    // offsetY = 300 - (3.5+3.5)*16 = 300 - 112 = 188
    expect(cam.offsetX).toBeCloseTo(400, 5);
    expect(cam.offsetY).toBeCloseTo(188, 5);
  });

  it('centerOnTile(tx, ty) equals centerOn(tx+0.5, ty+0.5)', () => {
    const cam1 = makeCam({ zoom: 1 });
    const cam2 = makeCam({ zoom: 1 });
    cam1.centerOnTile(7, 5);
    cam2.centerOn(7.5, 5.5);
    expect(cam1.offsetX).toBeCloseTo(cam2.offsetX, 5);
    expect(cam1.offsetY).toBeCloseTo(cam2.offsetY, 5);
  });
});
