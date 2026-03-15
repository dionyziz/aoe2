import type { ResourceCounts } from '../../types/resource';

const ICONS: Record<string, string> = {
  food:  '🍖',
  wood:  '🪵',
  gold:  '💰',
  stone: '🪨',
  pop:   '👥',
};

export class HUD {
  render(
    ctx: CanvasRenderingContext2D,
    resources: ResourceCounts,
    population: number,
    popCap: number,
    canvasWidth: number
  ): void {
    const barH = 36;
    // Background bar
    ctx.fillStyle = 'rgba(20,15,5,0.92)';
    ctx.fillRect(0, 0, canvasWidth, barH);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvasWidth, barH);

    const items: [string, number | string][] = [
      ['food',  resources.food],
      ['wood',  resources.wood],
      ['gold',  resources.gold],
      ['stone', resources.stone],
      ['pop',   `${population}/${popCap}`],
    ];

    ctx.font = 'bold 14px sans-serif';
    ctx.textBaseline = 'middle';
    let x = 12;
    for (const [key, val] of items) {
      ctx.fillStyle = '#fff';
      ctx.fillText(`${ICONS[key]} ${val}`, x, barH / 2);
      x += 110;
    }
    ctx.textBaseline = 'alphabetic';
  }
}
