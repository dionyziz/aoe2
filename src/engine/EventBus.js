export class EventBus {
    listeners = new Map();
    on(event, handler) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(handler);
    }
    off(event, handler) {
        const handlers = this.listeners.get(event);
        if (!handlers)
            return;
        const idx = handlers.indexOf(handler);
        if (idx !== -1)
            handlers.splice(idx, 1);
    }
    emit(event, data) {
        const handlers = this.listeners.get(event);
        if (!handlers)
            return;
        for (const h of handlers)
            h(data);
    }
}
