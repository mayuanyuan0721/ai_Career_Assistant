/**
 * Technical article crawler
 * Sources:
 *   1. Direct known URLs (web.dev, MDN, React Blog, Vue Blog)
 *   2. Index pages (React Blog, Vue Blog, web.dev, MDN Blog)
 *   3. Juejin tag pages
 *   4. SegmentFault tag pages
 */
import * as cheerio from "cheerio";
import { config } from "../config/crawler.config";
import { Article, CrawlStats } from "../types";
import { fetchWithRetry } from "../utils/http";
import { cleanText, hashContent, deduplicateByHash, withMeta } from "../utils/formatter";
import { readJsonFile, writeJsonFile } from "../utils/storage";
import { logger } from "../utils/logger";

// Keywords that indicate a hijacked/spam page
const HIJACK_KEYWORDS = ["招嫖", "包养", "博彩", "约炮", "直播 进入", "娱乐城", "eval(function(p,a,c,k", "检测到当前浏览器已拦截"];

function isHijacked(content: string): boolean {
  return HIJACK_KEYWORDS.some((kw) => content.includes(kw));
}

/** Extract article content from a single page */
async function fetchArticleContent(url: string, source: string): Promise<Article | null> {
  try {
    const resp = await fetchWithRetry(url);
    const $ = cheerio.load(resp.data as string);

    const title = cleanText($("h1").first().text() || $("title").text());
    const selectors = ["article", "main", ".article-content", ".post-content", ".markdown-body", "#content", ".content"];

    let content = "";
    for (const sel of selectors) {
      const el = $(sel);
      if (el.length && el.text().length > 200) {
        content = cleanText(el.text());
        break;
      }
    }
    if (!content) content = cleanText($("body").text());

    if (content.length < 200) {
      logger.warn(`Dropped article (too short: ${content.length}): ${url}`);
      return null;
    }

    if (isHijacked(content)) {
      logger.warn(`Dropped article (hijacked/spam): ${url}`);
      return null;
    }

    const article: Article = withMeta(
      { title: title || url, content: content.slice(0, 5000), url },
      source
    );
    article.hash = hashContent(url);
    return article;
  } catch (err) {
    logger.error(`Failed to fetch article ${url}: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

/** Extract article links from an index/listing page */
async function fetchArticleLinks(
  indexUrl: string,
  label: string,
  linkFilter?: (href: string, text: string) => boolean
): Promise<string[]> {
  logger.info(`[Articles] Fetching index: ${label} (${indexUrl})`);
  const links: string[] = [];

  try {
    const resp = await fetchWithRetry(indexUrl);
    const $ = cheerio.load(resp.data as string);
    const baseUrl = new URL(indexUrl).origin;

    $("a[href]").each((_i, el) => {
      const href = $(el).attr("href") || "";
      const text = $(el).text().trim();

      const defaultFilter =
        href &&
        text.length > 8 &&
        !href.startsWith("#") &&
        !href.includes("twitter.com") &&
        !href.includes("github.com/sponsors") &&
        !href.includes("mailto:");

      if (!defaultFilter) return;
      if (linkFilter && !linkFilter(href, text)) return;

      const fullUrl = href.startsWith("http") ? href : `${baseUrl}${href}`;
      if (!links.includes(fullUrl)) links.push(fullUrl);
    });
  } catch (err) {
    logger.error(`Failed to fetch index ${indexUrl}: ${err instanceof Error ? err.message : String(err)}`);
  }

  return links.slice(0, 25);
}

/** Fetch article URLs from Juejin search API */
async function fetchJuejinArticles(tag: string, label: string): Promise<string[]> {
  const apiUrl = `https://api.juejin.cn/search_api/v1/search?query=${encodeURIComponent(tag)}&search_type=0&cursor=0&limit=20&version=1`;
  logger.info(`[Articles/Juejin] tag: ${tag}`);
  const links: string[] = [];

  try {
    const resp = await fetchWithRetry(apiUrl, {
      headers: { "Accept": "application/json", "Referer": "https://juejin.cn/" }
    });
    const data = resp.data as { data?: Array<{ article_info?: { article_id: string } }> };
    const items = data?.data || [];

    for (const item of items) {
      const id = item?.article_info?.article_id;
      if (id) links.push(`https://juejin.cn/post/${id}`);
    }
  } catch (err) {
    logger.error(`[Articles/Juejin] failed ${tag}: ${err instanceof Error ? err.message : String(err)}`);
  }

  logger.info(`[Articles/Juejin] found ${links.length} links for: ${tag}`);
  return links;
}

/** Fetch articles from SegmentFault tag page */
async function fetchSegmentfaultArticles(tag: string): Promise<string[]> {
  const url = `https://segmentfault.com/t/${encodeURIComponent(tag)}/blogs`;
  logger.info(`[Articles/SF] tag: ${tag}`);
  const links: string[] = [];

  try {
    const resp = await fetchWithRetry(url);
    const $ = cheerio.load(resp.data as string);

    $("a[href]").each((_i, el) => {
      const href = $(el).attr("href") || "";
      const text = $(el).text().trim();
      // SF article pattern: /a/xxxxxxxxxx
      if (href.match(/\/a\/\d+/) && text.length > 5) {
        const fullUrl = href.startsWith("http") ? href : `https://segmentfault.com${href}`;
        if (!links.includes(fullUrl)) links.push(fullUrl);
      }
    });
  } catch (err) {
    logger.error(`[Articles/SF] failed ${url}: ${err instanceof Error ? err.message : String(err)}`);
  }

  logger.info(`[Articles/SF] found ${links.length} links for tag: ${tag}`);
  return links.slice(0, 20);
}

/** Main entry: crawl technical articles */
export async function crawlArticles(): Promise<CrawlStats> {
  const stats: CrawlStats = { added: 0, skipped: 0, errors: 0 };
  logger.info("===== Start crawling Articles =====");

  const existing = readJsonFile<Article>(config.output.articles);
  const existingHashes = new Set(existing.map((a) => a.hash).filter(Boolean));
  const newArticles: Article[] = [];
  const targetTotal = config.targets.articles;

  async function tryFetch(url: string, source: string) {
    if (newArticles.length >= targetTotal) return;
    const hash = hashContent(url);
    if (existingHashes.has(hash)) { stats.skipped++; return; }

    const article = await fetchArticleContent(url, source);
    if (!article) { stats.errors++; return; }

    newArticles.push(article);
    existingHashes.add(hash);
  }

  // ── 1. Direct known URLs (most reliable) ────────────────────────────────
  logger.info("[Articles] Phase 1: Direct URLs");
  for (const { url, label } of config.articleDirectUrls) {
    await tryFetch(url, label);
  }

  // ── 2. Index pages (React Blog, Vue Blog, web.dev, MDN Blog) ─────────────
  logger.info("[Articles] Phase 2: Index pages");
  const indexSources = config.articleSources.filter(s =>
    ["React Blog", "Vue Blog", "web.dev", "MDN Blog"].includes(s.label)
  );
  for (const { url, label } of indexSources) {
    if (newArticles.length >= targetTotal) break;
    const links = await fetchArticleLinks(url, label);
    for (const link of links) {
      await tryFetch(link, label);
      if (newArticles.length >= targetTotal) break;
    }
  }

  // ── 3. Juejin tag pages ──────────────────────────────────────────────────
  logger.info("[Articles] Phase 3: Juejin");
  const juejinTags = [
    { tag: "前端", label: "juejin-frontend" },
    { tag: "React.js", label: "juejin-react" },
    { tag: "Vue.js", label: "juejin-vue" },
    { tag: "TypeScript", label: "juejin-typescript" },
    { tag: "前端性能优化", label: "juejin-performance" },
    { tag: "工程化", label: "juejin-engineering" },
  ];
  for (const { tag, label } of juejinTags) {
    if (newArticles.length >= targetTotal) break;
    const links = await fetchJuejinArticles(tag, label);
    for (const link of links) {
      await tryFetch(link, label);
      if (newArticles.length >= targetTotal) break;
    }
  }

  // ── 4. SegmentFault tag pages ────────────────────────────────────────────
  logger.info("[Articles] Phase 4: SegmentFault");
  const sfTags = [
    { tag: "javascript", label: "segmentfault-js" },
    { tag: "react", label: "segmentfault-react" },
    { tag: "vue.js", label: "segmentfault-vue" },
    { tag: "typescript", label: "segmentfault-ts" },
    { tag: "css3", label: "segmentfault-css" },
  ];
  for (const { tag, label } of sfTags) {
    if (newArticles.length >= targetTotal) break;
    const links = await fetchSegmentfaultArticles(tag);
    for (const link of links) {
      await tryFetch(link, label);
      if (newArticles.length >= targetTotal) break;
    }
  }

  const merged = deduplicateByHash([...existing, ...newArticles]);
  writeJsonFile(config.output.articles, merged);
  stats.added = newArticles.length;

  logger.info(`Articles done - added:${stats.added} skipped:${stats.skipped} errors:${stats.errors}`);
  return stats;
}
