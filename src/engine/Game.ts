import { GameLoop } from './GameLoop';
import { EventBus } from './EventBus';
import { Camera } from './camera/Camera';
import { CameraController } from './camera/CameraController';
import { Renderer } from './renderer/Renderer';
import { InputManager } from './input/InputManager';
import { MapData } from './map/MapData';
import { NavGrid } from './pathfinding/NavGrid';
import { AStar } from './pathfinding/AStar';
import { UnitManager } from './units/UnitManager';
import { IsoProjection } from './renderer/IsoProjection';
import { TerrainType } from '../types/map';
import type { MapData as MapDataType } from '../types/map';
import type { TileData } from '../types/map';
import type { BuildingInstance } from '../types/building';

export class Game {
  private eventBus: EventBus;
  private camera: Camera;
  private cameraController: CameraController;
  private inputManager: InputManager;
  private renderer: Renderer;
  private mapStore: MapData | null = null;
  private loop: GameLoop;
  private navGrid: NavGrid | null = null;
  private astar: AStar;
  private unitManager: UnitManager | null = null;
  private buildings: BuildingInstance[] = [];

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')!;
    this.eventBus = new EventBus();
    this.camera = new Camera();

    // Camera needs logical (CSS) pixel dimensions, not physical pixel dimensions.
    // canvas.style.width/height hold the logical size set in main.ts; fall back
    // to window dimensions if the style strings are not yet populated.
    const logicalW = parseFloat(canvas.style.width) || window.innerWidth;
    const logicalH = parseFloat(canvas.style.height) || window.innerHeight;
    this.camera.setCanvasSize(logicalW, logicalH);

    this.cameraController = new CameraController(this.camera, this.eventBus);
    this.inputManager = new InputManager(canvas, this.camera, this.eventBus);
    this.renderer = new Renderer(ctx, this.camera, this.eventBus);
    this.astar = new AStar();
    this.loop = new GameLoop(
      (dt) => this.update(dt),
      (alpha) => this.render(alpha),
    );

    window.addEventListener('resize', () => this.onResize());
  }

  loadTestMap(): void {
    // Create a 32×32 flat map with varied terrain for visual testing
    const tiles: TileData[][] = [];
    for (let ty = 0; ty < 32; ty++) {
      tiles[ty] = [];
      for (let tx = 0; tx < 32; tx++) {
        // Varied terrain: mostly grass, some water/forest/dirt patches
        let terrain = TerrainType.Grass;
        if (tx < 3 || ty < 3 || tx > 28 || ty > 28) terrain = TerrainType.Dirt;
        if ((tx >= 8 && tx <= 12) && (ty >= 8 && ty <= 12)) terrain = TerrainType.Water;
        if ((tx >= 18 && tx <= 22) && (ty >= 5 && ty <= 10)) terrain = TerrainType.Forest;
        if ((tx >= 20 && tx <= 25) && (ty >= 18 && ty <= 22)) terrain = TerrainType.Sand;
        const elevation = (tx === 15 && ty >= 14 && ty <= 18) ? 1 : 0;
        tiles[ty][tx] = {
          terrain,
          elevation,
          passable: terrain !== TerrainType.Water,
          resourceId: null,
          objectId: null,
        };
      }
    }
    const mapDataType: MapDataType = {
      version: 1,
      name: 'Test Flat',
      width: 32,
      height: 32,
      tiles,
      resources: [],
      playerStarts: [{ tx: 4, ty: 4 }, { tx: 28, ty: 28 }],
    };
    this.mapStore = new MapData(mapDataType);
    this.navGrid = new NavGrid(this.mapStore);
    this.unitManager = new UnitManager(this.eventBus, this.astar, this.navGrid, IsoProjection, this.camera);
    this.unitManager.spawn('militia', 1, 4.5, 4.5);
    this.unitManager.spawn('militia', 1, 5.5, 4.5);
    this.unitManager.spawn('militia', 1, 4.5, 5.5);
    this.unitManager.spawn('militia', 2, 27.5, 27.5);
    this.camera.setMapSize(32, 32);
    this.renderer.setMap(this.mapStore);
    this.camera.centerOn(16, 16);
    this.eventBus.emit('map:loaded', { map: mapDataType });
  }

  start(): void {
    this.loop.start();
  }

  stop(): void {
    this.loop.stop();
  }

  private update(dt: number): void {
    this.cameraController.update(dt);
    this.unitManager?.update(dt);
    // Emit camera:moved every tick so terrain cache stays in sync
    this.eventBus.emit('camera:moved', undefined as never);
  }

  private render(alpha: number): void {
    this.renderer.render(alpha, this.unitManager?.units ?? [], this.buildings, this.loop.fps);
  }

  private onResize(): void {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    const ctx = this.canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    this.camera.setCanvasSize(w, h);
    this.renderer.invalidateTerrain();
  }
}
