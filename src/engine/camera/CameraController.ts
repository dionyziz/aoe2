import { CAMERA_PAN_SPEED, EDGE_SCROLL_THRESHOLD, EDGE_SCROLL_SPEED } from '../../constants';
import type { Camera } from './Camera';
import type { EventBus } from '../EventBus';
import type { KeyboardState } from '../input/KeyboardState';

export class CameraController {
  private camera: Camera;
  private keys: KeyboardState;
  private mouseX = -1;
  private mouseY = -1;
  private mouseInCanvas = false;

  constructor(camera: Camera, eventBus: EventBus, keys: KeyboardState) {
    this.camera = camera;
    this.keys = keys;

    eventBus.on('input:wheel', ({ delta, screenX, screenY }) => {
      const factor = delta > 0 ? 0.9 : 1.1;
      this.camera.zoomAt(factor, screenX, screenY);
    });

    eventBus.on('input:middleDrag', ({ dx, dy }) => {
      this.camera.pan(dx, dy);
    });

    eventBus.on('input:mousemove', ({ screenX, screenY }) => {
      this.mouseX = screenX;
      this.mouseY = screenY;
      this.mouseInCanvas = true;
    });
  }

  update(_dt: number): void {
    const speed = CAMERA_PAN_SPEED / this.camera.zoom;
    let dx = 0, dy = 0;

    // WASD / arrow keys
    if (this.keys.isDown('KeyW') || this.keys.isDown('ArrowUp')) dy += speed;
    if (this.keys.isDown('KeyS') || this.keys.isDown('ArrowDown')) dy -= speed;
    if (this.keys.isDown('KeyA') || this.keys.isDown('ArrowLeft')) dx += speed;
    if (this.keys.isDown('KeyD') || this.keys.isDown('ArrowRight')) dx -= speed;

    // Edge scroll (only when mouse is inside the canvas)
    if (this.mouseInCanvas) {
      const { canvasWidth, canvasHeight } = this.camera;
      if (this.mouseX < EDGE_SCROLL_THRESHOLD) dx += EDGE_SCROLL_SPEED / this.camera.zoom;
      if (this.mouseX > canvasWidth - EDGE_SCROLL_THRESHOLD) dx -= EDGE_SCROLL_SPEED / this.camera.zoom;
      if (this.mouseY < EDGE_SCROLL_THRESHOLD) dy += EDGE_SCROLL_SPEED / this.camera.zoom;
      if (this.mouseY > canvasHeight - EDGE_SCROLL_THRESHOLD) dy -= EDGE_SCROLL_SPEED / this.camera.zoom;
    }

    if (dx !== 0 || dy !== 0) {
      this.camera.pan(dx, dy);
    }
  }
}
