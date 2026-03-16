import type { Camera } from '../camera/Camera';
import type { EventBus } from '../EventBus';
import { MapData } from '../map/MapData';
import type { UnitInstance } from '../../types/unit';
import type { BuildingInstance } from '../../types/building';
import { TerrainRenderer } from './TerrainRenderer';
import { EntityRenderer } from './EntityRenderer';
import { UIRenderer } from './UIRenderer';

export class Renderer {
  private terrainRenderer: TerrainRenderer;
  private entityRenderer: EntityRenderer;
  private uiRenderer: UIRenderer;
  private mapData: MapData | null = null;

  constructor(
    private ctx: CanvasRenderingContext2D,
    private camera: Camera,
    eventBus: EventBus
  ) {
    this.terrainRenderer = new TerrainRenderer(ctx, camera);
    this.entityRenderer = new EntityRenderer(ctx, camera);
    this.uiRenderer = new UIRenderer();
    eventBus.on('camera:moved', () => this.terrainRenderer.invalidate());
  }

  setMap(mapData: MapData): void {
    this.mapData = mapData;
    this.terrainRenderer.setMap(mapData);
  }

  render(alpha: number, units: UnitInstance[], buildings: BuildingInstance[], fps: number): void {
    const { canvasWidth, canvasHeight } = this.camera;
    this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    this.terrainRenderer.render();
    this.entityRenderer.render(units, buildings, alpha);
    this.uiRenderer.drawResourcePlaceholder(this.ctx);
    if (this.mapData !== null) {
      this.uiRenderer.drawMinimap(this.ctx, this.mapData, units);
    }
    this.uiRenderer.drawFPS(this.ctx, fps);
  }

  invalidateTerrain(): void {
    this.terrainRenderer.invalidate();
  }

  resize(width: number, height: number): void {
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
