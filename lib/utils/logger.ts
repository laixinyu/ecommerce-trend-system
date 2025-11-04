// Logger utility for structured logging
export class Logger {
  static info(message: string, meta?: any) {
    console.log(JSON.stringify({
      level: 'info',
      message,
      meta,
      timestamp: new Date().toISOString()
    }));
  }
  
  static error(message: string, error: Error | any, meta?: any) {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: {
        name: error?.name || 'Error',
        message: error?.message || String(error),
        stack: error?.stack
      },
      meta,
      timestamp: new Date().toISOString()
    }));
  }
  
  static apiCall(service: string, endpoint: string, duration: number) {
    console.log(JSON.stringify({
      level: 'info',
      type: 'api_call',
      service,
      endpoint,
      duration,
      timestamp: new Date().toISOString()
    }));
  }

  static warn(message: string, meta?: any) {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      meta,
      timestamp: new Date().toISOString()
    }));
  }

  static debug(message: string, meta?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(JSON.stringify({
        level: 'debug',
        message,
        meta,
        timestamp: new Date().toISOString()
      }));
    }
  }
}
