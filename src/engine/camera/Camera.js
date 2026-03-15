import { MIN_ZOOM, MAX_ZOOM, TILE_WIDTH, TILE_HEIGHT } from '../../constants';
import { clamp } from '../../utils/math';
export class Camera {
    offsetX = 0;
    offsetY = 0;
    zoom = 1.0;
    canvasWidth = 800;
    canvasHeight = 600;
    mapWidth = 32;
    mapHeight = 32;
    setMapSize(w, h) {
        this.mapWidth = w;
        this.mapHeight = h;
    }
    setCanvasSize(w, h) {
        this.canvasWidth = w;
        this.canvasHeight = h;
    }
    pan(dx, dy) {
        this.offsetX += dx;
        this.offsetY += dy;
        // No hard clamp for now — free pan
    }
    zoomAt(factor, screenX, screenY) {
        const newZoom = clamp(this.zoom * factor, MIN_ZOOM, MAX_ZOOM);
        this.offsetX = screenX - (screenX - this.offsetX) * (newZoom / this.zoom);
        this.offsetY = screenY - (screenY - this.offsetY) * (newZoom / this.zoom);
        this.zoom = newZoom;
    }
    /** Center camera on world position (wx, wy) */
    centerOn(wx, wy) {
        this.offsetX = this.canvasWidth / 2 - (wx - wy) * (TILE_WIDTH / 2) * this.zoom;
        this.offsetY = this.canvasHeight / 2 - (wx + wy) * (TILE_HEIGHT / 2) * this.zoom;
    }
    /** Center camera on tile (tx, ty) — alias */
    centerOnTile(tx, ty) {
        this.centerOn(tx + 0.5, ty + 0.5);
    }
}
