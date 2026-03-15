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

export class AStar {
  findPath(
    startTx: number, startTy: number,
    goalTx: number, goalTy: number,
    nav: NavGrid
  ): TileCoord[] {
    if (!nav.isPassable(goalTx, goalTy)) return [];

    const open = new Map<number, Node>();
    const closed = new Set<number>();
    const key = (tx: number, ty: number) => ty * nav.width + tx;

    const startNode: Node = {
      tx: startTx, ty: startTy,
      g: 0, h: heuristic(startTx, startTy, goalTx, goalTy),
      f: 0, parent: null
    };
    startNode.f = startNode.g + startNode.h;
    open.set(key(startTx, startTy), startNode);

    const dirs: [number, number, number][] = [
      [0, 1, D], [1, 0, D], [0, -1, D], [-1, 0, D],
      [1, 1, D2], [1, -1, D2], [-1, 1, D2], [-1, -1, D2]
    ];

    while (open.size > 0) {
      // Find node with lowest f
      let current: Node | null = null;
      for (const node of open.values()) {
        if (!current || node.f < current.f) current = node;
      }
      if (!current) break;

      if (current.tx === goalTx && current.ty === goalTy) {
        return this.reconstructPath(current);
      }

      open.delete(key(current.tx, current.ty));
      closed.add(key(current.tx, current.ty));

      for (const [dx, dy, cost] of dirs) {
        const nx = current.tx + dx;
        const ny = current.ty + dy;
        if (!nav.isPassable(nx, ny)) continue;
        if (closed.has(key(nx, ny))) continue;

        // Diagonal passability check
        if (dx !== 0 && dy !== 0) {
          if (!nav.isPassable(current.tx + dx, current.ty) ||
              !nav.isPassable(current.tx, current.ty + dy)) continue;
        }

        const g = current.g + cost;
        const k = key(nx, ny);
        const existing = open.get(k);
        if (!existing || g < existing.g) {
          const h = heuristic(nx, ny, goalTx, goalTy);
          const node: Node = { tx: nx, ty: ny, g, h, f: g + h, parent: current };
          open.set(k, node);
        }
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
