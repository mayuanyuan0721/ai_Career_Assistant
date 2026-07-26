/**
 * Resume Examples Generator
 * Outputs career-data/resume/resume_examples.json
 * Provides reference resume cases for AI resume optimization
 */
import { config } from "../config/crawler.config";
import { ResumeExample, CrawlStats } from "../types";
import { writeJsonFile } from "../utils/storage";
import { logger } from "../utils/logger";

const RESUME_EXAMPLES: ResumeExample[] = [
  {
    id: "resume_react_senior_001",
    target_job: "高级React前端工程师",
    target_level: "senior",
    summary: "5年前端开发经验，主导过多个大型React项目，深入理解React Fiber架构，擅长性能优化和组件化设计，有微前端落地经验。",
    skills: ["React", "TypeScript", "Next.js", "Webpack", "微前端(qiankun)", "Node.js", "GraphQL", "Redis"],
    projects: [
      {
        name: "企业级中台系统（qiankun微前端架构）",
        description: "主导从单体SPA迁移至微前端架构，支持10+子应用独立部署",
        highlights: ["首屏加载时间从4.2s优化至1.8s，提升57%", "接入10个子应用，各团队独立发布，发布频率提升3倍", "使用qiankun实现沙箱隔离，消除全局变量污染问题"],
        tech_stack: ["React 18", "TypeScript", "qiankun", "Webpack 5 Module Federation"],
      },
      {
        name: "低代码可视化搭建平台",
        description: "从0到1搭建前端低代码平台，支持拖拽生成页面",
        highlights: ["平台支持50+组件，页面开发效率提升80%", "实现Schema驱动渲染引擎，支持动态数据绑定", "月活跃用户达500人，服务内部10个业务线"],
        tech_stack: ["React", "TypeScript", "Ant Design", "Mobx", "Canvas"],
      },
    ],
    source: "template",
    collected_at: new Date().toISOString(),
  },
  {
    id: "resume_react_middle_001",
    target_job: "React前端开发工程师",
    target_level: "middle",
    summary: "3年React开发经验，熟练掌握React全家桶，有电商和B端产品开发经验，注重代码质量和可维护性。",
    skills: ["React", "TypeScript", "Redux Toolkit", "React Query", "Vite", "Ant Design", "Jest", "CSS Modules"],
    projects: [
      {
        name: "B2B电商管理平台",
        description: "负责商品管理、订单中心、数据报表3个核心模块开发",
        highlights: ["封装30+通用组件，团队复用率达60%，减少重复开发50%", "引入React Query替代Redux处理服务端状态，代码量减少30%", "为大数据量表格实现虚拟滚动，渲染10万行数据流畅无卡顿"],
        tech_stack: ["React 18", "TypeScript", "React Query", "Ant Design 5", "Vite"],
      },
      {
        name: "移动端H5营销活动系统",
        description: "独立开发可配置的H5活动页系统",
        highlights: ["支持10种活动类型动态配置", "FCP优化至1.2s，Lighthouse评分90+", "活动页日均UV 5万+，转化率提升15%"],
        tech_stack: ["React", "Tailwind CSS", "Framer Motion", "Vite"],
      },
    ],
    source: "template",
    collected_at: new Date().toISOString(),
  },
  {
    id: "resume_vue_middle_001",
    target_job: "Vue3前端开发工程师",
    target_level: "middle",
    summary: "3年Vue开发经验，深入使用Vue3 Composition API，参与过完整的中台系统建设，有良好的工程化意识。",
    skills: ["Vue3", "TypeScript", "Vite", "Pinia", "Element Plus", "Vue Router", "ECharts", "Axios"],
    projects: [
      {
        name: "数字化运营管理平台",
        description: "负责运营看板、用户分析、活动管理等模块，全程参与需求分析到上线",
        highlights: ["基于ECharts封装10+可复用图表组件，支持主题切换", "实现动态权限路由，支持按钮级别权限控制", "优化首屏加载，路由懒加载+组件按需导入，包体积减少40%"],
        tech_stack: ["Vue3", "TypeScript", "Vite", "Pinia", "Element Plus", "ECharts"],
      },
      {
        name: "内部组件库 (@company/ui)",
        description: "主导开发符合公司设计规范的基础组件库",
        highlights: ["发布40+组件，覆盖3个业务线项目", "完善的TypeScript类型声明，IDE提示友好", "基于Vitest + Vue Test Utils实现80%+测试覆盖率"],
        tech_stack: ["Vue3", "TypeScript", "Vite", "Vitest", "Storybook"],
      },
    ],
    source: "template",
    collected_at: new Date().toISOString(),
  },
  {
    id: "resume_nextjs_middle_001",
    target_job: "Next.js全栈前端工程师",
    target_level: "middle",
    summary: "3年全栈开发经验，熟练使用Next.js App Router进行全栈开发，有独立交付SaaS产品的经验。",
    skills: ["Next.js", "React", "TypeScript", "Prisma", "PostgreSQL", "Tailwind CSS", "NextAuth", "Stripe"],
    projects: [
      {
        name: "AI内容创作SaaS平台",
        description: "独立开发从0到1的AI写作助手SaaS，接入OpenAI API",
        highlights: ["实现流式响应UI，用户等待感知时间减少70%", "集成Stripe支付，实现订阅制计费，月收入$2000+", "DAU 300+，付费用户转化率8%"],
        tech_stack: ["Next.js 14 App Router", "TypeScript", "Prisma", "PostgreSQL", "OpenAI API", "Stripe"],
      },
      {
        name: "团队协作项目管理工具",
        description: "类Notion的团队文档协作工具",
        highlights: ["基于Tiptap实现富文本编辑器，支持@提及、/命令", "实现实时协作（WebSocket + Yjs CRDT）", "GitHub Actions自动化部署至Vercel，零停机发布"],
        tech_stack: ["Next.js", "Tiptap", "Yjs", "WebSocket", "Tailwind CSS", "NextAuth"],
      },
    ],
    source: "template",
    collected_at: new Date().toISOString(),
  },
  {
    id: "resume_frontend_junior_001",
    target_job: "初级前端开发工程师",
    target_level: "junior",
    summary: "1年前端开发经验（含实习），掌握Vue3和React基础，有完整项目从开发到上线的经历，学习能力强。",
    skills: ["HTML5", "CSS3", "JavaScript (ES6+)", "Vue3", "React", "Vite", "Git", "Axios"],
    projects: [
      {
        name: "校园二手商品交易平台（毕业设计）",
        description: "独立完成前端开发，实现商品发布、搜索、聊天等核心功能",
        highlights: ["实现商品图片懒加载，首屏加载速度提升40%", "封装通用请求库，统一处理loading/错误/Token刷新", "上线3个月，注册用户500+"],
        tech_stack: ["Vue3", "Vite", "Pinia", "Vant4", "Socket.io"],
      },
      {
        name: "实习：电商促销活动页开发",
        description: "在XX公司实习期间，独立完成3个大促活动H5页面",
        highlights: ["活动页面在微信传播，单日UV峰值10万+", "与设计还原度98%，获得设计团队好评", "配合后端接口联调，3天内完成交付"],
        tech_stack: ["Vue3", "CSS动画", "微信JSSDK", "Axios"],
      },
    ],
    source: "template",
    collected_at: new Date().toISOString(),
  },
  {
    id: "resume_architecture_senior_001",
    target_job: "前端架构师",
    target_level: "senior",
    summary: "7年前端经验，主导过3个大型项目的前端架构设计，深度参与工程化体系建设，有前端团队管理经验（8人）。",
    skills: ["React", "Vue3", "TypeScript", "微前端", "Node.js", "Webpack 5", "Vite", "Docker", "CI/CD", "监控体系"],
    projects: [
      {
        name: "集团级前端基础设施建设",
        description: "主导搭建覆盖20+项目的前端工程化体系",
        highlights: ["设计Monorepo方案（pnpm workspace），工具链复用提升60%", "建立前端监控平台（性能/错误/用户行为），故障发现时间从小时级降至分钟级", "制定前端技术规范文档，CodeReview通过率提升至95%"],
        tech_stack: ["pnpm Monorepo", "Turborepo", "自研CLI", "Sentry", "自研性能SDK"],
      },
      {
        name: "微前端平台重构（single-spa → qiankun）",
        description: "主导遗留巨石应用迁移至微前端架构",
        highlights: ["支持15个子应用独立开发部署，迭代速度提升2倍", "实现跨应用状态共享和通信机制，保证数据一致性", "迁移过程零线上故障，用灰度策略平滑过渡"],
        tech_stack: ["qiankun", "React", "Vue3", "Webpack Module Federation"],
      },
    ],
    source: "template",
    collected_at: new Date().toISOString(),
  },
  {
    id: "resume_ai_frontend_middle_001",
    target_job: "AI前端工程师",
    target_level: "middle",
    summary: "3年前端 + 1年AI产品开发经验，参与过2个AI应用从0到1的建设，熟悉LLM接入和流式渲染。",
    skills: ["React", "TypeScript", "Next.js", "OpenAI API", "LangChain.js", "Tailwind CSS", "WebSocket", "SSE"],
    projects: [
      {
        name: "企业内部AI助手平台",
        description: "负责AI对话、文档问答、代码生成3个核心功能的前端开发",
        highlights: ["实现基于SSE的流式响应渲染，用户体验接近ChatGPT", "封装统一的AI对话组件库，支持多模型切换（GPT/Claude/通义）", "对话上下文压缩策略，Token消耗降低35%"],
        tech_stack: ["Next.js", "TypeScript", "OpenAI SDK", "Vercel AI SDK", "Tailwind CSS"],
      },
      {
        name: "RAG知识库问答系统前端",
        description: "为企业知识库搭建AI问答入口，支持文档上传和语义检索",
        highlights: ["实现PDF/Word/Markdown多格式文档上传与预览", "引导式问答界面，降低用户使用门槛，满意度评分4.6/5", "集成Milvus向量检索结果可视化展示"],
        tech_stack: ["React", "TypeScript", "文件处理SDK", "ECharts", "WebSocket"],
      },
    ],
    source: "template",
    collected_at: new Date().toISOString(),
  },
];

export async function crawlResumeExamples(): Promise<CrawlStats> {
  const stats: CrawlStats = { added: 0, skipped: 0, errors: 0 };
  logger.info("===== Generating Resume Examples =====");

  writeJsonFile(config.output.resumeExamples, RESUME_EXAMPLES);
  stats.added = RESUME_EXAMPLES.length;

  logger.info(`Resume examples done - added:${stats.added} items`);
  return stats;
}
