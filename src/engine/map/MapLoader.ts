import type { MapData as MapDataType } from '../../types/map';
import { MapData } from './MapData';
import { logger } from '../../utils/logger';

export class MapLoader {
  async load(url: string): Promise<MapData> {
    logger.info(`Loading map: ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load map: ${url} (${res.status})`);
    const json = await res.json() as MapDataType;
    return new MapData(json);
  }
}
