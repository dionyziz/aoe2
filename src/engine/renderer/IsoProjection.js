import { TILE_WIDTH, TILE_HEIGHT } from '../../constants';
export const IsoProjection = {
    worldToScreen(wx, wy, elevation, camera) {
        const sx = (wx - wy) * (TILE_WIDTH / 2) * camera.zoom + camera.offsetX;
        const sy = (wx + wy) * (TILE_HEIGHT / 2) * camera.zoom
            - elevation * (TILE_HEIGHT / 2) * camera.zoom
            + camera.offsetY;
        return { x: sx, y: sy };
    },
    screenToWorld(sx, sy, camera) {
        const px = (sx - camera.offsetX) / camera.zoom;
        const py = (sy - camera.offsetY) / camera.zoom;
        const wx = (px / (TILE_WIDTH / 2) + py / (TILE_HEIGHT / 2)) / 2;
        const wy = (py / (TILE_HEIGHT / 2) - px / (TILE_WIDTH / 2)) / 2;
        return { x: wx, y: wy };
    },
    screenToTile(sx, sy, camera) {
        const w = IsoProjection.screenToWorld(sx, sy, camera);
        return { tx: Math.floor(w.x), ty: Math.floor(w.y) };
    },
    visibleTileRange(camera, mapW, mapH) {
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
    sortKey(tx, ty) {
        return tx + ty;
    },
};
