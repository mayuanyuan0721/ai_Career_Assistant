import { NextRequest } from "next/server";
import { CrawlerManager } from "@/lib/crawlers/crawlers/real-job-crawler";

/**
 * POST /api/career/crawl-jobs
 * 触发真实岗位数据爬取
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      platform = "boss",
      keywords = ["前端开发工程师", "React开发工程师", "Vue开发工程师"],
      cities = ["北京", "上海", "深圳"],
      industrySlug = "frontend",
    } = body;

    console.log("[API Crawl] Starting crawl with params:", {
      platform,
      keywords,
      cities,
      industrySlug,
    });

    let totalJobs = 0;
    let successCount = 0;
    let failCount = 0;

    // 遍历关键词和城市
    for (const keyword of keywords) {
      for (const city of cities) {
        const result = await CrawlerManager.crawlAndImport(
          platform,
          keyword,
          city,
          industrySlug
        );

        if (result.success) {
          totalJobs += result.jobsCount;
          successCount++;
        } else {
          failCount++;
        }

        // 延迟
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    return Response.json({
      success: true,
      message: `成功爬取 ${totalJobs} 条岗位数据`,
      jobsCount: totalJobs,
      successCount,
      failCount,
    });
  } catch (error) {
    console.error("[API Crawl] Error:", error);
    return Response.json({
      success: false,
      message: "爬取失败",
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

/**
 * GET /api/career/crawl-jobs
 * 获取爬取状态
 */
export async function GET() {
  return Response.json({
    success: true,
    message: "Crawl API is ready",
    supportedPlatforms: ["boss", "lagou", "liepin"],
    description: "使用 Puppeteer 爬取真实招聘网站数据",
  });
}
