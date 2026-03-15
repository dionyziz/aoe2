const MAX_ENTRIES = 100;
export class PathCache {
    cache = new Map();
    key(sx, sy, gx, gy) {
        return `${sx},${sy}-${gx},${gy}`;
    }
    get(sx, sy, gx, gy) {
        const entry = this.cache.get(this.key(sx, sy, gx, gy));
        if (!entry)
            return null;
        entry.accessTime = performance.now();
        return entry.path;
    }
    set(sx, sy, gx, gy, path) {
        if (this.cache.size >= MAX_ENTRIES) {
            // Evict LRU
            let oldest = null;
            let oldestTime = Infinity;
            for (const [k, v] of this.cache) {
                if (v.accessTime < oldestTime) {
                    oldest = k;
                    oldestTime = v.accessTime;
                }
            }
            if (oldest)
                this.cache.delete(oldest);
        }
        this.cache.set(this.key(sx, sy, gx, gy), { path, accessTime: performance.now() });
    }
    invalidate() {
        this.cache.clear();
    }
}
