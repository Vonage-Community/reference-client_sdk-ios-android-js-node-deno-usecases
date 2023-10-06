import {
    getLogger,
    handlers,
    Logger,
    LoggerConfig,
    setup,
} from 'https://deno.land/std@0.192.0/log/mod.ts';

const defaultConfig = {
    level: 'DEBUG',
    handlers: ['console'],
} satisfies LoggerConfig;
const prefixConfig = {
    level: 'DEBUG',
    handlers: ['prefix'],
} satisfies LoggerConfig;

const jsonFormatter = (input: unknown | unknown[]): string => {
    if (typeof input === 'string') return input;
    if (Array.isArray(input) && input.length === 0) return '';
    if (Array.isArray(input)) {
        return input.map((i) => jsonFormatter(i)).join(' ');
    }
    return JSON.stringify(input, null, 2);
};

setup({
    handlers: {
        console: new handlers.ConsoleHandler('DEBUG', {
            formatter: ({ levelName, msg, loggerName, args }) =>
                `[${levelName}:${loggerName}] ${jsonFormatter(msg)} ${
                    jsonFormatter(args ?? '')
                }`,
        }),
        prefix: new handlers.ConsoleHandler('DEBUG', {
            formatter: (
                { levelName, msg: name, loggerName, args: [msg, ...args] },
            ) => `[${levelName}:${loggerName}:${name}] ${jsonFormatter(msg)} ${
                jsonFormatter(args ?? '')
            }`,
        }),
    },
    loggers: {
        default: defaultConfig,
        function: prefixConfig,
        webhook: prefixConfig,
        handler: prefixConfig,
        utils: prefixConfig,
        'webhook:rtc-event': prefixConfig,
    },
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
