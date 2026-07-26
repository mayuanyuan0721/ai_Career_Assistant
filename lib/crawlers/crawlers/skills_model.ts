/**
 * Skills Model Generator
 * Outputs career-data/skills/skills_model.json
 * Contains: ability levels + prerequisite graph + next_skill paths
 */
import { config } from "../config/crawler.config";
import { SkillModel, CrawlStats } from "../types";
import { writeJsonFile } from "../utils/storage";
import { logger } from "../utils/logger";

const SKILL_MODELS: SkillModel[] = [
  {
    id: "skill_html",
    name: "HTML",
    category: "base",
    level: [
      { name: "junior", ability: ["语义化标签", "表单元素", "链接与图片", "基础布局", "meta标签"] },
      { name: "middle", ability: ["HTML5 API（Canvas/Video/Audio）", "Web Components基础", "可访问性(a11y)", "SEO优化"] },
      { name: "senior", ability: ["自定义元素", "Shadow DOM", "HTML解析原理", "浏览器渲染流程中的HTML处理"] },
    ],
    relation: { prerequisite: [], next_skill: ["CSS", "JavaScript"] },
    source: "builtin",
    collected_at: new Date().toISOString(),
  },
  {
    id: "skill_css",
    name: "CSS",
    category: "base",
    level: [
      { name: "junior", ability: ["选择器与优先级", "盒模型", "Flexbox布局", "Grid布局", "响应式设计"] },
      { name: "middle", ability: ["BFC/IFC", "CSS动画与过渡", "CSS变量", "Sass/Less预处理器", "移动端适配方案"] },
      { name: "senior", ability: ["CSS Houdini", "stacking context", "CSS性能优化", "设计系统与Token体系"] },
    ],
    relation: { prerequisite: ["HTML"], next_skill: ["JavaScript", "Tailwind CSS", "CSS-in-JS"] },
    source: "builtin",
    collected_at: new Date().toISOString(),
  },
  {
    id: "skill_javascript",
    name: "JavaScript",
    category: "language",
    level: [
      { name: "junior", ability: ["变量与数据类型", "函数与作用域", "DOM操作", "事件处理", "ES6基础语法", "数组/对象方法"] },
      { name: "middle", ability: ["闭包与原型链", "异步编程(Promise/async-await)", "模块化(ESM/CJS)", "Event Loop", "正则表达式", "错误处理"] },
      { name: "senior", ability: ["V8引擎工作原理", "内存管理与垃圾回收", "设计模式", "函数式编程", "AST与代码转换", "Worker线程"] },
    ],
    relation: { prerequisite: ["HTML", "CSS"], next_skill: ["TypeScript", "React", "Vue", "Node.js"] },
    source: "builtin",
    collected_at: new Date().toISOString(),
  },
  {
    id: "skill_typescript",
    name: "TypeScript",
    category: "language",
    level: [
      { name: "junior", ability: ["基础类型注解", "接口(interface)", "类型别名(type)", "枚举", "泛型基础", "可选链"] },
      { name: "middle", ability: ["条件类型", "映射类型", "模板字面量类型", "工具类型(Partial/Pick等)", "类型守卫", "装饰器"] },
      { name: "senior", ability: ["类型体操", "TS编译器配置优化", "自定义类型工具库", "TS插件开发", "Declaration merging", "Infer高级用法"] },
    ],
    relation: { prerequisite: ["JavaScript"], next_skill: ["React", "Vue", "Node.js", "Prisma"] },
    source: "builtin",
    collected_at: new Date().toISOString(),
  },
  {
    id: "skill_react",
    name: "React",
    category: "frontend_framework",
    level: [
      { name: "junior", ability: ["JSX语法", "函数组件", "useState/useEffect", "Props传递", "条件渲染", "列表渲染", "表单处理"] },
      { name: "middle", ability: ["自定义Hooks", "useContext/useReducer", "useMemo/useCallback", "React.memo", "错误边界", "Portal", "性能优化"] },
      { name: "senior", ability: ["Fiber架构原理", "Concurrent Mode", "React Server Components", "Reconciliation算法", "自定义Renderer", "React架构设计"] },
    ],
    relation: { prerequisite: ["JavaScript", "HTML", "CSS"], next_skill: ["Next.js", "Redux", "React Query", "React Native"] },
    source: "builtin",
    collected_at: new Date().toISOString(),
  },
  {
    id: "skill_vue",
    name: "Vue",
    category: "frontend_framework",
    level: [
      { name: "junior", ability: ["模板语法", "v-if/v-for指令", "computed/watch", "组件Props/Emit", "生命周期", "Vue Router基础"] },
      { name: "middle", ability: ["Composition API", "Pinia状态管理", "自定义指令", "Provide/Inject", "Teleport", "异步组件", "Vite配置"] },
      { name: "senior", ability: ["Vue3响应式系统原理(Proxy)", "编译器优化原理", "自定义渲染器", "Vue3 SSR/SSG", "插件开发", "性能优化体系"] },
    ],
    relation: { prerequisite: ["JavaScript", "HTML", "CSS"], next_skill: ["Nuxt.js", "Pinia", "Vue Router", "Vite"] },
    source: "builtin",
    collected_at: new Date().toISOString(),
  },
  {
    id: "skill_nextjs",
    name: "Next.js",
    category: "fullstack_framework",
    level: [
      { name: "junior", ability: ["文件路由", "页面组件", "Link组件", "getStaticProps基础", "图片优化(Image组件)"] },
      { name: "middle", ability: ["App Router", "Server Components", "Client Components", "Server Actions", "Route Handlers", "Middleware", "ISR/SSG/SSR"] },
      { name: "senior", ability: ["Next.js性能优化体系", "多租户架构", "Edge Runtime", "自定义构建配置", "大型Next.js项目架构", "部署优化"] },
    ],
    relation: { prerequisite: ["React", "TypeScript", "Node.js"], next_skill: ["Prisma", "NextAuth", "Vercel", "tRPC"] },
    source: "builtin",
    collected_at: new Date().toISOString(),
  },
  {
    id: "skill_nodejs",
    name: "Node.js",
    category: "backend",
    level: [
      { name: "junior", ability: ["模块系统", "fs/path/http模块", "npm包管理", "Express基础路由", "环境变量"] },
      { name: "middle", ability: ["异步I/O原理", "Stream流", "Buffer", "Child Process", "Express中间件", "JWT认证", "数据库连接"] },
      { name: "senior", ability: ["Cluster集群", "Worker Threads", "Node.js性能分析", "内存泄漏排查", "高并发服务设计", "微服务架构"] },
    ],
    relation: { prerequisite: ["JavaScript"], next_skill: ["Express", "Nest.js", "Prisma", "Docker"] },
    source: "builtin",
    collected_at: new Date().toISOString(),
  },
  {
    id: "skill_webpack",
    name: "Webpack",
    category: "engineering",
    level: [
      { name: "junior", ability: ["entry/output配置", "Loader基础使用", "Plugin基础", "devServer", "source map"] },
      { name: "middle", ability: ["代码分割(Code Splitting)", "Tree Shaking", "DllPlugin", "优化构建速度", "自定义Loader"] },
      { name: "senior", ability: ["Webpack内部原理", "Tapable事件系统", "自定义Plugin开发", "Module Federation", "构建性能深度优化"] },
    ],
    relation: { prerequisite: ["JavaScript", "Node.js"], next_skill: ["Vite", "Rollup", "Module Federation"] },
    source: "builtin",
    collected_at: new Date().toISOString(),
  },
  {
    id: "skill_vite",
    name: "Vite",
    category: "engineering",
    level: [
      { name: "junior", ability: ["Vite项目初始化", "基础配置", "环境变量", "静态资源处理", "HMR原理"] },
      { name: "middle", ability: ["插件开发基础", "构建优化配置", "SSR配置", "Library模式", "CSS预处理集成"] },
      { name: "senior", ability: ["Vite插件系统深入", "Rollup插件互通", "自定义Vite插件", "Vite源码原理", "大型项目Vite优化"] },
    ],
    relation: { prerequisite: ["JavaScript", "Node.js"], next_skill: ["Rollup", "Vitest", "Vue", "React"] },
    source: "builtin",
    collected_at: new Date().toISOString(),
  },
  {
    id: "skill_git",
    name: "Git",
    category: "tool",
    level: [
      { name: "junior", ability: ["clone/add/commit/push/pull", "分支创建与切换", "merge基础", "解决简单冲突", "GitHub使用"] },
      { name: "middle", ability: ["rebase变基", "cherry-pick", "stash", "reset/revert", "Git Flow工作流", "Tag管理"] },
      { name: "senior", ability: ["Git Hooks", "子模块(submodule)", "bisect调试", "reflog恢复", "大仓Monorepo管理", "自定义Git工作流"] },
    ],
    relation: { prerequisite: [], next_skill: ["CI/CD", "GitHub Actions", "Monorepo"] },
    source: "builtin",
    collected_at: new Date().toISOString(),
  },
  {
    id: "skill_performance",
    name: "前端性能优化",
    category: "advanced",
    level: [
      { name: "junior", ability: ["图片懒加载", "代码分割基础", "CDN使用", "HTTP缓存了解", "Chrome DevTools基础"] },
      { name: "middle", ability: ["Core Web Vitals优化", "资源预加载(preload/prefetch)", "虚拟列表", "防抖节流", "Bundle分析"] },
      { name: "senior", ability: ["Web Performance API", "性能监控体系建设", "GPU动画优化", "服务端渲染性能", "A/B测试体系"] },
    ],
    relation: { prerequisite: ["JavaScript", "HTML", "CSS"], next_skill: ["Web Vitals", "监控系统", "SSR"] },
    source: "builtin",
    collected_at: new Date().toISOString(),
  },
];

export async function crawlSkillsModel(): Promise<CrawlStats> {
  const stats: CrawlStats = { added: 0, skipped: 0, errors: 0 };
  logger.info("===== Generating Skills Model =====");

  writeJsonFile(config.output.skillsModel, SKILL_MODELS);
  stats.added = SKILL_MODELS.length;

  logger.info(`Skills model done - added:${stats.added} items`);
  return stats;
}
