/**
 * Frontend skill model crawler
 * Collects skill docs from MDN, React, Vue, TypeScript official docs
 * Outputs structured Markdown per category
 */
import * as cheerio from "cheerio";
import path from "path";
import { config } from "../config/crawler.config";
import { SkillDoc, SkillCategory, CrawlStats } from "../types";
import { fetchWithRetry } from "../utils/http";
import { cleanText } from "../utils/formatter";
import { writeMarkdownFile } from "../utils/storage";
import { logger } from "../utils/logger";

// Keywords that indicate a hijacked/spam page - discard immediately
const HIJACK_KEYWORDS = ["招嫖", "包养", "博彩", "约炮", "直播 进入", "娱乐城", "eval(function(p,a,c,k", "检测到当前浏览器已拦截"];

function isHijacked(content: string): boolean {
  return HIJACK_KEYWORDS.some((kw) => content.includes(kw));
}

/** Fetch and extract main text content from a documentation page */
async function fetchPageContent(url: string): Promise<{ title: string; content: string } | null> {
  try {
    const resp = await fetchWithRetry(url);
    const $ = cheerio.load(resp.data as string);

    const contentSelectors = ["article", "main", ".content", "#content", ".documentation", ".docs"];
    let content = "";
    const title = cleanText($("h1").first().text() || $("title").text());

    for (const sel of contentSelectors) {
      const el = $(sel);
      if (el.length && el.text().length > 200) {
        content = cleanText(el.text());
        break;
      }
    }

    if (!content) content = cleanText($("body").text());

    if (!content || content.length < 100) {
      logger.warn(`Page empty or unparseable: ${url}`);
      return null;
    }

    if (isHijacked(content)) {
      logger.warn(`Page hijacked/spam, discarding: ${url}`);
      return null;
    }

    return { title, content: content.slice(0, 3000) };
  } catch (err) {
    logger.error(`Failed to fetch page ${url}: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

/** Format collected docs into a Markdown skill document */
function formatSkillMarkdown(
  category: SkillCategory,
  docs: Array<{ title: string; content: string; url: string }>
): string {
  const categoryLabel: Record<SkillCategory, string> = {
    javascript: "JavaScript",
    react: "React",
    vue: "Vue",
    typescript: "TypeScript",
    engineering: "Frontend Engineering",
    browser: "Browser Internals",
  };

  const label = categoryLabel[category];
  const lines: string[] = [
    `# ${label} Skill Model`,
    "",
    `> Collected at: ${new Date().toISOString()}`,
    "> Source: Official Documentation",
    "",
    "---",
    "",
    "## Junior Level",
    "",
    "Master basic syntax, concepts, and common APIs.",
    "",
    "## Intermediate Level",
    "",
    "Understand internals, performance optimization, and design patterns.",
    "",
    "## Senior Level",
    "",
    "Deep implementation knowledge, architectural decisions, and complex problem solving.",
    "",
    "---",
    "",
    "## Reference Documents",
    "",
  ];

  for (const doc of docs) {
    lines.push(`### ${doc.title || doc.url}`);
    lines.push("");
    lines.push(`Source: ${doc.url}`);
    lines.push("");
    lines.push(doc.content.slice(0, 800));
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

/** Crawl all pages for one skill category */
async function crawlCategorySkills(
  category: SkillCategory,
  urls: string[]
): Promise<SkillDoc | null> {
  logger.info(`[Skills] category: ${category}, urls: ${urls.length}`);
  const docs: Array<{ title: string; content: string; url: string }> = [];

  for (const url of urls) {
    const result = await fetchPageContent(url);
    if (result) {
      docs.push({ ...result, url });
    }
  }

  if (docs.length === 0) {
    logger.warn(`[Skills] No content collected for: ${category}`);
    return null;
  }

  return {
    category,
    title: `${category} Skill Model`,
    content: formatSkillMarkdown(category, docs),
    source: urls[0],
    collected_at: new Date().toISOString(),
  };
}

/** Main entry: crawl skill documents */
export async function crawlSkills(): Promise<CrawlStats> {
  const stats: CrawlStats = { added: 0, skipped: 0, errors: 0 };
  logger.info("===== Start crawling Skills =====");

  const categories = Object.keys(config.skillSources) as SkillCategory[];

  for (const category of categories) {
    try {
      const urls = config.skillSources[category];
      const skillDoc = await crawlCategorySkills(category, urls);

      if (!skillDoc) {
        stats.errors++;
        continue;
      }

      const outputPath = path.join(config.output.skills, `${category}_skills.md`);
      writeMarkdownFile(outputPath, skillDoc.content);
      stats.added++;
    } catch (err) {
      stats.errors++;
      logger.error(`Category ${category} failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  logger.info(`Skills done - added:${stats.added} skipped:${stats.skipped} errors:${stats.errors}`);
  return stats;
}
