/**
 * 真实岗位数据爬虫
 * 使用 Puppeteer 爬取真实招聘网站数据，替代之前的模拟数据
 */
import { CrawlerManager } from "./real-job-crawler";
import { logger } from "../utils/logger";

/**
 * 爬取真实岗位数据
 */
export async function crawlRealJobs(): Promise<{ added: number; skipped: number; errors: number }> {
  logger.info("===== Start crawling real jobs =====");
  
  // 爬取配置
  const config = {
    platform: "boss" as const,
    keywords: ["前端开发工程师", "React开发工程师", "Vue开发工程师"],
    cities: ["北京", "上海", "深圳"],
    industrySlug: "frontend",
  };

  let added = 0;
  let errors = 0;

  // 遍历关键词和城市
  for (const keyword of config.keywords) {
    for (const city of config.cities) {
      logger.info(`\nCrawling: ${keyword} in ${city}`);

      try {
        const result = await CrawlerManager.crawlAndImport(
          config.platform,
          keyword,
          city,
          config.industrySlug
        );

        if (result.success) {
          logger.info(`✅ Success: ${result.jobsCount} jobs imported`);
          added += result.jobsCount;
        } else {
          logger.error(`❌ Failed: ${result.error}`);
          errors++;
        }

        // 延迟，避免请求过快
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (error) {
        logger.error(`Error crawling ${keyword} in ${city}:`, error);
        errors++;
      }
    }
  }

  logger.info("\n===== Crawling completed =====");
  logger.info(`Added: ${added}, Errors: ${errors}`);

  return { added, skipped: 0, errors };
}
