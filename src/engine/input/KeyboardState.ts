export class KeyboardState {
  private keys = new Set<string>();

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  isDown(code: string): boolean {
    return this.keys.has(code);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
