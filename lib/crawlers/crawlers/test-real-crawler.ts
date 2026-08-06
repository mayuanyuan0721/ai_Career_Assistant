/**
 * 测试真实爬虫
 */

import { BossCrawler, LagouCrawler, LiepinCrawler } from "./real-job-crawler";

async function testCrawlers() {
  console.log("🧪 Testing Real Job Crawlers...\n");

  // 测试 Boss 直聘
  console.log("📊 Testing Boss 直聘...");
  try {
    const bossCrawler = new BossCrawler({ headless: true });
    const jobs = await bossCrawler.crawl("前端开发工程师", "北京");
    console.log(`✅ Boss 直聘: Found ${jobs.length} jobs`);
    if (jobs.length > 0) {
      console.log("Sample job:", jobs[0]);
    }
  } catch (error) {
    console.error("❌ Boss 直聘 failed:", error);
  }

  console.log("\n---\n");

  // 测试拉勾网
  console.log("📊 Testing 拉勾网...");
  try {
    const lagouCrawler = new LagouCrawler({ headless: true });
    const jobs = await lagouCrawler.crawl("React开发工程师", "上海");
    console.log(`✅ 拉勾网: Found ${jobs.length} jobs`);
    if (jobs.length > 0) {
      console.log("Sample job:", jobs[0]);
    }
  } catch (error) {
    console.error("❌ 拉勾网 failed:", error);
  }

  console.log("\n---\n");

  // 测试猎聘
  console.log("📊 Testing 猎聘...");
  try {
    const liepinCrawler = new LiepinCrawler({ headless: true });
    const jobs = await liepinCrawler.crawl("Vue开发工程师", "深圳");
    console.log(`✅ 猎聘: Found ${jobs.length} jobs`);
    if (jobs.length > 0) {
      console.log("Sample job:", jobs[0]);
    }
  } catch (error) {
    console.error("❌ 猎聘 failed:", error);
  }
}

testCrawlers().catch(console.error);
