import { describe, it, expect, beforeEach } from 'vitest';
import { NavGrid } from './NavGrid';
import type { MapData as MapDataType } from '../../types/map';
import { TerrainType } from '../../types/map';
import type { TileData } from '../../types/map';

// ---------------------------------------------------------------------------
// Helper: build a minimal MapData-compatible object that NavGrid accepts.
// NavGrid only calls mapData.width, mapData.height, and mapData.isPassable().
// ---------------------------------------------------------------------------
function makeFakeMapData(
  width: number,
  height: number,
  passableOverrides: Array<{ tx: number; ty: number; passable: boolean }> = []
): ConstructorParameters<typeof NavGrid>[0] {
  const tiles: TileData[][] = [];
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      tiles[y][x] = {
        terrain: TerrainType.Grass,
        elevation: 0,
        passable: true,
        resourceId: null,
        objectId: null,
      };
    }
  }
  for (const { tx, ty, passable } of passableOverrides) {
    if (ty >= 0 && ty < height && tx >= 0 && tx < width) {
      tiles[ty][tx].passable = passable;
    }
  }

  return {
    width,
    height,
    name: 'test',
    tiles,
    resources: [],
    playerStarts: [],
    getTile(tx: number, ty: number) {
      if (tx < 0 || ty < 0 || tx >= width || ty >= height) return null;
      return tiles[ty][tx];
    },
    isPassable(tx: number, ty: number) {
      if (tx < 0 || ty < 0 || tx >= width || ty >= height) return false;
      return tiles[ty][tx].passable;
    },
    isInBounds(tx: number, ty: number) {
      return tx >= 0 && ty >= 0 && tx < width && ty < height;
    },
    getElevation(tx: number, ty: number) {
      return tiles?.[ty]?.[tx]?.elevation ?? 0;
    },
  } as unknown as ConstructorParameters<typeof NavGrid>[0];
}

// ---------------------------------------------------------------------------
// NavGrid tests
// ---------------------------------------------------------------------------
describe('NavGrid', () => {
  describe('width and height', () => {
    it('exposes the width and height supplied by the map', () => {
      const nav = new NavGrid(makeFakeMapData(10, 15));
      expect(nav.width).toBe(10);
      expect(nav.height).toBe(15);
    });
  });

  describe('isPassable', () => {
    it('returns true for an open tile', () => {
      const nav = new NavGrid(makeFakeMapData(5, 5));
      expect(nav.isPassable(2, 2)).toBe(true);
    });

    it('returns false for a tile that is blocked in the map data', () => {
      const nav = new NavGrid(
        makeFakeMapData(5, 5, [{ tx: 2, ty: 2, passable: false }])
      );
      expect(nav.isPassable(2, 2)).toBe(false);
    });

    it('returns false for negative x', () => {
      const nav = new NavGrid(makeFakeMapData(5, 5));
      expect(nav.isPassable(-1, 0)).toBe(false);
    });

    it('returns false for negative y', () => {
      const nav = new NavGrid(makeFakeMapData(5, 5));
      expect(nav.isPassable(0, -1)).toBe(false);
    });

    it('returns false for x equal to width (out of bounds)', () => {
      const nav = new NavGrid(makeFakeMapData(5, 5));
      expect(nav.isPassable(5, 0)).toBe(false);
    });

    it('returns false for y equal to height (out of bounds)', () => {
      const nav = new NavGrid(makeFakeMapData(5, 5));
      expect(nav.isPassable(0, 5)).toBe(false);
    });

    it('returns false for both coordinates far out of bounds', () => {
      const nav = new NavGrid(makeFakeMapData(5, 5));
      expect(nav.isPassable(100, 100)).toBe(false);
    });
  });

  describe('setPassable', () => {
    it('setPassable(false) blocks a previously open tile', () => {
      const nav = new NavGrid(makeFakeMapData(5, 5));
      expect(nav.isPassable(3, 3)).toBe(true);
      nav.setPassable(3, 3, false);
      expect(nav.isPassable(3, 3)).toBe(false);
    });

    it('setPassable(true) re-opens a blocked tile', () => {
      const nav = new NavGrid(
        makeFakeMapData(5, 5, [{ tx: 1, ty: 1, passable: false }])
      );
      expect(nav.isPassable(1, 1)).toBe(false);
      nav.setPassable(1, 1, true);
      expect(nav.isPassable(1, 1)).toBe(true);
    });

    it('setPassable on out-of-bounds coordinates does not throw', () => {
      const nav = new NavGrid(makeFakeMapData(5, 5));
      expect(() => nav.setPassable(-1, 0, false)).not.toThrow();
      expect(() => nav.setPassable(0, 10, false)).not.toThrow();
    });

    it('blocking one tile does not affect its neighbours', () => {
      const nav = new NavGrid(makeFakeMapData(5, 5));
      nav.setPassable(2, 2, false);
      expect(nav.isPassable(2, 1)).toBe(true);
      expect(nav.isPassable(2, 3)).toBe(true);
      expect(nav.isPassable(1, 2)).toBe(true);
      expect(nav.isPassable(3, 2)).toBe(true);
    });
  });
});
