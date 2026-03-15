export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}
export function lerp(a, b, t) {
    return a + (b - a) * t;
}
export function distance(a, b) {
    const dx = b.wx - a.wx;
    const dy = b.wy - a.wy;
    return Math.sqrt(dx * dx + dy * dy);
}
export function vec2Add(a, b) {
    return { x: a.x + b.x, y: a.y + b.y };
}
export function vec2Sub(a, b) {
    return { x: a.x - b.x, y: a.y - b.y };
}
export function vec2Scale(v, s) {
    return { x: v.x * s, y: v.y * s };
}
export function vec2Normalize(v) {
    const len = Math.sqrt(v.x * v.x + v.y * v.y);
    if (len === 0)
        return { x: 0, y: 0 };
    return { x: v.x / len, y: v.y / len };
}
export function vec2Length(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
}
/** Octile distance for A* heuristic */
export function octileDistance(dx, dy) {
    const D = 1;
    const D2 = Math.SQRT2;
    const minD = Math.min(dx, dy);
    const maxD = Math.max(dx, dy);
    return D * maxD + (D2 - D) * minD;
}
export function rectContains(rect, x, y) {
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}
export function rectsOverlap(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
        a.y < b.y + b.height && a.y + a.height > b.y;
}
