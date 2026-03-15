export class Pool<T> {
  private pool: T[] = [];

  constructor(
    private factory: () => T,
    private reset: (obj: T) => void,
    initialSize = 32
  ) {
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T): void {
    this.reset(obj);
    this.pool.push(obj);
  }

  get size(): number {
    return this.pool.length;
  }
}

/** @deprecated Use Pool instead */
export class ObjectPool<T> extends Pool<T> {
  constructor(create: () => T, reset: (obj: T) => void, initialSize = 0) {
    super(create, reset, initialSize);
  }
}
