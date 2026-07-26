import fs from "fs";
import path from "path";
import { config } from "../config/crawler.config";

const logDir = config.output.logs;

function ensureLogDir() {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

function getTimestamp(): string {
  return new Date().toISOString();
}

function getLogFile(): string {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(logDir, `crawler-${date}.log`);
}

function write(level: string, message: string) {
  const line = `[${getTimestamp()}] [${level}] ${message}`;
  console.log(line);
  try {
    ensureLogDir();
    fs.appendFileSync(getLogFile(), line + "\n", "utf-8");
  } catch {
    // 日志写入失败不影响主流程
  }
}

export const logger = {
  info: (msg: string) => write("INFO", msg),
  warn: (msg: string) => write("WARN", msg),
  error: (msg: string) => write("ERROR", msg),
  debug: (msg: string) => write("DEBUG", msg),
};
