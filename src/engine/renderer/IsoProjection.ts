import { TILE_WIDTH, TILE_HEIGHT } from '../../constants';
import type { Vec2, TileCoord } from '../../types/common';
import type { Camera } from '../camera/Camera';

export class IsoProjection {
  worldToScreen(wx: number, wy: number, elevation: number, camera: Camera): Vec2 {
    const sx = (wx - wy) * (TILE_WIDTH / 2) * camera.zoom + camera.offsetX;
    const sy = (wx + wy) * (TILE_HEIGHT / 2) * camera.zoom
              - elevation * (TILE_HEIGHT / 2) * camera.zoom
              + camera.offsetY;
    return { x: sx, y: sy };
  }

  screenToWorld(sx: number, sy: number, camera: Camera): Vec2 {
    const px = (sx - camera.offsetX) / camera.zoom;
    const py = (sy - camera.offsetY) / camera.zoom;
    const wx = (px / (TILE_WIDTH / 2) + py / (TILE_HEIGHT / 2)) / 2;
    const wy = (py / (TILE_HEIGHT / 2) - px / (TILE_WIDTH / 2)) / 2;
    return { x: wx, y: wy };
  }

  screenToTile(sx: number, sy: number, camera: Camera): TileCoord {
    const world = this.screenToWorld(sx, sy, camera);
    return { tx: Math.floor(world.x), ty: Math.floor(world.y) };
  }

  visibleTileRange(
    canvasWidth: number, canvasHeight: number,
    camera: Camera,
    mapW: number, mapH: number
  ): { minTx: number; maxTx: number; minTy: number; maxTy: number } {
    // Check all 4 corners of the screen
    const corners = [
      this.screenToWorld(0, 0, camera),
      this.screenToWorld(canvasWidth, 0, camera),
      this.screenToWorld(0, canvasHeight, camera),
      this.screenToWorld(canvasWidth, canvasHeight, camera),
    ];

    const margin = 2;
    const wxs = corners.map(c => c.x);
    const wys = corners.map(c => c.y);

    return {
      minTx: Math.max(0, Math.floor(Math.min(...wxs)) - margin),
      maxTx: Math.min(mapW - 1, Math.ceil(Math.max(...wxs)) + margin),
      minTy: Math.max(0, Math.floor(Math.min(...wys)) - margin),
      maxTy: Math.min(mapH - 1, Math.ceil(Math.max(...wys)) + margin),
    };
  }
}
