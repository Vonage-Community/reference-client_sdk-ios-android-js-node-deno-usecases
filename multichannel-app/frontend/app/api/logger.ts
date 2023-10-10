const jsonFormatter = (input: unknown | unknown[]): string => {
    if (typeof input === 'string') return input;
    if (Array.isArray(input) && input.length === 0) return '';
    if (Array.isArray(input)) {
        return input.map((i) => jsonFormatter(i)).join(' ');
    }
    return JSON.stringify(input, null, 2);
};
type Logger = {
    info: (...args: unknown[]) => void;
    debug: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
    warning: (...args: unknown[]) => void;
    critical: (...args: unknown[]) => void;
};
const getLogger = (name: string) => ({
    info: (...args: unknown[]) => console.log(name, ...args),
    debug: (...args: unknown[]) => console.debug(name, ...args),
    error: (...args: unknown[]) => console.error(name, ...args),
    warning: (...args: unknown[]) => console.warn(name, ...args),
    critical: (...args: unknown[]) => console.error(name, ...args),
});
const prefixLogger = (logger: Logger) => (name: string) => ({
    info: (...args: unknown[]) => logger.info(name, ...args),
    debug: (...args: unknown[]) => logger.debug(name, ...args),
    error: (...args: unknown[]) => logger.error(name, ...args),
    warning: (...args: unknown[]) => logger.warning(name, ...args),
    critical: (...args: unknown[]) => logger.critical(name, ...args),
});

export const getFunctionLogger = prefixLogger(getLogger('function'));
export const getWebhookLogger = prefixLogger(getLogger('webhook'));
export const getHandlerLogger = prefixLogger(getLogger('handler'));
export const getUtilsLogger = prefixLogger(getLogger('utils'));
export const getRTCLogger = prefixLogger(getLogger('webhook:rtc-event'));
