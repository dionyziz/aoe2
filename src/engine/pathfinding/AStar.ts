import type { TileCoord } from '../../types/common';
import type { NavGrid } from './NavGrid';

const D = 1.0;
const D2 = Math.SQRT2;

function heuristic(ax: number, ay: number, bx: number, by: number): number {
  const dx = Math.abs(ax - bx);
  const dy = Math.abs(ay - by);
  return D * (dx + dy) + (D2 - 2 * D) * Math.min(dx, dy);
}

interface Node {
  tx: number; ty: number;
  g: number; h: number; f: number;
  parent: Node | null;
}

/**
 * Binary min-heap keyed on node.f — O(log N) push/pop.
 * Replaces the previous O(N) linear scan over the open Map.
 */
class MinHeap {
  private data: Node[] = [];
  get size(): number { return this.data.length; }

  push(node: Node): void {
    this.data.push(node);
    this._bubbleUp(this.data.length - 1);
  }

  pop(): Node | undefined {
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0 && last !== undefined) {
      this.data[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  private _bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.data[parent].f <= this.data[i].f) break;
      [this.data[parent], this.data[i]] = [this.data[i], this.data[parent]];
      i = parent;
    }
  }

  private _sinkDown(i: number): void {
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.data[l].f < this.data[smallest].f) smallest = l;
      if (r < n && this.data[r].f < this.data[smallest].f) smallest = r;
      if (smallest === i) break;
      [this.data[smallest], this.data[i]] = [this.data[i], this.data[smallest]];
      i = smallest;
    }
  }
}

export class AStar {
  findPath(
    startTx: number, startTy: number,
    goalTx: number, goalTy: number,
    nav: NavGrid
  ): TileCoord[] {
    if (!nav.isPassable(goalTx, goalTy)) return [];

    const closed = new Set<number>();
    // Best g-score seen per cell — used to discard stale heap entries.
    const gScore = new Map<number, number>();
    const key = (tx: number, ty: number) => ty * nav.width + tx;

    const startNode: Node = {
      tx: startTx, ty: startTy,
      g: 0, h: heuristic(startTx, startTy, goalTx, goalTy),
      f: 0, parent: null
    };
    startNode.f = startNode.g + startNode.h;

    const heap = new MinHeap();
    heap.push(startNode);
    gScore.set(key(startTx, startTy), 0);

    const dirs: [number, number, number][] = [
      [0, 1, D], [1, 0, D], [0, -1, D], [-1, 0, D],
      [1, 1, D2], [1, -1, D2], [-1, 1, D2], [-1, -1, D2]
    ];

    while (heap.size > 0) {
      const current = heap.pop();
      if (!current) break;

      const ck = key(current.tx, current.ty);
      if (closed.has(ck)) continue; // stale heap entry — skip
      closed.add(ck);

      if (current.tx === goalTx && current.ty === goalTy) {
        return this.reconstructPath(current);
      }

      for (const [dx, dy, cost] of dirs) {
        const nx = current.tx + dx;
        const ny = current.ty + dy;
        if (!nav.isPassable(nx, ny)) continue;
        const nk = key(nx, ny);
        if (closed.has(nk)) continue;

        // Diagonal passability check
        if (dx !== 0 && dy !== 0) {
          if (!nav.isPassable(current.tx + dx, current.ty) ||
              !nav.isPassable(current.tx, current.ty + dy)) continue;
        }

        const g = current.g + cost;
        const existing = gScore.get(nk);
        if (existing !== undefined && g >= existing) continue;

        gScore.set(nk, g);
        const h = heuristic(nx, ny, goalTx, goalTy);
        const node: Node = { tx: nx, ty: ny, g, h, f: g + h, parent: current };
        heap.push(node);
      }
    }
    return []; // No path found
  }

  private reconstructPath(node: Node): TileCoord[] {
    const path: TileCoord[] = [];
    let current: Node | null = node;
    while (current) {
      path.unshift({ tx: current.tx, ty: current.ty });
      current = current.parent;
    }
    return path;
  }
}
