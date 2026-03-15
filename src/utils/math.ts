import type { Vec2 } from '../types/common';

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function distance(a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function vec2Add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function vec2Sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function vec2Scale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

export function vec2Normalize(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function rectContains(rect: { x: number; y: number; width: number; height: number }, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

export function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
         a.y < b.y + b.height && a.y + a.height > b.y;
}
