export class KeyboardState {
    held = new Set();
    constructor() {
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
    }
    onKeyDown = (e) => {
        this.held.add(e.code);
    };
    onKeyUp = (e) => {
        this.held.delete(e.code);
    };
    press(code) { this.held.add(code); }
    release(code) { this.held.delete(code); }
    isDown(code) { return this.held.has(code); }
    destroy() {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
    }
}
