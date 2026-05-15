export class Logger {
  static log(message: string, data?: any) {
    console.log(`[LOG] ${message}`, data);
  }

  static error(message: string, error?: any) {
    console.error(`[ERROR] ${message}`, error);
  }

  static warn(message: string, data?: any) {
    console.warn(`[WARN] ${message}`, data);
  }

  static info(message: string, data?: any) {
    console.info(`[INFO] ${message}`, data);
  }
}
