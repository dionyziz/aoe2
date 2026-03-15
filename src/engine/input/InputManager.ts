import type { EventBus } from '../EventBus';
import type { Camera } from '../camera/Camera';
import type { IsoProjection } from '../renderer/IsoProjection';
import { MouseState } from './MouseState';

const DRAG_THRESHOLD = 5;

export class InputManager {
  readonly mouse = new MouseState();
  private canvas: HTMLCanvasElement;
  private eventBus: EventBus;
  private camera: Camera;
  private iso: IsoProjection;
  private middleDragLastX = 0;
  private middleDragLastY = 0;

  constructor(canvas: HTMLCanvasElement, eventBus: EventBus, camera: Camera, iso: IsoProjection) {
    this.canvas = canvas;
    this.eventBus = eventBus;
    this.camera = camera;
    this.iso = iso;

    canvas.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('mousedown', this.onMouseDown);
    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('mouseup', this.onMouseUp);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private onMouseDown = (e: MouseEvent): void => {
    const { offsetX: sx, offsetY: sy } = e;
    this.mouse.screenX = sx;
    this.mouse.screenY = sy;

    if (e.button === 0) {
      this.mouse.isLeftDown = true;
      this.mouse.dragStartX = sx;
      this.mouse.dragStartY = sy;
      this.mouse.isDragging = false;
    } else if (e.button === 1) {
      this.mouse.isMiddleDown = true;
      this.middleDragLastX = sx;
      this.middleDragLastY = sy;
      this.eventBus.emit('input:middleDragStart', { screenX: sx, screenY: sy });
    } else if (e.button === 2) {
      this.mouse.isRightDown = true;
    }
  };

  private onMouseMove = (e: MouseEvent): void => {
    const { offsetX: sx, offsetY: sy } = e;
    this.mouse.screenX = sx;
    this.mouse.screenY = sy;

    this.eventBus.emit('input:mousemove', { screenX: sx, screenY: sy });

    if (this.mouse.isLeftDown) {
      const dx = sx - this.mouse.dragStartX;
      const dy = sy - this.mouse.dragStartY;
      if (!this.mouse.isDragging && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
        this.mouse.isDragging = true;
      }
    }

    if (this.mouse.isMiddleDown) {
      const dx = sx - this.middleDragLastX;
      const dy = sy - this.middleDragLastY;
      this.middleDragLastX = sx;
      this.middleDragLastY = sy;
      this.eventBus.emit('input:middleDrag', { dx, dy });
    }
  };

  private onMouseUp = (e: MouseEvent): void => {
    const { offsetX: sx, offsetY: sy } = e;

    if (e.button === 0) {
      if (this.mouse.isDragging) {
        this.eventBus.emit('input:boxSelect', this.mouse.dragRect);
      } else {
        const world = this.iso.screenToWorld(sx, sy, this.camera);
        this.eventBus.emit('input:leftClick', { pos: { wx: world.x, wy: world.y }, screenX: sx, screenY: sy });
      }
      this.mouse.isLeftDown = false;
      this.mouse.isDragging = false;
    } else if (e.button === 1) {
      this.mouse.isMiddleDown = false;
      this.eventBus.emit('input:middleDragEnd', undefined as never);
    } else if (e.button === 2) {
      this.mouse.isRightDown = false;
      const world = this.iso.screenToWorld(sx, sy, this.camera);
      this.eventBus.emit('input:rightClick', { pos: { wx: world.x, wy: world.y }, screenX: sx, screenY: sy });
    }
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    this.eventBus.emit('input:wheel', {
      delta: e.deltaY,
      screenX: e.offsetX,
      screenY: e.offsetY
    });
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    this.eventBus.emit('input:keydown', {
      code: e.code,
      ctrl: e.ctrlKey,
      shift: e.shiftKey,
      alt: e.altKey
    });
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.eventBus.emit('input:keyup', { code: e.code });
  };
}
