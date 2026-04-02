export const logger = {
  info(message: string, meta?: unknown) {
    console.info(`[nexfin] ${message}`, meta);
  },
  error(message: string, meta?: unknown) {
    console.error(`[nexfin] ${message}`, meta);
  },
};
