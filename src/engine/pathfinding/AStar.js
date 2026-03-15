const D = 1.0;
const D2 = Math.SQRT2;
function heuristic(ax, ay, bx, by) {
    const dx = Math.abs(ax - bx);
    const dy = Math.abs(ay - by);
    return D * (dx + dy) + (D2 - 2 * D) * Math.min(dx, dy);
}
export class AStar {
    findPath(startTx, startTy, goalTx, goalTy, nav) {
        if (!nav.isPassable(goalTx, goalTy))
            return [];
        const open = new Map();
        const closed = new Set();
        const key = (tx, ty) => ty * nav.width + tx;
        const startNode = {
            tx: startTx, ty: startTy,
            g: 0, h: heuristic(startTx, startTy, goalTx, goalTy),
            f: 0, parent: null
        };
        startNode.f = startNode.g + startNode.h;
        open.set(key(startTx, startTy), startNode);
        const dirs = [
            [0, 1, D], [1, 0, D], [0, -1, D], [-1, 0, D],
            [1, 1, D2], [1, -1, D2], [-1, 1, D2], [-1, -1, D2]
        ];
        while (open.size > 0) {
            // Find node with lowest f
            let current = null;
            for (const node of open.values()) {
                if (!current || node.f < current.f)
                    current = node;
            }
            if (!current)
                break;
            if (current.tx === goalTx && current.ty === goalTy) {
                return this.reconstructPath(current);
            }
            open.delete(key(current.tx, current.ty));
            closed.add(key(current.tx, current.ty));
            for (const [dx, dy, cost] of dirs) {
                const nx = current.tx + dx;
                const ny = current.ty + dy;
                if (!nav.isPassable(nx, ny))
                    continue;
                if (closed.has(key(nx, ny)))
                    continue;
                // Diagonal passability check
                if (dx !== 0 && dy !== 0) {
                    if (!nav.isPassable(current.tx + dx, current.ty) ||
                        !nav.isPassable(current.tx, current.ty + dy))
                        continue;
                }
                const g = current.g + cost;
                const k = key(nx, ny);
                const existing = open.get(k);
                if (!existing || g < existing.g) {
                    const h = heuristic(nx, ny, goalTx, goalTy);
                    const node = { tx: nx, ty: ny, g, h, f: g + h, parent: current };
                    open.set(k, node);
                }
            }
        }
        return []; // No path found
    }
    reconstructPath(node) {
        const path = [];
        let current = node;
        while (current) {
            path.unshift({ tx: current.tx, ty: current.ty });
            current = current.parent;
        }
        return path;
    }
}
