import crypto from "crypto";
import { logger } from "./logger";

/** 清洗文本：去除HTML标签、多余空白、控制字符 */
export function cleanText(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, " ")           // 去除HTML标签
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // 控制字符
    .replace(/\s+/g, " ")               // 多余空白合并
    .trim();
}

/** 计算内容哈希，用于去重 */
export function hashContent(content: string): string {
  return crypto.createHash("md5").update(content).digest("hex");
}

/** 对记录列表按hash去重，保留最新 */
export function deduplicateByHash<T extends { hash?: string; collected_at: string }>(
  items: T[]
): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    const key = item.hash || hashContent(JSON.stringify(item));
    const existing = map.get(key);
    if (!existing || item.collected_at > existing.collected_at) {
      map.set(key, item);
    }
  }
  return Array.from(map.values());
}

/** 安全序列化JSON，失败时记录日志并返回null */
export function safeStringify(data: unknown): string | null {
  try {
    return JSON.stringify(data, null, 2);
  } catch (err) {
    logger.error(`JSON序列化失败: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

/** 添加元数据字段 */
export function withMeta<T extends object>(record: T, source: string): T & { source: string; collected_at: string } {
  return {
    ...record,
    source,
    collected_at: new Date().toISOString(),
  };
}
