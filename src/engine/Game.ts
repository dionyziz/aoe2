import { GameLoop } from './GameLoop';
import { EventBus } from './EventBus';
import { Camera } from './camera/Camera';
import { CameraController } from './camera/CameraController';
import { Renderer } from './renderer/Renderer';
import { InputManager } from './input/InputManager';
import { KeyboardState } from './input/KeyboardState';
import { MapData } from './map/MapData';
import { NavGrid } from './pathfinding/NavGrid';
import { AStar } from './pathfinding/AStar';
import { UnitManager } from './units/UnitManager';
import { BuildingManager } from './buildings/BuildingManager';
import { BuildingPlacementSystem } from './buildings/BuildingPlacementSystem';
import { logger } from '../utils/logger';
import type { ResourceCounts } from '../types/resource';
import type { BuildingInstance } from '../types/building';
import { UnitStateId } from '../types/unit';

export class Game {
  private loop: GameLoop;
  private eventBus: EventBus;
  private camera: Camera;
  private cameraController: CameraController;
  private renderer: Renderer;
  private inputManager: InputManager;
  private keyboardState: KeyboardState;
  private mapData: MapData;
  private navGrid: NavGrid;
  private astar: AStar;
  private unitManager: UnitManager;
  private buildingManager: BuildingManager;
  private placementSystem: BuildingPlacementSystem;

  private resources: ResourceCounts = { food: 200, wood: 200, gold: 0, stone: 0 };
  private population = 3;
  private popCap = 10;

  private selectedBuilding: BuildingInstance | null = null;

  constructor(canvas: HTMLCanvasElement) {
    // 1. Map (procedurally generated)
    this.mapData = MapData.generate({ seed: Math.floor(Math.random() * 99999) });

    // 2. Camera
    this.camera = new Camera();
    this.camera.canvasWidth = window.innerWidth;
    this.camera.canvasHeight = window.innerHeight;
    this.camera.setMapSize(this.mapData.width, this.mapData.height);

    // 3. Core systems
    this.eventBus = new EventBus();
    this.keyboardState = new KeyboardState();

    // 4. Renderer (must be before resize)
    this.renderer = new Renderer(canvas, this.camera, this.mapData);

    // 5. Resize canvas to window
    this.renderer.resize(window.innerWidth, window.innerHeight);

    // 6. Center camera on player 1 start (or map center)
    const p1Start = this.mapData.playerStarts[0];
    if (p1Start) {
      this.camera.centerOnTile(p1Start.tx, p1Start.ty);
    } else {
      this.camera.centerOnTile(
        this.mapData.width / 2,
        this.mapData.height / 2
      );
    }

    // 7. Input and camera controller
    this.inputManager = new InputManager(canvas, this.eventBus, this.camera, this.renderer.iso);
    this.cameraController = new CameraController(this.camera, this.eventBus, this.keyboardState);

    // 8. Pathfinding
    this.navGrid = new NavGrid(this.mapData);
    this.astar = new AStar();

    // 9. Units
    this.unitManager = new UnitManager(
      this.eventBus, this.astar, this.navGrid,
      this.renderer.iso, this.camera
    );

    // 10. Buildings
    this.buildingManager = new BuildingManager(this.navGrid, this.eventBus);

    // 11. Placement system (player 1)
    this.placementSystem = new BuildingPlacementSystem(
      this.renderer.iso, this.camera, this.navGrid, this.buildingManager, 1
    );

    // 12. Spawn units near player start positions
    if (p1Start) {
      this.unitManager.spawn('militia', 1, p1Start.tx + 0.5, p1Start.ty + 0.5);
      this.unitManager.spawn('militia', 1, p1Start.tx + 1.5, p1Start.ty + 0.5);
      this.unitManager.spawn('militia', 1, p1Start.tx + 0.5, p1Start.ty + 1.5);
      this.unitManager.spawn('villager', 1, p1Start.tx + 2.5, p1Start.ty + 0.5);
    }

    const p2Start = this.mapData.playerStarts[1];
    if (p2Start) {
      this.unitManager.spawn('militia', 2, p2Start.tx + 0.5, p2Start.ty + 0.5);
    }

    // 13. Place test buildings for player 1 near start
    if (p1Start) {
      const tcx = p1Start.tx + 5;
      const tcy = p1Start.ty;
      this.buildingManager.place('town_center', 1, tcx, tcy);
      this.buildingManager.place('barracks', 1, tcx + 6, tcy);
    }

    // 14. Wire up UI action button callbacks
    this.renderer.uiRenderer.onActionClick = (actionId: string) => {
      this.handleActionClick(actionId);
    };

    // 15. Input event handlers
    this.setupInput();

    // 16. Minimap input handling
    this.setupMinimapInput();

    // 17. Game loop
    this.loop = new GameLoop(
      (dt) => this.update(dt),
      (alpha) => this.render(alpha)
    );

    // 18. Resize handler
    window.addEventListener('resize', () => this.resizeToWindow());

    // Invalidate terrain on camera events
    this.eventBus.on('camera:moved', () => this.renderer.invalidateTerrain());

    logger.info('Game initialized');
  }

  start(): void {
    this.loop.start();
    logger.info('Game loop started');
  }

  private handleActionClick(actionId: string): void {
    if (actionId === 'build') {
      this.renderer.uiRenderer.openBuildMenu();
    } else if (actionId === 'build_cancel') {
      this.renderer.uiRenderer.closeBuildMenu();
    } else if (actionId.startsWith('build:')) {
      const defId = actionId.slice('build:'.length);
      this.placementSystem.startPlacement(defId);
      this.renderer.uiRenderer.closeBuildMenu();
    } else if (actionId.startsWith('train:')) {
      const unitId = actionId.slice('train:'.length);
      logger.info(`TODO: train unit ${unitId}`);
    } else if (actionId === 'stop') {
      const selected = this.unitManager.getSelected();
      for (const unit of selected) {
        unit.path = [];
        unit.pathIndex = 0;
        unit.state = UnitStateId.Idle;
      }
    }
  }

  private setupInput(): void {
    this.eventBus.on('input:mousemove', ({ screenX, screenY }) => {
      this.placementSystem.updateMouse(screenX, screenY);
      // Update hover state for action buttons
      const selectedUnits = this.unitManager.getSelected();
      this.renderer.uiRenderer.updateHover(
        screenX, screenY,
        this.camera.canvasWidth, this.camera.canvasHeight,
        selectedUnits, this.selectedBuilding
      );
    });

    this.eventBus.on('input:leftClick', ({ screenX, screenY }) => {
      // Check if click is inside the bottom panel action buttons first
      const selectedUnits = this.unitManager.getSelected();
      const actionId = this.renderer.uiRenderer.handleClick(
        screenX, screenY,
        this.camera.canvasWidth, this.camera.canvasHeight,
        selectedUnits, this.selectedBuilding
      );
      if (actionId !== null) {
        this.handleActionClick(actionId);
        return;
      }

      // If placement is active, try to place
      if (this.placementSystem.isActive()) {
        this.placementSystem.tryPlace();
        return;
      }

      // Otherwise check for building selection
      if (!this.renderer.minimapContainsPoint(screenX, screenY)) {
        const tile = this.renderer.iso.screenToTile(screenX, screenY, this.camera);
        const building = this.buildingManager.selectAt(tile.tx, tile.ty);
        if (building) {
          // Clear unit selection when a building is clicked
          this.unitManager.clearUnitSelection();
          this.selectedBuilding = building;
        } else {
          this.buildingManager.clearSelection();
          this.selectedBuilding = null;
          // Unit click handling is done by UnitManager's own listener
        }
      }
    });

    this.eventBus.on('input:keydown', ({ code }) => {
      if (code === 'Escape') {
        if (this.placementSystem.isActive()) {
          this.placementSystem.cancelPlacement();
        } else if (this.renderer.uiRenderer.isBuildMenuOpen()) {
          this.renderer.uiRenderer.closeBuildMenu();
        } else {
          this.buildingManager.clearSelection();
          this.selectedBuilding = null;
        }
      }
    });
  }

  private update(dt: number): void {
    this.cameraController.update(dt);
    this.unitManager.update(dt);
    this.renderer.invalidateTerrain();
  }

  private render(alpha: number): void {
    this.renderer.render(
      this.unitManager.units,
      this.buildingManager.buildings,
      this.selectedBuilding,
      this.inputManager.mouse,
      this.loop.fps,
      alpha,
      this.resources,
      this.population,
      this.popCap,
      this.placementSystem
    );
  }

  private setupMinimapInput(): void {
    this.eventBus.on('input:leftClick', ({ screenX, screenY }: { screenX: number; screenY: number }) => {
      if (this.renderer.minimapContainsPoint(screenX, screenY)) {
        const world = this.renderer.minimapClickToWorld(screenX, screenY);
        this.camera.centerOnTile(world.wx, world.wy);
      }
    });
  }

  private resizeToWindow(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.resize(w, h);
  }
}
