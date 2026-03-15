import { MapData } from './MapData';
import { TerrainType } from '../../types/map';
export const DEFAULT_GEN_OPTIONS = {
    width: 32,
    height: 32,
    seed: 12345,
    waterLevel: 0.25,
    forestDensity: 0.15,
    numGoldMines: 4,
    numStoneMines: 4,
    playerCount: 2,
};
export class MapGenerator {
    generate(opts = DEFAULT_GEN_OPTIONS) {
        const rng = seededRng(opts.seed);
        const { width, height } = opts;
        // 1. Generate heightmap using value noise
        const heightmap = this.generateHeightmap(width, height, rng);
        // 2. Generate moisture map (for terrain variety)
        const moisture = this.generateHeightmap(width, height, rng);
        // 3. Assign terrain types
        const tiles = [];
        for (let ty = 0; ty < height; ty++) {
            tiles[ty] = [];
            for (let tx = 0; tx < width; tx++) {
                const h = heightmap[ty][tx];
                const m = moisture[ty][tx];
                tiles[ty][tx] = this.assignTerrain(h, m, opts.waterLevel);
            }
        }
        // 4. Smooth elevation
        const elevations = this.computeElevations(heightmap, opts.waterLevel);
        for (let ty = 0; ty < height; ty++) {
            for (let tx = 0; tx < width; tx++) {
                tiles[ty][tx].elevation = elevations[ty][tx];
            }
        }
        // 5. Place resources
        const resources = [];
        let resourceId = 0;
        // Forest clusters
        const forestTiles = this.placeForestClusters(tiles, width, height, opts.forestDensity, rng);
        for (const { tx, ty } of forestTiles) {
            tiles[ty][tx].terrain = TerrainType.Forest;
            tiles[ty][tx].passable = false;
            tiles[ty][tx].resourceId = resourceId;
            resources.push({ id: resourceId++, type: 'wood', remaining: 100, tx, ty });
        }
        // Gold mines
        for (let i = 0; i < opts.numGoldMines; i++) {
            const pos = this.findPassableTile(tiles, width, height, rng);
            if (pos) {
                tiles[pos.ty][pos.tx].terrain = TerrainType.Rock;
                tiles[pos.ty][pos.tx].passable = false;
                tiles[pos.ty][pos.tx].resourceId = resourceId;
                resources.push({ id: resourceId++, type: 'gold', remaining: 800, tx: pos.tx, ty: pos.ty });
            }
        }
        // Stone mines
        for (let i = 0; i < opts.numStoneMines; i++) {
            const pos = this.findPassableTile(tiles, width, height, rng);
            if (pos) {
                tiles[pos.ty][pos.tx].terrain = TerrainType.Rock;
                tiles[pos.ty][pos.tx].passable = false;
                tiles[pos.ty][pos.tx].resourceId = resourceId;
                resources.push({ id: resourceId++, type: 'stone', remaining: 350, tx: pos.tx, ty: pos.ty });
            }
        }
        // 6. Player start positions (corners / spread evenly)
        const playerStarts = this.computePlayerStarts(tiles, width, height, opts.playerCount, rng);
        return new MapData({
            version: 1,
            name: `Generated Map (seed ${opts.seed})`,
            width,
            height,
            tiles,
            resources,
            playerStarts,
        });
    }
    generateHeightmap(width, height, rng) {
        // Simple value noise: generate coarse grid, interpolate
        const scale = 6; // lower = smoother
        const coarseW = Math.ceil(width / scale) + 2;
        const coarseH = Math.ceil(height / scale) + 2;
        const coarse = Array.from({ length: coarseH }, () => Array.from({ length: coarseW }, () => rng()));
        const map = [];
        for (let ty = 0; ty < height; ty++) {
            map[ty] = [];
            for (let tx = 0; tx < width; tx++) {
                const cx = tx / scale;
                const cy = ty / scale;
                const ix = Math.floor(cx);
                const iy = Math.floor(cy);
                const fx = cx - ix;
                const fy = cy - iy;
                const v00 = coarse[iy][ix];
                const v10 = coarse[iy][ix + 1];
                const v01 = coarse[iy + 1]?.[ix] ?? v00;
                const v11 = coarse[iy + 1]?.[ix + 1] ?? v10;
                // Bilinear interpolation
                map[ty][tx] = lerp(lerp(v00, v10, smoothstep(fx)), lerp(v01, v11, smoothstep(fx)), smoothstep(fy));
            }
        }
        return map;
    }
    assignTerrain(h, m, waterLevel) {
        let terrain;
        let passable = true;
        if (h < waterLevel - 0.05) {
            terrain = TerrainType.Water;
            passable = false;
        }
        else if (h < waterLevel) {
            terrain = TerrainType.ShallowWater;
            passable = false;
        }
        else if (h < waterLevel + 0.1) {
            terrain = m > 0.6 ? TerrainType.Grass : TerrainType.Sand;
        }
        else if (h > 0.85) {
            terrain = TerrainType.Snow;
        }
        else {
            terrain = m > 0.55 ? TerrainType.Grass : TerrainType.Dirt;
        }
        return { terrain, elevation: 0, passable, resourceId: null, objectId: null };
    }
    computeElevations(heightmap, waterLevel) {
        const height = heightmap.length;
        const width = heightmap[0].length;
        const elev = [];
        for (let ty = 0; ty < height; ty++) {
            elev[ty] = [];
            for (let tx = 0; tx < width; tx++) {
                const h = heightmap[ty][tx];
                if (h < waterLevel) {
                    elev[ty][tx] = 0;
                }
                else {
                    // 0, 1, or 2 elevation levels
                    elev[ty][tx] = h > 0.75 ? 2 : h > 0.6 ? 1 : 0;
                }
            }
        }
        return elev;
    }
    placeForestClusters(tiles, width, height, density, rng) {
        const result = [];
        const numClusters = Math.floor(width * height * density / 8);
        for (let i = 0; i < numClusters; i++) {
            const cx = Math.floor(rng() * width);
            const cy = Math.floor(rng() * height);
            const radius = 1 + Math.floor(rng() * 2);
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const tx = cx + dx;
                    const ty = cy + dy;
                    if (tx < 1 || ty < 1 || tx >= width - 1 || ty >= height - 1)
                        continue;
                    const tile = tiles[ty][tx];
                    if (!tile.passable || tile.resourceId !== null)
                        continue;
                    if (rng() < 0.7)
                        result.push({ tx, ty });
                }
            }
        }
        return result;
    }
    findPassableTile(tiles, width, height, rng, attempts = 100) {
        for (let i = 0; i < attempts; i++) {
            const tx = 2 + Math.floor(rng() * (width - 4));
            const ty = 2 + Math.floor(rng() * (height - 4));
            if (tiles[ty][tx].passable && tiles[ty][tx].resourceId === null) {
                return { tx, ty };
            }
        }
        return null;
    }
    computePlayerStarts(tiles, width, height, playerCount, _rng) {
        // Place players near corners, find nearest passable tile
        const corners = [
            { tx: 3, ty: 3 },
            { tx: width - 4, ty: height - 4 },
            { tx: width - 4, ty: 3 },
            { tx: 3, ty: height - 4 },
        ];
        const starts = [];
        for (let i = 0; i < Math.min(playerCount, corners.length); i++) {
            const c = corners[i];
            const found = this.findNearestPassable(tiles, width, height, c.tx, c.ty);
            if (found)
                starts.push(found);
        }
        return starts;
    }
    findNearestPassable(tiles, width, height, cx, cy) {
        for (let r = 0; r <= 5; r++) {
            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    const tx = cx + dx;
                    const ty = cy + dy;
                    if (tx < 0 || ty < 0 || tx >= width || ty >= height)
                        continue;
                    if (tiles[ty][tx].passable)
                        return { tx, ty };
                }
            }
        }
        return null;
    }
}
function seededRng(seed) {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0xffffffff;
    };
}
function lerp(a, b, t) {
    return a + (b - a) * t;
}
function smoothstep(t) {
    return t * t * (3 - 2 * t);
}
