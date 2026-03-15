import { TILE_WIDTH, TILE_HEIGHT } from '../../constants';
import type { Vec2, TileCoord } from '../../types/common';
import type { Camera } from '../camera/Camera';

export const IsoProjection = {
  worldToScreen(wx: number, wy: number, elevation: number, camera: Camera): Vec2 {
    const sx = (wx - wy) * (TILE_WIDTH / 2) * camera.zoom + camera.offsetX;
    const sy = (wx + wy) * (TILE_HEIGHT / 2) * camera.zoom
              - elevation * (TILE_HEIGHT / 2) * camera.zoom
              + camera.offsetY;
    return { x: sx, y: sy };
  },

  screenToWorld(sx: number, sy: number, camera: Camera): Vec2 {
    const px = (sx - camera.offsetX) / camera.zoom;
    const py = (sy - camera.offsetY) / camera.zoom;
    const wx = (px / (TILE_WIDTH / 2) + py / (TILE_HEIGHT / 2)) / 2;
    const wy = (py / (TILE_HEIGHT / 2) - px / (TILE_WIDTH / 2)) / 2;
    return { x: wx, y: wy };
  },

  screenToTile(sx: number, sy: number, camera: Camera): TileCoord {
    const w = IsoProjection.screenToWorld(sx, sy, camera);
    return { tx: Math.floor(w.x), ty: Math.floor(w.y) };
  },

  visibleTileRange(
    camera: Camera,
    mapW: number,
    mapH: number
  ): { minTx: number; maxTx: number; minTy: number; maxTy: number } {
    const corners = [
      IsoProjection.screenToWorld(0, 0, camera),
      IsoProjection.screenToWorld(camera.canvasWidth, 0, camera),
      IsoProjection.screenToWorld(0, camera.canvasHeight, camera),
      IsoProjection.screenToWorld(camera.canvasWidth, camera.canvasHeight, camera),
    ];
    const minTx = Math.max(0, Math.floor(Math.min(...corners.map(c => c.x))) - 1);
    const maxTx = Math.min(mapW - 1, Math.ceil(Math.max(...corners.map(c => c.x))) + 1);
    const minTy = Math.max(0, Math.floor(Math.min(...corners.map(c => c.y))) - 1);
    const maxTy = Math.min(mapH - 1, Math.ceil(Math.max(...corners.map(c => c.y))) + 1);
    return { minTx, maxTx, minTy, maxTy };
  },

  sortKey(tx: number, ty: number): number {
    return tx + ty;
  },
};

/** Type alias for IsoProjection object shape — used by classes that receive it as a parameter */
export type IsoProjectionType = typeof IsoProjection;
