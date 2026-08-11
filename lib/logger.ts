type LogLevel = "error" | "warn" | "info";

interface LogContext {
  [key: string]: unknown;
}

function write(level: LogLevel, message: string, context?: LogContext): void {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  const line = JSON.stringify(entry);

  switch (level) {
    case "error":
      console.error(line);
      break;
    case "warn":
      console.warn(line);
      break;
    default:
      console.info(line);
  }
}

export const logger = {
  error(message: string, context?: LogContext): void {
    write("error", message, context);
  },
  warn(message: string, context?: LogContext): void {
    write("warn", message, context);
  },
  info(message: string, context?: LogContext): void {
    write("info", message, context);
  },
};
