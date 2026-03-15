import type { Camera } from '../camera/Camera';
import type { MapData } from '../map/MapData';
import type { UnitInstance } from '../../types/unit';
import type { BuildingInstance } from '../../types/building';
import type { MouseState } from '../input/MouseState';
import type { ResourceCounts } from '../../types/resource';
import type { BuildingPlacementSystem } from '../buildings/BuildingPlacementSystem';
import { IsoProjection } from './IsoProjection';
import { TerrainRenderer } from './TerrainRenderer';
import { EntityRenderer } from './EntityRenderer';
import { UIRenderer } from './UIRenderer';
import { HUD } from '../ui/HUD';
import { Minimap } from '../ui/Minimap';

export class Renderer {
  readonly iso: IsoProjection;
  readonly uiRenderer: UIRenderer;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;
  private terrainRenderer: TerrainRenderer;
  private entityRenderer: EntityRenderer;
  private hud: HUD;
  private minimap: Minimap;

  constructor(canvas: HTMLCanvasElement, camera: Camera, mapData: MapData) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.camera = camera;
    this.iso = new IsoProjection();
    this.terrainRenderer = new TerrainRenderer(mapData, this.iso);
    this.entityRenderer = new EntityRenderer(this.iso);
    this.uiRenderer = new UIRenderer();
    this.hud = new HUD();
    this.minimap = new Minimap(mapData, this.iso);
  }

  render(
    units: UnitInstance[],
    buildings: BuildingInstance[],
    selectedBuilding: BuildingInstance | null,
    mouse: MouseState,
    fps: number,
    _alpha: number,
    resources: ResourceCounts,
    population: number,
    popCap: number,
    placementSystem: BuildingPlacementSystem
  ): void {
    const ctx = this.ctx;
    const { canvasWidth, canvasHeight } = this.camera;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // [1] Terrain
    this.terrainRenderer.render(ctx, this.camera);

    // [2] Buildings
    this.entityRenderer.renderBuildings(ctx, buildings, this.camera);

    // [3] Building placement preview
    placementSystem.render(ctx);

    // [4] Units
    this.entityRenderer.render(ctx, units, this.camera);

    // [5] UI overlay
    const selectedUnits = units.filter(u => u.selected);
    this.uiRenderer.render(
      ctx, mouse, selectedUnits, selectedBuilding, units, fps,
      canvasWidth, canvasHeight,
      this.hud, this.minimap, this.camera, resources, population, popCap
    );
  }

  minimapContainsPoint(screenX: number, screenY: number): boolean {
    return this.minimap.containsPoint(screenX, screenY, this.camera.canvasWidth, this.camera.canvasHeight);
  }

  minimapClickToWorld(screenX: number, screenY: number): { wx: number; wy: number } {
    return this.minimap.clickToWorld(screenX, screenY, this.camera.canvasWidth, this.camera.canvasHeight);
  }

  resize(width: number, height: number): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(dpr, dpr);
    this.camera.canvasWidth = width;
    this.camera.canvasHeight = height;
  }

  invalidateTerrain(): void {
    this.terrainRenderer.invalidate();
  }
}
