/**
 * Enhanced logging utility with different log levels
 */
export class Logger {
  private static formatTimestamp(): string {
    return new Date().toISOString();
  }

  static info(message: string, data?: any) {
    const timestamp = this.formatTimestamp();
    console.log(`[${timestamp}] [INFO] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  static warn(message: string, data?: any) {
    const timestamp = this.formatTimestamp();
    console.warn(`[${timestamp}] [WARN] ${message}`);
    if (data) {
      console.warn(JSON.stringify(data, null, 2));
    }
  }

  static error(message: string, error?: any) {
    const timestamp = this.formatTimestamp();
    console.error(`[${timestamp}] [ERROR] ${message}`);
    if (error) {
      if (error instanceof Error) {
        console.error(`Stack: ${error.stack}`);
      } else {
        console.error(JSON.stringify(error, null, 2));
      }
    }
  }

  static debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = this.formatTimestamp();
      console.debug(`[${timestamp}] [DEBUG] ${message}`);
      if (data) {
        console.debug(JSON.stringify(data, null, 2));
      }
    }
  }
}