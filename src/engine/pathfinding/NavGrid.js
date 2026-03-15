export class NavGrid {
    width;
    height;
    passable;
    constructor(mapData) {
        this.width = mapData.width;
        this.height = mapData.height;
        this.passable = new Uint8Array(this.width * this.height);
        this.rebuild(mapData);
    }
    rebuild(mapData) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.passable[y * this.width + x] = mapData.isPassable(x, y) ? 1 : 0;
            }
        }
    }
    isPassable(tx, ty) {
        if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height)
            return false;
        return this.passable[ty * this.width + tx] === 1;
    }
    setPassable(tx, ty, value) {
        if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height)
            return;
        this.passable[ty * this.width + tx] = value ? 1 : 0;
    }
}
