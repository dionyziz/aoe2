import { TICK_MS } from '../constants';

type UpdateFn = (dt: number) => void;
type RenderFn = (alpha: number) => void;

export class GameLoop {
  private updateFn: UpdateFn;
  private renderFn: RenderFn;
  private running = false;
  private rafId = 0;
  private lastTime = 0;
  private accumulator = 0;

  // FPS tracking
  private frameCount = 0;
  private fpsTimer = 0;
  public fps = 0;

  constructor(update: UpdateFn, render: RenderFn) {
    this.updateFn = update;
    this.renderFn = render;
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private loop = (now: number): void => {
    if (!this.running) return;

    const elapsed = Math.min(now - this.lastTime, 200); // cap at 200ms to avoid spiral
    this.lastTime = now;
    this.accumulator += elapsed;

    // Fixed-timestep updates
    while (this.accumulator >= TICK_MS) {
      this.updateFn(TICK_MS);
      this.accumulator -= TICK_MS;
    }

    const alpha = this.accumulator / TICK_MS;
    this.renderFn(alpha);

    // FPS counter
    this.frameCount++;
    this.fpsTimer += elapsed;
    if (this.fpsTimer >= 1000) {
      this.fps = Math.round(this.frameCount * 1000 / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    this.rafId = requestAnimationFrame(this.loop);
  };
}
