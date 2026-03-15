import { TICK_MS } from '../constants';
export class GameLoop {
    update;
    render;
    accumulator = 0;
    lastTime = 0;
    running = false;
    rafId = 0;
    fpsFrames = [];
    fps = 0;
    constructor(update, render) {
        this.update = update;
        this.render = render;
    }
    start() {
        this.running = true;
        this.lastTime = performance.now();
        this.rafId = requestAnimationFrame(this.loop);
    }
    stop() {
        this.running = false;
        cancelAnimationFrame(this.rafId);
    }
    loop = (now) => {
        if (!this.running)
            return;
        const elapsed = Math.min(now - this.lastTime, 200); // cap at 200ms to prevent spiral
        this.lastTime = now;
        this.accumulator += elapsed;
        while (this.accumulator >= TICK_MS) {
            this.update(TICK_MS / 1000);
            this.accumulator -= TICK_MS;
        }
        this.render(this.accumulator / TICK_MS);
        // rolling FPS over last 60 frames
        this.fpsFrames.push(now);
        if (this.fpsFrames.length > 60)
            this.fpsFrames.shift();
        if (this.fpsFrames.length > 1) {
            this.fps = Math.round((this.fpsFrames.length - 1) / ((now - this.fpsFrames[0]) / 1000));
        }
        this.rafId = requestAnimationFrame(this.loop);
    };
}
