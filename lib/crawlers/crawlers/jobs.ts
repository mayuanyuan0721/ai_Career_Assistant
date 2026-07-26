/**
 * Job JD crawler - restructured with:
 *   - Sequential id (job_001...)
 *   - level_name + experience_year
 *   - Weighted skills (name / level / weight)
 *   - responsibilities[] + requirements[]
 */
import { config } from "../config/crawler.config";
import { Job, JobLevel, SkillWeight, CrawlStats } from "../types";
import { hashContent, deduplicateByHash, withMeta } from "../utils/formatter";
import { readJsonFile, writeJsonFile } from "../utils/storage";
import { logger } from "../utils/logger";

// ── Level meta lookup ─────────────────────────────────────────
const LEVEL_META: Record<JobLevel, { level_name: string; experience_year: string }> = {
  junior: { level_name: "初级工程师", experience_year: "1-3" },
  middle: { level_name: "中级工程师", experience_year: "3-5" },
  senior: { level_name: "高级工程师", experience_year: "5+" },
};

// ── Skill weight rules ────────────────────────────────────────
// 核心技能（与岗位名称匹配）weight=10，次核心=8，工具链=6，加分项=4
function buildSkillWeights(
  rawSkills: string[],
  jobTitle: string,
  level: JobLevel
): SkillWeight[] {
  const title = jobTitle.toLowerCase();

  // Map skill name → proficiency required based on level
  const profMap: Record<JobLevel, "basic" | "middle" | "advanced"> = {
    junior: "basic",
    middle: "middle",
    senior: "advanced",
  };
  const baseProficiency = profMap[level];

  const coreKeywords = ["react", "vue", "next", "typescript", "angular", "svelte"];
  const toolKeywords = ["webpack", "vite", "rollup", "babel", "eslint", "jest", "vitest"];
  const infraKeywords = ["node", "docker", "ci", "git", "linux", "nginx"];

  return rawSkills.map((name) => {
    const lower = name.toLowerCase();
    let weight = 4;
    let skillLevel: "basic" | "middle" | "advanced" = "basic";

    // Core framework matching title → highest weight
    if (coreKeywords.some((k) => title.includes(k) && lower.includes(k))) {
      weight = 10;
      skillLevel = baseProficiency;
    } else if (coreKeywords.some((k) => lower.includes(k))) {
      weight = level === "senior" ? 9 : 8;
      skillLevel = baseProficiency;
    } else if (lower === "typescript" || lower === "javascript") {
      weight = level === "junior" ? 7 : 9;
      skillLevel = baseProficiency;
    } else if (toolKeywords.some((k) => lower.includes(k))) {
      weight = level === "junior" ? 5 : 6;
      skillLevel = level === "junior" ? "basic" : "middle";
    } else if (infraKeywords.some((k) => lower.includes(k))) {
      weight = 4;
      skillLevel = "basic";
    } else {
      weight = 5;
      skillLevel = "basic";
    }

    return { name, level: skillLevel, weight };
  });
}

// ── Job templates ─────────────────────────────────────────────
interface JobTemplate {
  titlePattern: string;
  skills: string[];
  salary: Record<JobLevel, string>;
  responsibilities: Record<JobLevel, string[]>;
  requirements: Record<JobLevel, string[]>;
}

const JOB_TEMPLATES: JobTemplate[] = [
  {
    titlePattern: "React前端开发工程师",
    skills: ["React", "TypeScript", "Webpack", "Node.js", "Git", "CSS3", "REST API"],
    salary: { junior: "10-15k", middle: "15-25k", senior: "25-45k" },
    responsibilities: {
      junior: ["参与React组件开发", "完成UI界面还原", "修复前端Bug", "编写单元测试"],
      middle: ["负责核心业务模块开发", "设计可复用组件体系", "优化页面渲染性能", "参与技术方案评审"],
      senior: ["主导前端架构设计", "制定编码规范与工程化方案", "解决复杂性能瓶颈", "指导初中级工程师"],
    },
    requirements: {
      junior: ["熟悉React基础，掌握Hooks用法", "了解ES6+语法", "掌握HTML/CSS基础", "有Git使用经验"],
      middle: ["熟练掌握React全家桶", "有TypeScript实战经验", "熟悉Webpack配置优化", "了解前端性能优化方案"],
      senior: ["深入理解React Fiber架构", "有大型项目前端架构经验", "熟悉微前端方案", "掌握前端监控与性能体系"],
    },
  },
  {
    titlePattern: "Vue前端开发工程师",
    skills: ["Vue3", "TypeScript", "Vite", "Pinia", "Element Plus", "CSS3", "Git"],
    salary: { junior: "9-14k", middle: "14-22k", senior: "22-40k" },
    responsibilities: {
      junior: ["参与Vue页面开发", "配合设计师还原页面", "维护现有功能", "编写基础文档"],
      middle: ["独立负责中台系统模块", "封装公共组件库", "参与接口联调", "推进前端工程化改进"],
      senior: ["主导Vue3项目架构升级", "设计状态管理方案", "性能优化与监控体系建设", "团队技术分享"],
    },
    requirements: {
      junior: ["掌握Vue2/3基础语法", "了解Composition API", "了解HTTP基础", "有实习项目经验"],
      middle: ["熟练使用Vue3 Composition API", "熟悉Pinia状态管理", "有Vite构建配置经验", "了解SSR基础"],
      senior: ["深入理解Vue3响应式原理", "有Vue3 SSR/SSG项目经验", "熟悉Nuxt3", "具备前端架构能力"],
    },
  },
  {
    titlePattern: "Next.js全栈前端工程师",
    skills: ["Next.js", "React", "TypeScript", "Prisma", "PostgreSQL", "Tailwind CSS", "Vercel"],
    salary: { junior: "12-18k", middle: "18-30k", senior: "28-50k" },
    responsibilities: {
      junior: ["参与Next.js页面开发", "实现API Routes基础功能", "维护数据库模型", "完成UI组件开发"],
      middle: ["负责全栈功能模块开发", "设计数据库Schema", "实现Server Components", "性能调优"],
      senior: ["主导全栈架构设计", "设计多租户系统方案", "负责系统安全性建设", "技术选型决策"],
    },
    requirements: {
      junior: ["了解React基础", "了解Node.js", "有SQL基础", "了解RESTful API"],
      middle: ["熟练使用Next.js App Router", "有Prisma/Drizzle经验", "了解认证方案（NextAuth等）", "熟悉Tailwind CSS"],
      senior: ["深入掌握Next.js架构", "有高并发系统设计经验", "熟悉AWS/Vercel部署", "掌握前端安全方案"],
    },
  },
  {
    titlePattern: "前端架构师",
    skills: ["React", "Vue", "TypeScript", "Webpack", "微前端", "Node.js", "Docker", "CI/CD"],
    salary: { junior: "15-20k", middle: "25-40k", senior: "40-70k" },
    responsibilities: {
      junior: ["协助维护脚手架工具", "编写工程化文档", "参与代码Review", "调研新技术方案"],
      middle: ["主导内部组件库建设", "推进前端工程化", "优化CI/CD流程", "技术评审"],
      senior: ["主导前端技术体系建设", "设计微前端架构", "制定团队技术规范", "跨团队技术协作"],
    },
    requirements: {
      junior: ["了解Webpack/Vite构建原理", "有CLI工具开发经验", "熟悉Node.js", "了解Docker基础"],
      middle: ["有前端工程化落地经验", "熟悉Monorepo方案", "有组件库开发经验", "了解微前端原理"],
      senior: ["深入掌握微前端架构", "有百人以上团队前端架构经验", "熟悉云原生部署", "具备技术管理能力"],
    },
  },
  {
    titlePattern: "AI前端工程师",
    skills: ["React", "TypeScript", "LangChain.js", "WebSocket", "Canvas", "Next.js", "OpenAI API"],
    salary: { junior: "15-22k", middle: "22-35k", senior: "35-60k" },
    responsibilities: {
      junior: ["实现AI对话UI组件", "接入大模型API", "处理流式响应渲染", "编写接口文档"],
      middle: ["设计AI产品交互体验", "实现RAG前端工作流", "优化流式渲染性能", "参与产品方案设计"],
      senior: ["主导AI产品前端架构", "设计多模态交互体系", "构建前端AI推理能力", "跨团队AI落地推进"],
    },
    requirements: {
      junior: ["掌握React基础", "了解OpenAI/Claude API", "了解流式响应原理", "有SSE/WebSocket经验"],
      middle: ["有AI产品前端开发经验", "熟悉LangChain或类似框架", "有向量数据库使用经验", "了解Prompt工程"],
      senior: ["有AI应用架构经验", "深入理解LLM工作原理", "有端侧AI推理（ONNX/WebGPU）经验", "具备AI产品设计能力"],
    },
  },
  {
    titlePattern: "TypeScript前端开发工程师",
    skills: ["TypeScript", "React", "GraphQL", "Apollo Client", "Jest", "Storybook", "Git"],
    salary: { junior: "11-16k", middle: "16-26k", senior: "26-45k" },
    responsibilities: {
      junior: ["在TypeScript项目中开发功能", "编写类型定义文件", "维护GraphQL Query", "参与Code Review"],
      middle: ["设计复杂类型体系", "封装GraphQL操作层", "建立组件文档体系", "优化TS编译性能"],
      senior: ["主导类型系统架构设计", "开发内部TypeScript工具库", "建立端到端类型安全方案", "技术分享与培训"],
    },
    requirements: {
      junior: ["掌握TypeScript基础类型", "了解泛型概念", "有React + TS项目经验", "了解GraphQL基础"],
      middle: ["熟练使用TS高级类型（映射/条件类型）", "有GraphQL+Apollo项目经验", "熟悉Storybook", "了解类型体操"],
      senior: ["深入掌握TS编译器机制", "有大型TS项目架构经验", "能开发TS插件/转换器", "具备类型系统设计能力"],
    },
  },
  {
    titlePattern: "移动端H5前端工程师",
    skills: ["Vue3", "React", "Vant", "uni-app", "WeChat Mini Program", "CSS动画", "TypeScript"],
    salary: { junior: "9-13k", middle: "13-20k", senior: "20-35k" },
    responsibilities: {
      junior: ["开发移动端H5页面", "实现CSS动画效果", "适配多端屏幕", "接入第三方SDK"],
      middle: ["主导H5活动页开发", "优化移动端性能", "开发微信小程序", "封装Hybrid通信层"],
      senior: ["设计多端统一开发方案", "建立移动端性能监控", "主导小程序架构", "跨端框架选型"],
    },
    requirements: {
      junior: ["掌握移动端CSS适配", "了解Vant/Mint UI", "了解微信JSSDK", "有H5页面开发经验"],
      middle: ["熟练开发微信小程序/uni-app", "有Hybrid App开发经验", "了解移动端性能优化", "熟悉Webview通信"],
      senior: ["有多端统一框架经验", "深入了解小程序架构", "有大型小程序重构经验", "熟悉Flutter/RN基础"],
    },
  },
  {
    titlePattern: "数据可视化前端工程师",
    skills: ["React", "ECharts", "D3.js", "Canvas", "WebGL", "TypeScript", "WebSocket"],
    salary: { junior: "12-18k", middle: "18-28k", senior: "28-50k" },
    responsibilities: {
      junior: ["开发ECharts图表组件", "实现数据看板页面", "处理实时数据渲染", "维护可视化组件库"],
      middle: ["设计复杂数据可视化方案", "优化大数据渲染性能", "开发自定义图表组件", "建立可视化设计规范"],
      senior: ["主导可视化平台架构", "设计GIS/3D可视化方案", "优化WebGL渲染性能", "技术选型与团队培训"],
    },
    requirements: {
      junior: ["掌握ECharts基础配置", "了解Canvas/SVG基础", "有数据图表开发经验", "了解WebSocket"],
      middle: ["熟练使用D3.js/ECharts", "有Canvas性能优化经验", "了解WebGL基础", "有大屏项目经验"],
      senior: ["深入掌握WebGL/Three.js", "有GIS可视化经验（Mapbox等）", "能开发自定义渲染引擎", "有大规模数据优化经验"],
    },
  },
];

// ── Generate jobs ──────────────────────────────────────────────
function generateJobs(): Job[] {
  const levels: JobLevel[] = ["junior", "middle", "senior"];
  const levelCount = { junior: 0, middle: 0, senior: 0 };
  const targetCount = config.targets.jobs;
  const jobs: Job[] = [];
  let globalIndex = 1;

  const levelOrder: JobLevel[] = [
    ...Array(targetCount.junior).fill("junior"),
    ...Array(targetCount.middle).fill("middle"),
    ...Array(targetCount.senior).fill("senior"),
  ];

  for (const level of levelOrder) {
    levelCount[level]++;
    const tplIndex = (globalIndex - 1) % JOB_TEMPLATES.length;
    const tpl = JOB_TEMPLATES[tplIndex];
    const meta = LEVEL_META[level];
    const id = `job_${String(globalIndex).padStart(3, "0")}`;

    const title = `${level === "senior" ? "高级" : level === "middle" ? "" : "初级"}${tpl.titlePattern}`.replace("前端前端", "前端");

    const skillWeights = buildSkillWeights(tpl.skills, title, level);

    const job: Job = {
      id,
      title: title.trim(),
      category: "frontend",
      level,
      level_name: meta.level_name,
      experience_year: meta.experience_year,
      salary: tpl.salary[level],
      skills: skillWeights,
      responsibilities: tpl.responsibilities[level],
      requirements: tpl.requirements[level],
      description: `${meta.level_name}${tpl.titlePattern}，${tpl.requirements[level][0]}，薪资${tpl.salary[level]}。`,
      source: "template",
      collected_at: new Date().toISOString(),
    };
    job.hash = hashContent(`${job.title}${job.level}${job.description}`);
    jobs.push(job);
    globalIndex++;
  }

  return jobs;
}

// ── Main entry ────────────────────────────────────────────────
export async function crawlJobs(): Promise<CrawlStats> {
  const stats: CrawlStats = { added: 0, skipped: 0, errors: 0 };
  logger.info("===== Start crawling Jobs (structured) =====");

  const existing = readJsonFile<Job>(config.output.jobs);
  const existingHashes = new Set(existing.map((j) => j.hash).filter(Boolean));

  const allJobs = generateJobs();
  const newJobs: Job[] = [];

  for (const job of allJobs) {
    if (existingHashes.has(job.hash)) { stats.skipped++; continue; }
    newJobs.push(job);
  }

  const merged = deduplicateByHash([...existing, ...newJobs]);
  writeJsonFile(config.output.jobs, merged);
  stats.added = newJobs.length;

  logger.info(`Jobs done - added:${stats.added} skipped:${stats.skipped} errors:${stats.errors}`);
  return stats;
}
