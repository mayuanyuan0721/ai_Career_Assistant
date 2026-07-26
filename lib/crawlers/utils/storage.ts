import fs from "fs";
import path from "path";
import { logger } from "./logger";
import { safeStringify } from "./formatter";

/** 确保目录存在 */
export function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/** 读取已有JSON文件，不存在则返回空数组 */
export function readJsonFile<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T[];
  } catch (err) {
    logger.error(`读取JSON失败 ${filePath}: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

/** 写入JSON文件 */
export function writeJsonFile(filePath: string, data: unknown): boolean {
  const content = safeStringify(data);
  if (content === null) return false;
  ensureDir(filePath);
  fs.writeFileSync(filePath, content, "utf-8");
  logger.info(`已写入 ${filePath}`);
  return true;
}

/** 写入Markdown文件 */
export function writeMarkdownFile(filePath: string, content: string) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, content, "utf-8");
  logger.info(`已写入 ${filePath}`);
}
