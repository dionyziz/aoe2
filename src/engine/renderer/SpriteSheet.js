import { logger } from '../../utils/logger';
export class SpriteSheet {
    image = null;
    frames = {};
    loaded = false;
    async load(imageUrl, jsonUrl) {
        const [img, json] = await Promise.all([
            this.loadImage(imageUrl),
            this.loadJson(jsonUrl)
        ]);
        this.image = img;
        this.parseFrames(json);
        this.loaded = true;
        logger.info(`SpriteSheet loaded: ${imageUrl}`);
    }
    loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }
    async loadJson(url) {
        const res = await fetch(url);
        return res.json();
    }
    parseFrames(atlas) {
        for (const [key, data] of Object.entries(atlas.frames)) {
            this.frames[key] = {
                x: data.frame.x, y: data.frame.y,
                w: data.frame.w, h: data.frame.h,
                anchorX: data.anchor.x, anchorY: data.anchor.y
            };
        }
    }
    drawSprite(ctx, frameKey, destX, destY, scaleX = 1, scaleY = 1) {
        if (!this.loaded || !this.image) {
            this.drawFallback(ctx, destX, destY);
            return;
        }
        const frame = this.frames[frameKey];
        if (!frame) {
            this.drawFallback(ctx, destX, destY);
            return;
        }
        ctx.drawImage(this.image, frame.x, frame.y, frame.w, frame.h, destX - frame.anchorX * scaleX, destY - frame.anchorY * scaleY, frame.w * scaleX, frame.h * scaleY);
    }
    drawFallback(ctx, x, y) {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - 8, y - 16, 16, 16);
    }
    isLoaded() { return this.loaded; }
}
