# 真实招聘数据爬虫系统

## 📋 概述

本系统使用 **Puppeteer**（无头浏览器）直接爬取真实招聘网站的岗位数据，替代之前的模拟数据生成器。

### 支持的招聘平台

- ✅ **Boss直聘** (zhipin.com)
- ✅ **拉勾网** (lagou.com)
- ✅ **猎聘网** (liepin.com)

---

## 🚀 快速开始

### 1. 运行爬虫

```bash
# 爬取所有配置的平台和城市
npm run crawl:jobs

# 或者使用 API 触发
curl -X POST http://localhost:3000/api/career/crawl-jobs \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "boss",
    "keywords": ["前端开发工程师", "React开发工程师"],
    "cities": ["北京", "上海"]
  }'
```

### 2. 通过设置页面

1. 访问 `/settings` 页面
2. 找到"真实招聘数据爬取"部分
3. 选择平台、配置关键词和城市
4. 点击"开始爬取真实数据"

---

## 🔧 配置

### 爬虫配置

编辑 `lib/crawlers/index.ts`：

```typescript
const CRAWL_CONFIG = {
  platform: "boss",  // 招聘平台
  keywords: ["前端开发工程师", "React开发工程师"],  // 搜索关键词
  cities: ["北京", "上海", "深圳"],  // 目标城市
  industrySlug: "frontend",  // 行业
  headless: true,  // 无头模式
};
```

### API 调用

```typescript
import { CrawlerManager } from "@/lib/crawlers/crawlers/real-job-crawler";

const result = await CrawlerManager.crawlAndImport(
  "boss",           // 平台
  "前端开发工程师",   // 关键词
  "北京",           // 城市
  "frontend"        // 行业
);

console.log(`成功导入 ${result.jobsCount} 条数据`);
```

---

## 📊 工作原理

### 1. Puppeteer 爬虫

```typescript
// 启动无头浏览器
const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

// 访问招聘网站
await page.goto("https://www.zhipin.com/web/geek/job?query=前端&city=北京");

// 等待页面加载
await page.waitForSelector(".job-list-box");

// 解析 HTML
const html = await page.content();
const $ = cheerio.load(html);

// 提取数据
$(".job-card-wrapper").each((i, el) => {
  const title = $(el).find(".job-name").text();
  const company = $(el).find(".company-name").text();
  // ...
});
```

### 2. 数据导入

爬取的数据会自动导入 Supabase 数据库：

```typescript
const { data, error } = await supabase
  .from("jobs")
  .upsert(dbJobs, { onConflict: "hash" })
  .select();
```

### 3. 去重机制

使用 URL hash 进行去重，避免重复导入相同岗位。

---

## ⚠️ 注意事项

### 1. 请求频率

- 建议每次请求间隔 2-3 秒
- 避免短时间内大量请求
- 可能触发反爬虫机制

### 2. 反爬虫策略

招聘网站通常有反爬虫机制：

- **User-Agent**：已设置常见的浏览器 UA
- **请求间隔**：代码中已添加延迟
- **IP 限制**：可能需要代理（未实现）

### 3. 数据质量

- 爬取的是真实网页数据
- 数据质量取决于目标网站
- 可能需要清洗和格式化

### 4. 合规使用

- 遵守目标网站的使用条款
- 不要过度抓取
- 仅用于合法用途

---

## 🛠️ 技术栈

- **Puppeteer**：无头浏览器
- **Cheerio**：HTML 解析
- **Supabase**：数据存储
- **TypeScript**：类型安全

---

## 📝 扩展新平台

### 1. 创建爬虫类

```typescript
export class NewPlatformCrawler extends BaseCrawler {
  async crawl(keyword: string, city: string): Promise<RealJobData[]> {
    const browser = await this.launchBrowser();
    const jobs: RealJobData[] = [];

    try {
      const page = await this.newPage(browser);
      await page.goto(`https://newplatform.com/search?keyword=${keyword}&city=${city}`);
      
      // 解析页面
      const html = await page.content();
      const $ = cheerio.load(html);
      
      // 提取数据
      $(".job-item").each((i, el) => {
        jobs.push({
          title: $(el).find(".title").text(),
          company: $(el).find(".company").text(),
          // ...
        });
      });
    } finally {
      await browser.close();
    }

    return jobs;
  }
}
```

### 2. 注册到 CrawlerManager

```typescript
export class CrawlerManager {
  static async crawlAndImport(platform: string, ...) {
    let crawler: BaseCrawler;
    switch (platform) {
      case "boss":
        crawler = new BossCrawler();
        break;
      case "newplatform":
        crawler = new NewPlatformCrawler();
        break;
      // ...
    }
  }
}
```

---

## 🆘 常见问题

### Q: 爬取失败怎么办？

A: 
1. 检查网络连接
2. 确认目标网站可访问
3. 查看控制台错误日志
4. 可能需要更新选择器（网站结构可能变化）

### Q: 数据不准确？

A: 
- 检查 CSS 选择器是否正确
- 网站结构可能已更新
- 需要调整解析逻辑

### Q: 被反爬虫拦截？

A: 
- 增加请求间隔
- 使用代理 IP
- 添加更多的 User-Agent 轮换

---

## 📖 相关文档

- [Puppeteer 官方文档](https://pptr.dev/)
- [Cheerio 官方文档](https://cheerio.js.org/)
- [Supabase 文档](https://supabase.com/docs)

---

**现在你的系统拥有真实的招聘数据了！** 🎉
