const DIR_SUFFIXES = ['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se'];
export function buildFrameKeys(unitId, action, directions, frameCount) {
    const result = [];
    const dirs = directions === 8 ? DIR_SUFFIXES : ['s'];
    for (const dir of dirs) {
        const frames = [];
        for (let f = 0; f < frameCount; f++) {
            frames.push(`${unitId}_${action}_${dir}_${f}`);
        }
        result.push(frames);
    }
    return result;
}
// Standard animation definitions for all unit types
export const ANIMATIONS = {
    militia_idle: { directions: 8, fps: 4, loop: true, frameCount: 2, frameKeys: [] },
    militia_walk: { directions: 8, fps: 15, loop: true, frameCount: 10, frameKeys: [] },
};
