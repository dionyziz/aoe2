import type { Rect } from '../../types/common';

export class MouseState {
  screenX = 0;
  screenY = 0;
  isLeftDown = false;
  isRightDown = false;
  isMiddleDown = false;
  dragStartX = 0;
  dragStartY = 0;
  isDragging = false;

  get dragRect(): Rect {
    const x = Math.min(this.dragStartX, this.screenX);
    const y = Math.min(this.dragStartY, this.screenY);
    const width = Math.abs(this.screenX - this.dragStartX);
    const height = Math.abs(this.screenY - this.dragStartY);
    return { x, y, width, height };
  }
}
