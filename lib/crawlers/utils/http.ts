import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import https from "https";
import { config } from "../config/crawler.config";
import { logger } from "./logger";

// 忽略 SSL 证书错误（代理/VPN 环境下证书不匹配问题）
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

/** 随机延迟 */
export async function randomDelay(min = config.request.minDelay, max = config.request.maxDelay) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 带重试的 GET 请求 */
export async function fetchWithRetry(
  url: string,
  axiosConfig: AxiosRequestConfig = {}
): Promise<AxiosResponse> {
  const maxRetries = config.request.maxRetries;
  const baseDelay = config.request.retryBaseDelay;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      await randomDelay();
      const response = await axios.get(url, {
        timeout: config.request.timeout,
        httpsAgent,
        headers: { "User-Agent": config.request.userAgent },
        ...axiosConfig,
      });
      return response;
    } catch (err: unknown) {
      const isLast = attempt === maxRetries + 1;
      const errMsg = err instanceof Error ? err.message : String(err);
      if (isLast) {
        logger.error(`Request failed after ${maxRetries} retries [${url}]: ${errMsg}`);
        throw err;
      }
      const waitMs = baseDelay * attempt;
      logger.warn(`Request attempt ${attempt} failed [${url}]: ${errMsg}, retrying in ${waitMs}ms`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  throw new Error("Unreachable");
}
