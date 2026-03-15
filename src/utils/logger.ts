const isDev = import.meta.env.DEV;

export const logger = {
  info(msg: string, ...args: unknown[]): void {
    if (isDev) console.log(`[INFO] ${msg}`, ...args);
  },
  warn(msg: string, ...args: unknown[]): void {
    console.warn(`[WARN] ${msg}`, ...args);
  },
  error(msg: string, ...args: unknown[]): void {
    console.error(`[ERROR] ${msg}`, ...args);
  },
  debug(msg: string, ...args: unknown[]): void {
    if (isDev) console.debug(`[DEBUG] ${msg}`, ...args);
  }
};
