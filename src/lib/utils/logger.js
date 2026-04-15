const isDev = import.meta.env.DEV;

const noop = () => {};

const logger = {
  log: isDev ? (...args) => console.log('[DENTALSPOT]', ...args) : noop,
  warn: isDev ? (...args) => console.warn('[DENTALSPOT]', ...args) : noop,
  error: isDev
    ? (...args) => console.error('[DENTALSPOT]', ...args)
    : (...args) => {
        // Producción: solo logear mensaje de texto, no objetos que puedan contener datos sensibles
        const msg = typeof args[0] === 'string' ? args[0] : 'Error';
        console.error('[DENTALSPOT]', msg);
      },
  info: isDev ? (...args) => console.info('[DENTALSPOT]', ...args) : noop,
  debug: isDev ? (...args) => console.debug('[DENTALSPOT]', ...args) : noop,

  api: isDev ? (operation, table, data) => console.log(`[API] ${operation} | ${table}`, data) : noop,
  auth: isDev ? (...args) => console.log('[AUTH]', ...args) : noop,
  track: isDev ? (event, data) => console.log(`[TRACK] ${event}`, data) : noop,
};

export default logger;
