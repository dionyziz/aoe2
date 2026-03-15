import { MapData } from './MapData';
import { logger } from '../../utils/logger';
export class MapLoader {
    async load(url) {
        logger.info(`Loading map: ${url}`);
        const res = await fetch(url);
        if (!res.ok)
            throw new Error(`Failed to load map: ${url} (${res.status})`);
        const json = await res.json();
        return new MapData(json);
    }
}
