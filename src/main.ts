import { Game } from './engine/Game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
if (!canvas) throw new Error('Canvas element not found');

const dpr = window.devicePixelRatio || 1;

// Initial size
canvas.width = window.innerWidth * dpr;
canvas.height = window.innerHeight * dpr;
canvas.style.width = window.innerWidth + 'px';
canvas.style.height = window.innerHeight + 'px';
const ctx = canvas.getContext('2d')!;
ctx.scale(dpr, dpr);

const game = new Game(canvas);
game.loadTestMap();
game.start();
