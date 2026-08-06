/**
 * 真实招聘数据爬虫 - 使用 Puppeteer
 * 支持爬取 Boss直聘、拉勾网、猎聘等真实招聘网站
 */

import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@/lib/supabase/server";
import { logger } from "../utils/logger";

// 登录状态文件
const AUTH_FILE = path.join(process.cwd(), "auth-state.json");

// 爬虫配置
interface CrawlerConfig {
  headless?: boolean;
  timeout?: number;
  userAgent?: string;
}

// 岗位数据接口
export interface RealJobData {
  title: string;
  company: string;
  location: string;
  salary: string;
  experience: string;
  education: string;
  skills: string[];
  description: string;
  source: string;
  source_url: string;
  posted_at: string;
}

/**
 * 基础爬虫类
 */
export class BaseCrawler {
  protected config: CrawlerConfig;
  
  constructor(config: CrawlerConfig = {}) {
    this.config = {
      headless: config.headless ?? true,
      timeout: config.timeout ?? 30000,
      userAgent: config.userAgent ?? "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };
  }

  /**
   * 启动浏览器
   */
  protected async launchBrowser() {
    const browser = await puppeteer.launch({
      headless: this.config.headless,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--disable-blink-features=AutomationControlled",
        "--disable-infobars",
        "--window-size=1920,1080",
        "--start-maximized", // 最大化窗口
      ],
      defaultViewport: null, // 使用默认视口
    });
    return browser;
  }

  /**
   * 创建新页面并设置 User-Agent 和登录状态
   */
  protected async newPage(browser: any) {
    const page = await browser.newPage();
    await page.setUserAgent(this.config.userAgent!);
    await page.setDefaultTimeout(this.config.timeout!);
    await page.setViewport({ width: 1920, height: 1080 });
    
    // 隐藏 webdriver 标志
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
      });
    });
    
    // 将窗口置顶
    await page.bringToFront();
    
    // 加载登录状态
    if (fs.existsSync(AUTH_FILE)) {
      try {
        const cookiesString = fs.readFileSync(AUTH_FILE, "utf-8");
        const cookies = JSON.parse(cookiesString);
        await page.setCookie(...cookies);
        logger.info("[Crawler] Loaded login cookies");
      } catch (error) {
        logger.warn("[Crawler] Failed to load login cookies");
      }
    } else {
      logger.warn("[Crawler] No login state found. Please run login-helper first");
    }
    
    return page;
  }

  /**
   * 延迟函数
   */
  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 根据经验判断级别
   */
  protected getLevelFromExperience(exp: string): string {
    if (!exp) return "middle";
    const expLower = exp.toLowerCase();
    if (expLower.includes("1-3") || expLower.includes("1年") || expLower.includes("2年") || expLower.includes("3年")) {
      return "junior";
    }
    if (expLower.includes("5+") || expLower.includes("5-10") || expLower.includes("10年")) {
      return "senior";
    }
    return "middle";
  }

  /**
   * 生成内容 hash
   */
  protected generateHash(url: string): string {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * 爬取方法（子类实现）
   */
  async crawl(keyword: string, city: string): Promise<RealJobData[]> {
    throw new Error("Method 'crawl()' must be implemented");
  }
}

/**
 * Boss直聘爬虫
 */
export class BossCrawler extends BaseCrawler {
  async crawl(keyword: string, city: string): Promise<RealJobData[]> {
    logger.info(`[BossCrawler] Crawling: ${keyword} in ${city}`);
    
    const browser = await this.launchBrowser();
    const jobs: RealJobData[] = [];

    try {
      const page = await this.newPage(browser);
      
      // 构造搜索 URL
      const searchUrl = `https://www.zhipin.com/web/geek/job?query=${encodeURIComponent(keyword)}&city=${encodeURIComponent(city)}`;
      
      await page.goto(searchUrl, { waitUntil: "networkidle2" });
      await this.delay(2000);

      // 等待职位列表加载
      await page.waitForSelector(".job-list-box", { timeout: 10000 });

      // 获取页面内容
      const html = await page.content();
      const $ = cheerio.load(html);

      // 解析职位列表
      $(".job-card-wrapper").each((index, element) => {
        if (index >= 30) return; // 只取前30条

        const title = $(element).find(".job-name").text().trim();
        const company = $(element).find(".company-name").text().trim();
        const salary = $(element).find(".salary").text().trim();
        const location = $(element).find(".job-area").text().trim();
        const experience = $(element).find(".tag-list li").eq(0).text().trim();
        const education = $(element).find(".tag-list li").eq(1).text().trim();
        
        // 提取技能
        const skills: string[] = [];
        $(element).find(".tag-list li").each((i, el) => {
          if (i >= 2) {
            const skill = $(el).text().trim();
            if (skill) skills.push(skill);
          }
        });

        const jobUrl = $(element).find("a").attr("href") || "";
        const fullUrl = jobUrl.startsWith("http") ? jobUrl : `https://www.zhipin.com${jobUrl}`;

        jobs.push({
          title,
          company,
          location: `${city} ${location}`,
          salary,
          experience,
          education,
          skills,
          description: "",
          source: "boss",
          source_url: fullUrl,
          posted_at: new Date().toISOString(),
        });
      });

      logger.info(`[BossCrawler] Found ${jobs.length} jobs`);
    } catch (error) {
      logger.error("[BossCrawler] Crawl failed:", error);
    } finally {
      await browser.close();
    }

    return jobs;
  }
}

/**
 * 拉勾网爬虫
 */
export class LagouCrawler extends BaseCrawler {
  async crawl(keyword: string, city: string): Promise<RealJobData[]> {
    logger.info(`[LagouCrawler] Crawling: ${keyword} in ${city}`);
    
    const browser = await this.launchBrowser();
    const jobs: RealJobData[] = [];

    try {
      const page = await this.newPage(browser);
      
      // 构造搜索 URL
      const searchUrl = `https://www.lagou.com/wn/zhaopin?kd=${encodeURIComponent(keyword)}&city=${encodeURIComponent(city)}`;
      
      await page.goto(searchUrl, { waitUntil: "networkidle2" });
      await this.delay(2000);

      // 检查页面标题，判断是否触发验证码
      const pageTitle = await page.title();
      logger.info(`[LagouCrawler] Page title: ${pageTitle}`);
      
      if (pageTitle.includes("验证") || pageTitle.includes("滑动")) {
        logger.warn("[LagouCrawler] ========================================");
        logger.warn("[LagouCrawler] ⚠️ 检测到验证码页面！");
        logger.warn("[LagouCrawler] 请在浏览器中手动完成验证码...");
        logger.warn("[LagouCrawler] 等待最多 120 秒...");
        logger.warn("[LagouCrawler] 💡 提示：请查看任务栏或按 Alt+Tab 切换到浏览器窗口");
        logger.warn("[LagouCrawler] ========================================");
        
        // 等待验证码完成（最多 120 秒）
        try {
          await page.waitForFunction(
            () => {
              const title = document.title;
              return !title.includes("验证") && !title.includes("滑动");
            },
            { timeout: 120000 }
          );
          logger.info("[LagouCrawler] ✅ 验证码已完成，继续爬取...");
          await this.delay(3000);
          
          // 重新加载页面
          await page.reload({ waitUntil: "networkidle2" });
          await this.delay(2000);
        } catch (error) {
          logger.error("[LagouCrawler] ❌ 验证码等待超时");
          return jobs;
        }
      }

      // 等待职位列表加载
      await page.waitForSelector(".item__10RTO", { timeout: 10000 });

      // 获取页面内容
      const html = await page.content();
      const $ = cheerio.load(html);

      // 解析职位列表
      $(".item__10RTO").each((index, element) => {
        if (index >= 30) return;

        const title = $(element).find(".position-name").text().trim();
        const company = $(element).find(".company-name").text().trim();
        const salary = $(element).find(".money__3Lkgq").text().trim();
        const location = $(element).find(".city").text().trim();
        const experience = $(element).find(".spantag__2dU2M").eq(0).text().trim();
        const education = $(element).find(".spantag__2dU2M").eq(1).text().trim();
        
        // 提取技能
        const skills: string[] = [];
        $(element).find(".spantag__2dU2M").each((i, el) => {
          if (i >= 2) {
            const skill = $(el).text().trim();
            if (skill) skills.push(skill);
          }
        });

        const jobUrl = $(element).find("a").attr("href") || "";
        const fullUrl = jobUrl.startsWith("http") ? jobUrl : `https://www.lagou.com${jobUrl}`;

        jobs.push({
          title,
          company,
          location: `${city} ${location}`,
          salary,
          experience,
          education,
          skills,
          description: "",
          source: "lagou",
          source_url: fullUrl,
          posted_at: new Date().toISOString(),
        });
      });

      logger.info(`[LagouCrawler] Found ${jobs.length} jobs`);
    } catch (error) {
      logger.error("[LagouCrawler] Crawl failed:", error);
    } finally {
      await browser.close();
    }

    return jobs;
  }
}

/**
 * 猎聘网爬虫
 */
export class LiepinCrawler extends BaseCrawler {
  async crawl(keyword: string, city: string): Promise<RealJobData[]> {
    logger.info(`[LiepinCrawler] Crawling: ${keyword} in ${city}`);
    
    const browser = await this.launchBrowser();
    const jobs: RealJobData[] = [];

    try {
      const page = await this.newPage(browser);
      
      // 构造搜索 URL
      const searchUrl = `https://www.liepin.com/zhaopin/?key=${encodeURIComponent(keyword)}&dqs=${encodeURIComponent(city)}`;
      
      await page.goto(searchUrl, { waitUntil: "networkidle2" });
      await this.delay(2000);

      // 等待职位列表加载
      await page.waitForSelector(".job-list-item", { timeout: 10000 });

      // 获取页面内容
      const html = await page.content();
      const $ = cheerio.load(html);

      // 解析职位列表
      $(".job-list-item").each((index, element) => {
        if (index >= 30) return;

        const title = $(element).find(".job-title-text").text().trim();
        const company = $(element).find(".company-name").text().trim();
        const salary = $(element).find(".job-salary").text().trim();
        const location = $(element).find(".job-dq").text().trim();
        const experience = $(element).find(".labels span").eq(0).text().trim();
        const education = $(element).find(".labels span").eq(1).text().trim();
        
        // 提取技能
        const skills: string[] = [];
        $(element).find(".labels span").each((i, el) => {
          if (i >= 2) {
            const skill = $(el).text().trim();
            if (skill) skills.push(skill);
          }
        });

        const jobUrl = $(element).find("a").attr("href") || "";
        const fullUrl = jobUrl.startsWith("http") ? jobUrl : `https://www.liepin.com${jobUrl}`;

        jobs.push({
          title,
          company,
          location: `${city} ${location}`,
          salary,
          experience,
          education,
          skills,
          description: "",
          source: "liepin",
          source_url: fullUrl,
          posted_at: new Date().toISOString(),
        });
      });

      logger.info(`[LiepinCrawler] Found ${jobs.length} jobs`);
    } catch (error) {
      logger.error("[LiepinCrawler] Crawl failed:", error);
    } finally {
      await browser.close();
    }

    return jobs;
  }
}

/**
 * 爬虫管理器
 */
export class CrawlerManager {
  /**
   * 爬取真实岗位数据并导入数据库
   */
  static async crawlAndImport(
    platform: "boss" | "lagou" | "liepin",
    keyword: string,
    city: string,
    industrySlug: string = "frontend"
  ): Promise<{ success: boolean; jobsCount: number; error?: string }> {
    try {
      logger.info(`[CrawlerManager] Starting crawl: ${platform} - ${keyword} in ${city}`);

      // 创建对应的爬虫实例
      let crawler: BaseCrawler;
      switch (platform) {
        case "boss":
          crawler = new BossCrawler();
          break;
        case "lagou":
          crawler = new LagouCrawler();
          break;
        case "liepin":
          crawler = new LiepinCrawler();
          break;
        default:
          return { success: false, jobsCount: 0, error: "Unsupported platform" };
      }

      // 爬取数据
      const jobs = await crawler.crawl(keyword, city);

      if (jobs.length === 0) {
        logger.warn("[CrawlerManager] No jobs found");
        return { success: true, jobsCount: 0 };
      }

      // 导入数据库
      const supabase = await createClient();
      
      // 获取行业 ID
      const { data: industry } = await supabase
        .from("industries")
        .select("id")
        .eq("slug", industrySlug)
        .single();

      if (!industry) {
        logger.error(`[CrawlerManager] Industry not found: ${industrySlug}`);
        return { success: false, jobsCount: 0, error: "Industry not found" };
      }

      // 转换数据格式
      const dbJobs = jobs.map((job) => ({
        industry_id: industry.id,
        title: job.title,
        level: new BaseCrawler().getLevelFromExperience(job.experience),
        experience: job.experience,
        salary: job.salary,
        education: job.education,
        skills: job.skills,
        description: job.description,
        requirements: [],
        company: job.company,
        company_size: "100-500人",
        location: job.location,
        address: job.location,
        source: job.source,
        job_url: job.source_url,
        posted_at: job.posted_at,
        collected_at: new Date().toISOString(),
        hash: new BaseCrawler().generateHash(job.source_url),
        is_active: true,
      }));

      // 导入数据库
      const { data, error } = await supabase
        .from("jobs")
        .upsert(dbJobs, { onConflict: "hash" })
        .select();

      if (error) {
        logger.error("[CrawlerManager] Import failed:", error);
        return { success: false, jobsCount: 0, error: error.message };
      }

      logger.info(`[CrawlerManager] Successfully imported ${data?.length} jobs`);
      return { success: true, jobsCount: data?.length || 0 };
    } catch (error) {
      logger.error("[CrawlerManager] Crawl failed:", error);
      return { 
        success: false, 
        jobsCount: 0, 
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
