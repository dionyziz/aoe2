export class ObjectPool<T> {
  private pool: T[] = [];
  private create: () => T;
  private reset: (obj: T) => void;

  constructor(create: () => T, reset: (obj: T) => void, initialSize = 0) {
    this.create = create;
    this.reset = reset;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(create());
    }
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.create();
  }

  release(obj: T): void {
    this.reset(obj);
    this.pool.push(obj);
  }

  get size(): number {
    return this.pool.length;
  }
}
