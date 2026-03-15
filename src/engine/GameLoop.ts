import { TICK_MS } from '../constants';

type UpdateFn = (dt: number) => void;
type RenderFn = (alpha: number) => void;

export class GameLoop {
  private accumulator = 0;
  private lastTime = 0;
  private running = false;
  private rafId = 0;
  private fpsFrames: number[] = [];
  public fps = 0;

  constructor(
    private update: UpdateFn,
    private render: RenderFn,
  ) {}

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
    if (this.fpsFrames.length > 60) this.fpsFrames.shift();
    if (this.fpsFrames.length > 1) {
      this.fps = Math.round((this.fpsFrames.length - 1) / ((now - this.fpsFrames[0]) / 1000));
    }

    this.rafId = requestAnimationFrame(this.loop);
  };
}
