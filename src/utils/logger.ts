const isDev = import.meta.env.DEV;

type LogLevel = 'log' | 'warn' | 'error';

export const logger = {
  log(system: string, msg: string, data?: unknown): void {
    if (isDev) console.log(`[${system.toUpperCase()}] ${msg}`, ...(data !== undefined ? [data] : []));
  },
  warn(system: string, msg: string, data?: unknown): void {
    if (isDev) console.warn(`[${system.toUpperCase()}] ${msg}`, ...(data !== undefined ? [data] : []));
  },
  error(system: string, msg: string, data?: unknown): void {
    console.error(`[${system.toUpperCase()}] ${msg}`, ...(data !== undefined ? [data] : []));
  },
  // backward-compat methods used by existing code
  info(msg: string, ...args: unknown[]): void {
    if (isDev) console.log(`[INFO] ${msg}`, ...args);
  },
  debug(msg: string, ...args: unknown[]): void {
    if (isDev) console.debug(`[DEBUG] ${msg}`, ...args);
  },
};

// silence unused type warning
const _level: LogLevel = 'log';
void _level;
