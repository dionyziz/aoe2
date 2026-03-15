import type { WorldPos, Rect } from '../types/common';
import type { MapData } from '../types/map';

export type EventMap = {
  'input:leftClick': { pos: WorldPos; screenX: number; screenY: number };
  'input:rightClick': { pos: WorldPos; screenX: number; screenY: number };
  'input:boxSelect': Rect;
  'input:wheel': { delta: number; screenX: number; screenY: number };
  'input:keydown': { code: string; ctrl: boolean; shift: boolean; alt: boolean };
  'input:keyup': { code: string };
  'input:mousemove': { screenX: number; screenY: number };
  'input:middleDragStart': { screenX: number; screenY: number };
  'input:middleDrag': { dx: number; dy: number };
  'input:middleDragEnd': void;
  'unit:selected': { ids: number[] };
  'unit:died': { id: number };
  'unit:orderMove': { ids: number[]; target: WorldPos };
  'map:loaded': { map: MapData };
  'camera:moved': void;
};

type EventHandler<T> = (data: T) => void;

export class EventBus {
  private listeners = new Map<string, EventHandler<unknown>[]>();

  on<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler as EventHandler<unknown>);
  }

  off<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    const idx = handlers.indexOf(handler as EventHandler<unknown>);
    if (idx !== -1) handlers.splice(idx, 1);
  }

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    for (const h of handlers) h(data as unknown);
  }
}
