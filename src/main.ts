import { Game } from './engine/Game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
if (!canvas) throw new Error('Canvas element not found');

const game = new Game(canvas);
game.start();
