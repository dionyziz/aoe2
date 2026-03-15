import { TerrainRenderer } from './TerrainRenderer';
import { EntityRenderer } from './EntityRenderer';
import { UIRenderer } from './UIRenderer';
export class Renderer {
    ctx;
    camera;
    terrainRenderer;
    entityRenderer;
    uiRenderer;
    constructor(ctx, camera, eventBus) {
        this.ctx = ctx;
        this.camera = camera;
        this.terrainRenderer = new TerrainRenderer(ctx, camera);
        this.entityRenderer = new EntityRenderer(ctx, camera);
        this.uiRenderer = new UIRenderer();
        eventBus.on('camera:moved', () => this.terrainRenderer.invalidate());
    }
    setMap(mapData) {
        this.terrainRenderer.setMap(mapData);
    }
    render(alpha, units, buildings, fps) {
        const { canvasWidth, canvasHeight } = this.camera;
        this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        this.terrainRenderer.render();
        this.entityRenderer.render(units, buildings, alpha);
        this.uiRenderer.drawFPS(this.ctx, fps);
    }
    invalidateTerrain() {
        this.terrainRenderer.invalidate();
    }
    resize(width, height) {
        const dpr = window.devicePixelRatio || 1;
        const canvas = this.ctx.canvas;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        this.ctx.scale(dpr, dpr);
        this.camera.canvasWidth = width;
        this.camera.canvasHeight = height;
        this.terrainRenderer.invalidate();
    }
}
