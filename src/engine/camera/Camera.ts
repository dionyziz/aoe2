import { MIN_ZOOM, MAX_ZOOM, TILE_WIDTH, TILE_HEIGHT } from '../../constants';
import { clamp } from '../../utils/math';

export class Camera {
  offsetX = 0;
  offsetY = 0;
  zoom = 1.0;
  canvasWidth = 800;
  canvasHeight = 600;

  private mapWidth = 32;
  private mapHeight = 32;

  setMapSize(w: number, h: number): void {
    this.mapWidth = w;
    this.mapHeight = h;
  }

  pan(dx: number, dy: number): void {
    this.offsetX += dx;
    this.offsetY += dy;
    // No hard clamp for now — free pan
  }

  zoomAt(factor: number, screenX: number, screenY: number): void {
    const newZoom = clamp(this.zoom * factor, MIN_ZOOM, MAX_ZOOM);
    this.offsetX = screenX - (screenX - this.offsetX) * (newZoom / this.zoom);
    this.offsetY = screenY - (screenY - this.offsetY) * (newZoom / this.zoom);
    this.zoom = newZoom;
  }

  centerOnTile(tx: number, ty: number): void {
    const sx = (tx - ty) * (TILE_WIDTH / 2);
    const sy = (tx + ty) * (TILE_HEIGHT / 2);
    this.offsetX = this.canvasWidth / 2 - sx * this.zoom;
    this.offsetY = this.canvasHeight / 2 - sy * this.zoom;
  }
}
