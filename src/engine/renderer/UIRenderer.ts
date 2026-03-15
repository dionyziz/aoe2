import type { Rect } from '../../types/common';

export class UIRenderer {
  drawFPS(ctx: CanvasRenderingContext2D, fps: number): void {
    const cw = ctx.canvas.width / (window.devicePixelRatio || 1);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(cw - 90, 4, 80, 24);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`FPS: ${fps}`, cw - 14, 8);
    ctx.restore();
  }

  drawSelectionRect(ctx: CanvasRenderingContext2D, rect: Rect): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.restore();
  }

  drawResourcePlaceholder(ctx: CanvasRenderingContext2D): void {
    const cw = ctx.canvas.width / (window.devicePixelRatio || 1);
    ctx.save();
    ctx.fillStyle = 'rgba(40,40,40,0.8)';
    ctx.fillRect(0, 0, cw, 30);
    ctx.fillStyle = '#aaa';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Resources: ---', 10, 15);
    ctx.restore();
  }
}
