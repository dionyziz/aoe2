const isDev = import.meta.env.DEV;
export const logger = {
    log(system, msg, data) {
        if (isDev)
            console.log(`[${system.toUpperCase()}] ${msg}`, ...(data !== undefined ? [data] : []));
    },
    warn(system, msg, data) {
        if (isDev)
            console.warn(`[${system.toUpperCase()}] ${msg}`, ...(data !== undefined ? [data] : []));
    },
    error(system, msg, data) {
        console.error(`[${system.toUpperCase()}] ${msg}`, ...(data !== undefined ? [data] : []));
    },
    // backward-compat methods used by existing code
    info(msg, ...args) {
        if (isDev)
            console.log(`[INFO] ${msg}`, ...args);
    },
    debug(msg, ...args) {
        if (isDev)
            console.debug(`[DEBUG] ${msg}`, ...args);
    },
};
// silence unused type warning
const _level = 'log';
void _level;
