import { EventBus } from './EventBus';
import type { EventMap } from './EventBus';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  // -------------------------------------------------------------------------
  // on / emit
  // -------------------------------------------------------------------------

  describe('on + emit', () => {
    it('calls a registered handler with the emitted payload', () => {
      const handler = vi.fn();
      bus.on('unit:selected', handler);
      bus.emit('unit:selected', { ids: [1, 2, 3] });
      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith({ ids: [1, 2, 3] });
    });

    it('passes the exact payload object reference to the handler', () => {
      const handler = vi.fn();
      bus.on('unit:orderMove', handler);
      const payload: EventMap['unit:orderMove'] = { ids: [7], target: { wx: 5, wy: 10 } };
      bus.emit('unit:orderMove', payload);
      expect(handler).toHaveBeenCalledWith(payload);
    });

    it('calls the handler every time emit is invoked', () => {
      const handler = vi.fn();
      bus.on('unit:died', handler);
      bus.emit('unit:died', { id: 1 });
      bus.emit('unit:died', { id: 2 });
      bus.emit('unit:died', { id: 3 });
      expect(handler).toHaveBeenCalledTimes(3);
    });

    it('does not call a handler registered for a different event', () => {
      const handlerA = vi.fn();
      const handlerB = vi.fn();
      bus.on('unit:selected', handlerA);
      bus.on('unit:died', handlerB);
      bus.emit('unit:selected', { ids: [] });
      expect(handlerA).toHaveBeenCalledOnce();
      expect(handlerB).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Multiple handlers on the same event
  // -------------------------------------------------------------------------

  describe('multiple handlers on the same event', () => {
    it('calls all handlers registered for the same event', () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      const h3 = vi.fn();
      bus.on('unit:selected', h1);
      bus.on('unit:selected', h2);
      bus.on('unit:selected', h3);
      bus.emit('unit:selected', { ids: [42] });
      expect(h1).toHaveBeenCalledOnce();
      expect(h2).toHaveBeenCalledOnce();
      expect(h3).toHaveBeenCalledOnce();
    });

    it('calls all handlers with the same payload', () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      bus.on('unit:selected', h1);
      bus.on('unit:selected', h2);
      const payload: EventMap['unit:selected'] = { ids: [9, 10] };
      bus.emit('unit:selected', payload);
      expect(h1).toHaveBeenCalledWith(payload);
      expect(h2).toHaveBeenCalledWith(payload);
    });

    it('calls handlers in the order they were registered', () => {
      const order: number[] = [];
      bus.on('unit:died', () => order.push(1));
      bus.on('unit:died', () => order.push(2));
      bus.on('unit:died', () => order.push(3));
      bus.emit('unit:died', { id: 0 });
      expect(order).toEqual([1, 2, 3]);
    });
  });

  // -------------------------------------------------------------------------
  // off
  // -------------------------------------------------------------------------

  describe('off', () => {
    it('removes only the specified handler, others still called', () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      bus.on('unit:selected', h1);
      bus.on('unit:selected', h2);
      bus.off('unit:selected', h1);
      bus.emit('unit:selected', { ids: [] });
      expect(h1).not.toHaveBeenCalled();
      expect(h2).toHaveBeenCalledOnce();
    });

    it('removed handler is never called on subsequent emits', () => {
      const handler = vi.fn();
      bus.on('unit:died', handler);
      bus.emit('unit:died', { id: 1 });
      bus.off('unit:died', handler);
      bus.emit('unit:died', { id: 2 });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('calling off for an unregistered handler is a no-op', () => {
      const handler = vi.fn();
      // never registered — should not throw
      expect(() => bus.off('unit:selected', handler)).not.toThrow();
    });

    it('calling off for an unknown event is a no-op', () => {
      const handler = vi.fn();
      expect(() => bus.off('unit:died', handler)).not.toThrow();
    });

    it('can remove the same function registered twice independently', () => {
      const handler = vi.fn();
      bus.on('unit:selected', handler);
      bus.on('unit:selected', handler);
      // off removes only the first occurrence
      bus.off('unit:selected', handler);
      bus.emit('unit:selected', { ids: [] });
      // one copy remains
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Emitting with no subscribers
  // -------------------------------------------------------------------------

  describe('emit with no subscribers', () => {
    it('does not throw when no handler has been registered for the event', () => {
      expect(() => bus.emit('unit:died', { id: 99 })).not.toThrow();
    });

    it('does not throw for a void-payload event with no subscribers', () => {
      expect(() => bus.emit('camera:moved', undefined as unknown as void)).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Type safety — payload shapes
  // -------------------------------------------------------------------------

  describe('type safety (payload shapes)', () => {
    it('delivers the correct shape for input:leftClick', () => {
      const handler = vi.fn();
      bus.on('input:leftClick', handler);
      bus.emit('input:leftClick', { pos: { wx: 1, wy: 2 }, screenX: 100, screenY: 200 });
      const received = handler.mock.calls[0][0] as EventMap['input:leftClick'];
      expect(received.pos).toEqual({ wx: 1, wy: 2 });
      expect(received.screenX).toBe(100);
      expect(received.screenY).toBe(200);
    });

    it('delivers the correct shape for input:wheel', () => {
      const handler = vi.fn();
      bus.on('input:wheel', handler);
      bus.emit('input:wheel', { delta: -120, screenX: 50, screenY: 60 });
      const received = handler.mock.calls[0][0] as EventMap['input:wheel'];
      expect(received.delta).toBe(-120);
    });

    it('delivers the correct shape for input:boxSelect', () => {
      const handler = vi.fn();
      bus.on('input:boxSelect', handler);
      bus.emit('input:boxSelect', { x: 0, y: 0, width: 100, height: 50 });
      const received = handler.mock.calls[0][0] as EventMap['input:boxSelect'];
      expect(received.width).toBe(100);
      expect(received.height).toBe(50);
    });

    it('delivers the correct shape for building:placed', () => {
      const handler = vi.fn();
      bus.on('building:placed', handler);
      bus.emit('building:placed', { defId: 'barracks', tx: 3, ty: 7 });
      const received = handler.mock.calls[0][0] as EventMap['building:placed'];
      expect(received.defId).toBe('barracks');
      expect(received.tx).toBe(3);
      expect(received.ty).toBe(7);
    });

    it('delivers the correct shape for research:complete', () => {
      const handler = vi.fn();
      bus.on('research:complete', handler);
      bus.emit('research:complete', { techId: 'loom', playerId: 1 });
      const received = handler.mock.calls[0][0] as EventMap['research:complete'];
      expect(received.techId).toBe('loom');
      expect(received.playerId).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // once-style pattern (manual simulation using off)
  // -------------------------------------------------------------------------

  describe('once-style usage (handler deregisters itself)', () => {
    it('handler that removes itself is only called once', () => {
      const calls: number[] = [];
      const handler = (data: EventMap['unit:died']) => {
        calls.push(data.id);
        bus.off('unit:died', handler);
      };
      bus.on('unit:died', handler);
      bus.emit('unit:died', { id: 1 });
      bus.emit('unit:died', { id: 2 });
      bus.emit('unit:died', { id: 3 });
      expect(calls).toEqual([1]);
    });

    it('other handlers remain active after a self-removing handler fires', () => {
      const onceCalls: number[] = [];
      const permanentCalls: number[] = [];

      const onceHandler = (data: EventMap['unit:died']) => {
        onceCalls.push(data.id);
        bus.off('unit:died', onceHandler);
      };
      const permanentHandler = (data: EventMap['unit:died']) => {
        permanentCalls.push(data.id);
      };

      bus.on('unit:died', onceHandler);
      bus.on('unit:died', permanentHandler);

      bus.emit('unit:died', { id: 10 });
      bus.emit('unit:died', { id: 20 });

      expect(onceCalls).toEqual([10]);
      expect(permanentCalls).toEqual([10, 20]);
    });
  });
});
