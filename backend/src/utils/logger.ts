/**
 * Simple logger utility for logging messages with timestamps.
 */
export const logger = {
    info: (message: string, ...args: any[]) => {
        console.info(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
    },
    error: (message: string, ...args: any[]) => {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
    },
    debug: (message: string, ...args: any[]) => {
        console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
    }
};
