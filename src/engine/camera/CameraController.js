import { EDGE_SCROLL_THRESHOLD, EDGE_SCROLL_SPEED, CAMERA_PAN_SPEED } from '../../constants';
export class CameraController {
    camera;
    mouseX = -1;
    mouseY = -1;
    mouseInCanvas = false;
    keysDown = new Set();
    constructor(camera, eventBus) {
        this.camera = camera;
        eventBus.on('input:wheel', ({ delta, screenX, screenY }) => {
            const factor = delta > 0 ? 0.9 : 1.1;
            this.camera.zoomAt(factor, screenX, screenY);
            eventBus.emit('camera:moved', undefined);
        });
        eventBus.on('input:middleDrag', ({ dx, dy }) => {
            this.camera.pan(dx, dy);
            eventBus.emit('camera:moved', undefined);
        });
        eventBus.on('input:mousemove', ({ screenX, screenY }) => {
            this.mouseX = screenX;
            this.mouseY = screenY;
            this.mouseInCanvas = true;
        });
        eventBus.on('input:keydown', ({ code }) => {
            this.keysDown.add(code);
        });
        eventBus.on('input:keyup', ({ code }) => {
            this.keysDown.delete(code);
        });
    }
    isDown(code) {
        return this.keysDown.has(code);
    }
    update(dt) {
        // dt is in seconds (TICK_MS / 1000)
        const speed = (CAMERA_PAN_SPEED / this.camera.zoom) * dt;
        const edgeSpeed = (EDGE_SCROLL_SPEED / this.camera.zoom) * dt;
        let dx = 0, dy = 0;
        // WASD / arrow keys — spec: W=north(dy+), S=south(dy-), A=west(dx+), D=east(dx-)
        if (this.isDown('KeyW') || this.isDown('ArrowUp'))
            dy += speed;
        if (this.isDown('KeyS') || this.isDown('ArrowDown'))
            dy -= speed;
        if (this.isDown('KeyA') || this.isDown('ArrowLeft'))
            dx += speed;
        if (this.isDown('KeyD') || this.isDown('ArrowRight'))
            dx -= speed;
        // Edge scroll (only when mouse is inside the canvas)
        if (this.mouseInCanvas) {
            const { canvasWidth, canvasHeight } = this.camera;
            if (this.mouseX >= 0 && this.mouseX < EDGE_SCROLL_THRESHOLD)
                dx += edgeSpeed;
            if (this.mouseX > canvasWidth - EDGE_SCROLL_THRESHOLD)
                dx -= edgeSpeed;
            if (this.mouseY >= 0 && this.mouseY < EDGE_SCROLL_THRESHOLD)
                dy += edgeSpeed;
            if (this.mouseY > canvasHeight - EDGE_SCROLL_THRESHOLD)
                dy -= edgeSpeed;
        }
        if (dx !== 0 || dy !== 0) {
            this.camera.pan(dx, dy);
        }
    }
}
