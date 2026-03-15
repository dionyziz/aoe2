import type { TileCoord } from '../../types/common';

interface CacheEntry {
  path: TileCoord[];
  accessTime: number;
}

const MAX_ENTRIES = 100;

export class PathCache {
  private cache = new Map<string, CacheEntry>();

  private key(sx: number, sy: number, gx: number, gy: number): string {
    return `${sx},${sy}-${gx},${gy}`;
  }

  get(sx: number, sy: number, gx: number, gy: number): TileCoord[] | null {
    const entry = this.cache.get(this.key(sx, sy, gx, gy));
    if (!entry) return null;
    entry.accessTime = performance.now();
    return entry.path;
  }

  set(sx: number, sy: number, gx: number, gy: number, path: TileCoord[]): void {
    if (this.cache.size >= MAX_ENTRIES) {
      // Evict LRU
      let oldest: string | null = null;
      let oldestTime = Infinity;
      for (const [k, v] of this.cache) {
        if (v.accessTime < oldestTime) { oldest = k; oldestTime = v.accessTime; }
      }
      if (oldest) this.cache.delete(oldest);
    }
    this.cache.set(this.key(sx, sy, gx, gy), { path, accessTime: performance.now() });
  }

  invalidate(): void {
    this.cache.clear();
  }
}
