import { describe, it, expect, beforeEach } from 'vitest';
import { AStar } from './AStar';
import { NavGrid } from './NavGrid';
import type { TileCoord } from '../../types/common';
import { TerrainType } from '../../types/map';
import type { TileData } from '../../types/map';

// ---------------------------------------------------------------------------
// Helper: build a NavGrid of the given size, all passable by default.
// Individual cells can be blocked by passing their coordinates.
// ---------------------------------------------------------------------------
function makeNav(
  width: number,
  height: number,
  blocked: Array<{ tx: number; ty: number }> = []
): NavGrid {
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
  for (const { tx, ty } of blocked) {
    if (ty >= 0 && ty < height && tx >= 0 && tx < width) {
      tiles[ty][tx].passable = false;
    }
  }

  const fakeMap = {
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
    getElevation() { return 0; },
  } as unknown as ConstructorParameters<typeof NavGrid>[0];

  return new NavGrid(fakeMap);
}

// Check that every consecutive pair in the path is 8-directionally adjacent.
function assertEachStepAdjacent(path: TileCoord[]): void {
  for (let i = 1; i < path.length; i++) {
    const dx = Math.abs(path[i].tx - path[i - 1].tx);
    const dy = Math.abs(path[i].ty - path[i - 1].ty);
    expect(dx).toBeLessThanOrEqual(1);
    expect(dy).toBeLessThanOrEqual(1);
    // Must actually move (no duplicate tiles)
    expect(dx + dy).toBeGreaterThan(0);
  }
}

// ---------------------------------------------------------------------------
// AStar tests
// ---------------------------------------------------------------------------
describe('AStar', () => {
  let astar: AStar;
  let nav10: NavGrid; // 10×10, fully passable

  beforeEach(() => {
    astar = new AStar();
    nav10 = makeNav(10, 10);
  });

  // -------------------------------------------------------------------------
  // Basic path shapes
  // -------------------------------------------------------------------------
  describe('adjacent tile', () => {
    it('returns a path of length 2 (start + goal) for a single east step', () => {
      const path = astar.findPath(0, 0, 1, 0, nav10);
      // reconstructPath always includes the start node
      expect(path).toHaveLength(2);
      expect(path[0]).toEqual({ tx: 0, ty: 0 });
      expect(path[1]).toEqual({ tx: 1, ty: 0 });
    });

    it('returns a path of length 2 for a single south step', () => {
      const path = astar.findPath(0, 0, 0, 1, nav10);
      expect(path).toHaveLength(2);
      expect(path[path.length - 1]).toEqual({ tx: 0, ty: 1 });
    });
  });

  describe('straight-line path', () => {
    it('reaches (5,0) from (0,0) with the correct endpoint', () => {
      const path = astar.findPath(0, 0, 5, 0, nav10);
      expect(path[0]).toEqual({ tx: 0, ty: 0 });
      expect(path[path.length - 1]).toEqual({ tx: 5, ty: 0 });
    });

    it('produces exactly 6 nodes (start + 5 steps east) on a clear east run', () => {
      const path = astar.findPath(0, 0, 5, 0, nav10);
      // Optimal straight-line east: 6 nodes
      expect(path).toHaveLength(6);
    });

    it('every step is eastward (ty constant, tx increases)', () => {
      const path = astar.findPath(0, 0, 5, 0, nav10);
      for (let i = 0; i < path.length; i++) {
        expect(path[i].tx).toBe(i);
        expect(path[i].ty).toBe(0);
      }
    });
  });

  describe('diagonal path', () => {
    it('reaches (3,3) from (0,0) with the correct endpoint', () => {
      const path = astar.findPath(0, 0, 3, 3, nav10);
      expect(path[0]).toEqual({ tx: 0, ty: 0 });
      expect(path[path.length - 1]).toEqual({ tx: 3, ty: 3 });
    });

    it('takes exactly 4 nodes (start + 3 diagonal steps)', () => {
      const path = astar.findPath(0, 0, 3, 3, nav10);
      // Pure diagonal: 4 nodes
      expect(path).toHaveLength(4);
    });

    it('every step moves one tile diagonally south-east', () => {
      const path = astar.findPath(0, 0, 3, 3, nav10);
      for (let i = 0; i < path.length; i++) {
        expect(path[i]).toEqual({ tx: i, ty: i });
      }
    });
  });

  // -------------------------------------------------------------------------
  // Same-tile (trivial) case
  // -------------------------------------------------------------------------
  describe('same tile', () => {
    it('returns a path containing only the start/goal tile', () => {
      const path = astar.findPath(2, 2, 2, 2, nav10);
      expect(path).toHaveLength(1);
      expect(path[0]).toEqual({ tx: 2, ty: 2 });
    });
  });

  // -------------------------------------------------------------------------
  // Obstacle avoidance
  // -------------------------------------------------------------------------
  describe('obstacle avoidance', () => {
    it('routes around a vertical wall in the middle of the grid', () => {
      // Build a vertical wall at x=5, y=0..8 — leave y=9 open as a passage.
      const blocked = [];
      for (let y = 0; y <= 8; y++) {
        blocked.push({ tx: 5, ty: y });
      }
      const nav = makeNav(10, 10, blocked);

      const path = astar.findPath(0, 0, 9, 0, nav);

      expect(path.length).toBeGreaterThan(0);
      expect(path[0]).toEqual({ tx: 0, ty: 0 });
      expect(path[path.length - 1]).toEqual({ tx: 9, ty: 0 });

      // No step in the path should land on the wall.
      for (const step of path) {
        const onWall = step.tx === 5 && step.ty <= 8;
        expect(onWall).toBe(false);
      }
    });

    it('each step in the around-wall path is 8-directionally adjacent', () => {
      const blocked = [];
      for (let y = 0; y <= 8; y++) {
        blocked.push({ tx: 5, ty: y });
      }
      const nav = makeNav(10, 10, blocked);
      const path = astar.findPath(0, 0, 9, 0, nav);
      assertEachStepAdjacent(path);
    });
  });

  // -------------------------------------------------------------------------
  // No path (completely surrounded)
  // -------------------------------------------------------------------------
  describe('no path', () => {
    it('returns an empty array when the goal is completely surrounded', () => {
      // Surround (5,5) on all 8 neighbours
      const blocked = [
        { tx: 4, ty: 4 }, { tx: 5, ty: 4 }, { tx: 6, ty: 4 },
        { tx: 4, ty: 5 },                    { tx: 6, ty: 5 },
        { tx: 4, ty: 6 }, { tx: 5, ty: 6 }, { tx: 6, ty: 6 },
      ];
      const nav = makeNav(10, 10, blocked);
      const path = astar.findPath(0, 0, 5, 5, nav);
      expect(path).toHaveLength(0);
    });

    it('returns an empty array when the goal tile itself is blocked', () => {
      const nav = makeNav(10, 10, [{ tx: 7, ty: 7 }]);
      const path = astar.findPath(0, 0, 7, 7, nav);
      expect(path).toHaveLength(0);
    });

    it('returns an empty array when the start is blocked off from the goal', () => {
      // Wall spanning the full height at x=3, no gap.
      const blocked = Array.from({ length: 10 }, (_, y) => ({ tx: 3, ty: y }));
      const nav = makeNav(10, 10, blocked);
      const path = astar.findPath(0, 0, 9, 9, nav);
      expect(path).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Path cost: diagonal vs. L-shaped
  // -------------------------------------------------------------------------
  describe('path cost', () => {
    it('diagonal path to (3,3) is strictly shorter in node count than an L-shaped route', () => {
      // An L-shaped path to (3,3) needs at least 7 nodes (3 east + 3 south + start).
      // The diagonal path needs only 4 nodes.
      const diagonalPath = astar.findPath(0, 0, 3, 3, nav10);
      // L-shaped: go east 3 then south 3 → 6 steps → 7 nodes minimum
      expect(diagonalPath.length).toBeLessThan(7);
    });

    it('diagonal path has lower accumulated cost than equivalent Manhattan path', () => {
      // Cost of 3 diagonal steps = 3 * sqrt(2) ≈ 4.243
      // Cost of 3 east + 3 south = 6 * 1 = 6
      // We verify indirectly: AStar picks the shortest-cost path,
      // and the diagonal path has length 4 (not 7).
      const path = astar.findPath(0, 0, 3, 3, nav10);
      expect(path).toHaveLength(4);
    });
  });

  // -------------------------------------------------------------------------
  // Large grid: corner to corner
  // -------------------------------------------------------------------------
  describe('large grid', () => {
    it('finds a path from (0,0) to (49,49) on a 50×50 open grid', () => {
      const nav50 = makeNav(50, 50);
      const path = astar.findPath(0, 0, 49, 49, nav50);
      expect(path.length).toBeGreaterThan(0);
      expect(path[0]).toEqual({ tx: 0, ty: 0 });
      expect(path[path.length - 1]).toEqual({ tx: 49, ty: 49 });
    });

    it('large-grid path is purely diagonal (50 nodes for 49 steps)', () => {
      const nav50 = makeNav(50, 50);
      const path = astar.findPath(0, 0, 49, 49, nav50);
      // Pure diagonal from (0,0) to (49,49) → 50 nodes
      expect(path).toHaveLength(50);
    });

    it('every step in the large-grid path is 8-directionally adjacent', () => {
      const nav50 = makeNav(50, 50);
      const path = astar.findPath(0, 0, 49, 49, nav50);
      assertEachStepAdjacent(path);
    });
  });

  // -------------------------------------------------------------------------
  // Returned path structure: each step is adjacent to the previous
  // -------------------------------------------------------------------------
  describe('returned path adjacency', () => {
    it('every consecutive pair of nodes is 8-directionally adjacent — straight line', () => {
      const path = astar.findPath(0, 0, 9, 0, nav10);
      assertEachStepAdjacent(path);
    });

    it('every consecutive pair of nodes is 8-directionally adjacent — diagonal', () => {
      const path = astar.findPath(0, 0, 9, 9, nav10);
      assertEachStepAdjacent(path);
    });

    it('every consecutive pair of nodes is 8-directionally adjacent — arbitrary point', () => {
      const path = astar.findPath(1, 3, 8, 6, nav10);
      assertEachStepAdjacent(path);
    });

    it('path starts at the given start tile', () => {
      const path = astar.findPath(2, 3, 7, 8, nav10);
      expect(path[0]).toEqual({ tx: 2, ty: 3 });
    });

    it('path ends at the given goal tile', () => {
      const path = astar.findPath(2, 3, 7, 8, nav10);
      expect(path[path.length - 1]).toEqual({ tx: 7, ty: 8 });
    });
  });
});
