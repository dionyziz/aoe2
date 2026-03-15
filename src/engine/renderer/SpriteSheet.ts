import type { SpriteFrame } from '../../types/animation';
import { logger } from '../../utils/logger';

interface AtlasFrame {
  frame: { x: number; y: number; w: number; h: number };
  anchor: { x: number; y: number };
}

interface AtlasData {
  frames: Record<string, AtlasFrame>;
}

export class SpriteSheet {
  private image: HTMLImageElement | null = null;
  private frames: Record<string, SpriteFrame> = {};
  private loaded = false;

  async load(imageUrl: string, jsonUrl: string): Promise<void> {
    const [img, json] = await Promise.all([
      this.loadImage(imageUrl),
      this.loadJson(jsonUrl)
    ]);
    this.image = img;
    this.parseFrames(json as AtlasData);
    this.loaded = true;
    logger.info(`SpriteSheet loaded: ${imageUrl}`);
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  private async loadJson(url: string): Promise<unknown> {
    const res = await fetch(url);
    return res.json();
  }

  private parseFrames(atlas: AtlasData): void {
    for (const [key, data] of Object.entries(atlas.frames)) {
      this.frames[key] = {
        x: data.frame.x, y: data.frame.y,
        w: data.frame.w, h: data.frame.h,
        anchorX: data.anchor.x, anchorY: data.anchor.y
      };
    }
  }

  drawSprite(
    ctx: CanvasRenderingContext2D,
    frameKey: string,
    destX: number, destY: number,
    scaleX = 1, scaleY = 1
  ): void {
    if (!this.loaded || !this.image) {
      this.drawFallback(ctx, destX, destY);
      return;
    }
    const frame = this.frames[frameKey];
    if (!frame) {
      this.drawFallback(ctx, destX, destY);
      return;
    }
    ctx.drawImage(
      this.image,
      frame.x, frame.y, frame.w, frame.h,
      destX - frame.anchorX * scaleX,
      destY - frame.anchorY * scaleY,
      frame.w * scaleX, frame.h * scaleY
    );
  }

  private drawFallback(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x - 8, y - 16, 16, 16);
  }

  isLoaded(): boolean { return this.loaded; }
}
