# 多行业职业助手 - 实施指南

## 📋 已完成的工作

### ✅ Phase 1: 数据库基础架构

1. **数据库 Schema** (`database/schema.sql`)
   - 行业表 (industries)
   - 技能表 (skills) - 按行业分类
   - 岗位表 (jobs) - 按行业分类
   - 简历模板表 (resume_templates)
   - 面试题库表 (interview_questions)
   - 用户简历表扩展

2. **数据迁移脚本** (`database/migrate-data.ts`)
   - 迁移行业数据
   - 迁移前端岗位数据
   - 迁移前端技能数据

3. **API 接口**
   - `GET /api/industries` - 获取行业列表
   - `GET /api/jobs?industry=frontend` - 获取指定行业的岗位

4. **UI 组件**
   - `IndustrySelector` - 行业选择器

---

## 🚀 下一步计划

### Phase 2: 数据库部署（今天）

#### 1. 在 Supabase 执行 SQL

登录 Supabase Dashboard:
https://supabase.com/dashboard/project/peiqgyytxaahbzjyikew/sql/new

复制 `database/schema.sql` 的内容并执行。

#### 2. 运行数据迁移

```bash
# 安装依赖（如果需要）
npm install @supabase/supabase-js

# 运行迁移脚本
npx ts-node database/migrate-data.ts
```

#### 3. 验证数据

```bash
# 测试 API
curl http://localhost:3000/api/industries
```

### Phase 3: 重构现有功能

#### 3.1 修改岗位匹配面板

修改 `components/RightPanel/JobMatchPanel.tsx`:
- 添加行业选择器
- 根据选择的行业加载岗位
- 更新 API 调用

```typescript
// 示例代码
const [selectedIndustry, setSelectedIndustry] = useState("frontend");

<IndustrySelector 
    value={selectedIndustry} 
    onChange={setSelectedIndustry} 
/>

// 获取岗位时传入行业
useEffect(() => {
    fetch(`/api/jobs?industry=${selectedIndustry}`)
        .then(...)
}, [selectedIndustry]);
```

#### 3.2 修改面试面板

修改 `components/RightPanel/InterviewPanel.tsx`:
- 根据行业加载面试题库
- 更新 prompt 模板

#### 3.3 修改简历分析

修改 `lib/prompts/resume.ts`:
- 为不同行业创建不同的 prompt 模板
- 根据目标行业使用不同的分析策略

### Phase 4: 爬虫系统重构

创建通用爬虫框架:

```typescript
// lib/crawlers/base-crawler.ts
abstract class BaseCrawler {
    abstract industry: string;
    abstract sources: string[];
    
    async crawl(): Promise<CrawlResult> {
        const jobs = await this.crawlJobs();
        const skills = await this.crawlSkills();
        return { industry: this.industry, jobs, skills };
    }
    
    protected abstract crawlJobs(): Promise<Job[]>;
    protected abstract crawlSkills(): Promise<Skill[]>;
}

// 为每个行业创建爬虫
// lib/crawlers/backend-crawler.ts
class BackendCrawler extends BaseCrawler {
    industry = "backend";
    sources = ["Boss直聘", "牛客网"];
    // ...
}
```

### Phase 5: AI 分析器重构

```typescript
// lib/analyzers/industry-analyzer.ts
class IndustryAnalyzer {
    private templates: Map<string, PromptTemplate>;
    
    async analyze(resume: Resume, industry: string) {
        const template = this.templates.get(industry);
        const prompt = template.build(resume);
        return await this.callAI(prompt);
    }
}
```

---

## 📊 数据模型

### 行业表 (industries)
```sql
id UUID
name TEXT              -- "前端开发"
slug TEXT              -- "frontend"
icon TEXT              -- "🎨"
description TEXT
is_active BOOLEAN
```

### 技能表 (skills)
```sql
id UUID
industry_id UUID       -- 关联行业
category TEXT          -- "编程语言" | "框架" | ...
name TEXT
name_en TEXT
level TEXT             -- "junior" | "middle" | "senior" | "all"
weight INT             -- 权重 1-5
is_core BOOLEAN
```

### 岗位表 (jobs)
```sql
id UUID
industry_id UUID       -- 关联行业
title TEXT
level TEXT
experience TEXT
salary TEXT
skills JSONB           -- 技能 ID 列表
description TEXT
requirements JSONB
company TEXT
location TEXT
source TEXT
```

---

## 🎯 用户使用流程

1. **选择行业**
   - 用户在主页选择目标行业（前端/后端/设计/...）

2. **上传简历**
   - 系统根据行业使用对应的分析模板

3. **获得分析结果**
   - 行业特定的技能评估
   - 行业特定的优化建议

4. **查看匹配岗位**
   - 显示该行业的匹配岗位
   - 按匹配度排序

5. **模拟面试**
   - 根据行业加载面试题库
   - 使用行业特定的评分标准

---

## 🔧 技术栈

- **数据库**: Supabase (PostgreSQL)
- **后端**: Next.js 16 API Routes
- **前端**: React 19 + TypeScript
- **爬虫**: Node.js + Puppeteer/Cheerio
- **AI**: DeepSeek API
- **定时任务**: node-cron

---

## 📝 待办事项

- [ ] 在 Supabase 执行 schema.sql
- [ ] 运行数据迁移脚本
- [ ] 测试 API 接口
- [ ] 修改 JobMatchPanel 支持行业选择
- [ ] 修改 InterviewPanel 支持行业题库
- [ ] 重构 AI 分析器
- [ ] 创建后端行业爬虫
- [ ] 创建设计行业爬虫
- [ ] 更新文档

---

## 💡 下一步行动

**立即执行**:
1. 登录 Supabase Dashboard
2. 执行 `database/schema.sql`
3. 运行 `npx ts-node database/migrate-data.ts`
4. 测试 `curl http://localhost:3000/api/industries`

完成后告诉我结果，我会继续帮你实现后续功能！🚀
