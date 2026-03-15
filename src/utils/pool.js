export class Pool {
    factory;
    reset;
    pool = [];
    constructor(factory, reset, initialSize = 32) {
        this.factory = factory;
        this.reset = reset;
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(factory());
        }
    }
    acquire() {
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        return this.factory();
    }
    release(obj) {
        this.reset(obj);
        this.pool.push(obj);
    }
    get size() {
        return this.pool.length;
    }
}
/** @deprecated Use Pool instead */
export class ObjectPool extends Pool {
    constructor(create, reset, initialSize = 0) {
        super(create, reset, initialSize);
    }
}
