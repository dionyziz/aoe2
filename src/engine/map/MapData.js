import { TerrainType } from '../../types/map';
import { MapGenerator, DEFAULT_GEN_OPTIONS } from './MapGenerator';
export class MapData {
    width;
    height;
    name;
    tiles;
    resources;
    playerStarts;
    constructor(data) {
        this.width = data.width;
        this.height = data.height;
        this.name = data.name;
        this.tiles = data.tiles;
        this.resources = data.resources;
        this.playerStarts = data.playerStarts;
    }
    getTile(tx, ty) {
        if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height)
            return null;
        return this.tiles[ty][tx];
    }
    isPassable(tx, ty) {
        const tile = this.getTile(tx, ty);
        return tile?.passable ?? false;
    }
    isInBounds(tx, ty) {
        return tx >= 0 && ty >= 0 && tx < this.width && ty < this.height;
    }
    getElevation(tx, ty) {
        return this.getTile(tx, ty)?.elevation ?? 0;
    }
    static generate(opts) {
        const generator = new MapGenerator();
        return generator.generate({ ...DEFAULT_GEN_OPTIONS, ...opts });
    }
    static createFlat(width, height) {
        const tiles = [];
        for (let y = 0; y < height; y++) {
            tiles[y] = [];
            for (let x = 0; x < width; x++) {
                tiles[y][x] = {
                    terrain: TerrainType.Grass,
                    elevation: 0,
                    passable: true,
                    resourceId: null,
                    objectId: null
                };
            }
        }
        // Add some variety
        for (let y = 5; y < 10; y++) {
            for (let x = 5; x < 10; x++) {
                tiles[y][x].terrain = TerrainType.Dirt;
            }
        }
        for (let y = 12; y < 16; y++) {
            for (let x = 12; x < 16; x++) {
                tiles[y][x].terrain = TerrainType.Water;
                tiles[y][x].passable = false;
            }
        }
        // Elevation bump
        for (let y = 18; y < 22; y++) {
            for (let x = 18; x < 22; x++) {
                tiles[y][x].elevation = 1;
            }
        }
        return new MapData({
            version: 1,
            name: 'Test Flat',
            width,
            height,
            tiles,
            resources: [],
            playerStarts: [{ tx: 4, ty: 4 }, { tx: width - 4, ty: height - 4 }]
        });
    }
}
/** Alias used by the foundation-layer Game */
export const MapDataStore = MapData;
