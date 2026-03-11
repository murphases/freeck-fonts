// ============================================================
// Logger — SOP: registro padronizado de eventos e erros
// ============================================================
import { app } from "electron";
import { join } from "path";
import { appendFileSync, existsSync, mkdirSync } from "fs";

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

class Logger {
  private logFile: string;

  constructor() {
    const logDir = join(app.getPath("userData"), "logs");
    if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });
    this.logFile = join(logDir, "freeckfonts.log");
  }

  private write(
    level: LogLevel,
    context: string,
    message: string,
    data?: unknown,
  ): void {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${level}] [${context}] ${message}${data ? " | " + JSON.stringify(data) : ""}\n`;

    // Console output
    if (level === "ERROR") console.error(line.trim());
    else if (level === "WARN") console.warn(line.trim());
    else if (process.env.NODE_ENV === "development" || level !== "DEBUG")
      console.log(line.trim());

    // File output (async-safe append)
    try {
      appendFileSync(this.logFile, line);
    } catch {
      // Silently ignore file write errors
    }
  }

  info(context: string, message: string, data?: unknown): void {
    this.write("INFO", context, message, data);
  }

  warn(context: string, message: string, data?: unknown): void {
    this.write("WARN", context, message, data);
  }

  error(context: string, message: string, data?: unknown): void {
    this.write("ERROR", context, message, data);
  }

  debug(context: string, message: string, data?: unknown): void {
    this.write("DEBUG", context, message, data);
  }
}

export const logger = new Logger();
