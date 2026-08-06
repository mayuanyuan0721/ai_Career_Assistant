/**
 * 真实岗位数据爬虫入口
 * 使用 Puppeteer 爬取真实招聘网站的岗位数据
 */
import { CrawlerManager } from "./crawlers/real-job-crawler";
import { logger } from "./utils/logger";

// 爬取配置
const CRAWL_CONFIG = {
  // 招聘平台
  platform: "lagou" as "boss" | "lagou" | "liepin",
  
  // 搜索关键词
  keywords: ["前端开发工程师", "React开发工程师", "Vue开发工程师"],
  
  // 目标城市
  cities: ["北京", "上海", "深圳", "杭州"],
  
  // 行业
  industrySlug: "frontend",
  
  // 是否无头模式（不显示浏览器窗口）
  // 注意：如果需要手动完成验证码，需要设置为 false
  headless: false,
};

/**
 * 主函数
 */
async function main() {
  logger.info("===== Start crawling real jobs =====");
  logger.info(`Platform: ${CRAWL_CONFIG.platform}`);
  logger.info(`Keywords: ${CRAWL_CONFIG.keywords.join(", ")}`);
  logger.info(`Cities: ${CRAWL_CONFIG.cities.join(", ")}`);
  logger.info(`Industry: ${CRAWL_CONFIG.industrySlug}`);

  let totalJobs = 0;
  let successCount = 0;
  let failCount = 0;

  // 遍历关键词和城市
  for (const keyword of CRAWL_CONFIG.keywords) {
    for (const city of CRAWL_CONFIG.cities) {
      logger.info(`\nCrawling: ${keyword} in ${city}`);

      try {
        const result = await CrawlerManager.crawlAndImport(
          CRAWL_CONFIG.platform,
          keyword,
          city,
          CRAWL_CONFIG.industrySlug
        );

        if (result.success) {
          logger.info(`✅ Success: ${result.jobsCount} jobs imported`);
          totalJobs += result.jobsCount;
          successCount++;
        } else {
          logger.error(`❌ Failed: ${result.error}`);
          failCount++;
        }

        // 延迟，避免请求过快
        logger.info("Waiting 3 seconds before next crawl...");
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (error) {
        logger.error(`Error crawling ${keyword} in ${city}:`, error);
        failCount++;
      }
    }
  }

  logger.info("\n===== Crawling completed =====");
  logger.info(`Total jobs: ${totalJobs}`);
  logger.info(`Success: ${successCount}`);
  logger.info(`Failed: ${failCount}`);
}

// 运行爬虫
main().catch((error) => {
  logger.error("Unhandled error:", error);
  process.exit(1);
});
