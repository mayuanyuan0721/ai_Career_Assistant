/**
 * Interview question crawler (enhanced)
 * - id: skill_category_seq (e.g. react_001)
 * - knowledge_points: what concepts the question tests
 * - score_rule: 60/80/95 scoring criteria
 * Sources: GitHub awesome lists + Juejin API + seed data
 */
import { config } from "../config/crawler.config";
import { InterviewQuestion, InterviewCategory, InterviewLevel, ScoreRule, CrawlStats } from "../types";
import { fetchWithRetry } from "../utils/http";
import { cleanText, hashContent, deduplicateByHash, withMeta } from "../utils/formatter";
import { readJsonFile, writeJsonFile } from "../utils/storage";
import { logger } from "../utils/logger";

// ── Category counters for sequential IDs ──────────────────────
const categoryCounters: Record<string, number> = {};
function nextId(category: string): string {
  categoryCounters[category] = (categoryCounters[category] || 0) + 1;
  return `${category}_${String(categoryCounters[category]).padStart(3, "0")}`;
}

// ── Score rules generator ─────────────────────────────────────
function buildScoreRule(knowledgePoints: string[]): ScoreRule[] {
  const pointCount = knowledgePoints.length;
  const basicPoints = knowledgePoints.slice(0, Math.ceil(pointCount / 3)).join("、");
  const goodPoints = knowledgePoints.slice(0, Math.ceil((pointCount * 2) / 3)).join("、");
  return [
    { level: "basic", score: 60, description: `能回答基本概念，提到：${basicPoints || "核心要点"}` },
    { level: "good", score: 80, description: `回答准确完整，涵盖：${goodPoints || "主要知识点"}，有实际案例` },
    { level: "excellent", score: 95, description: `回答深入，覆盖全部知识点，结合原理/源码分析，有实战经验` },
  ];
}

// ── Heuristic level detection ─────────────────────────────────
function guessLevel(question: string, answer: string): InterviewLevel {
  const combined = (question + answer).toLowerCase();
  const seniorKw = ["architecture", "principle", "optimize", "internals", "implement", "fiber", "reconcil", "compiler", "runtime", "源码", "原理", "架构", "底层"];
  const juniorKw = ["what is", "define", "basic", "syntax", "how to use", "example", "什么是", "如何使用", "基础"];
  if (seniorKw.some((k) => combined.includes(k))) return "senior";
  if (juniorKw.some((k) => combined.includes(k))) return "junior";
  return "middle";
}

// ── Extract knowledge points from answer text ─────────────────
function extractKnowledgePoints(question: string, answer: string, category: InterviewCategory): string[] {
  // Category-specific keyword banks
  const kpBank: Record<InterviewCategory, string[]> = {
    javascript: ["闭包", "原型链", "Event Loop", "Promise", "async/await", "作用域", "this绑定", "垃圾回收", "模块化", "类型转换"],
    react: ["虚拟DOM", "Fiber", "Hooks", "状态管理", "组件通信", "性能优化", "生命周期", "Context", "Reconciliation", "Server Components"],
    vue: ["响应式", "Proxy", "Composition API", "虚拟DOM", "Diff算法", "指令", "Pinia", "生命周期", "编译优化", "SSR"],
    css: ["BFC", "盒模型", "Flexbox", "Grid", "层叠上下文", "选择器优先级", "动画", "响应式", "CSS变量", "性能"],
    browser: ["Event Loop", "渲染流程", "重绘重排", "缓存策略", "同源策略", "CORS", "Service Worker", "Web Storage", "安全", "HTTP"],
    typescript: ["类型推断", "泛型", "条件类型", "类型守卫", "装饰器", "接口", "类型体操", "编译配置", "声明文件", "工具类型"],
    engineering: ["Webpack", "Vite", "Tree Shaking", "代码分割", "HMR", "CI/CD", "Monorepo", "ESLint", "单元测试", "微前端"],
    performance: ["Core Web Vitals", "LCP", "CLS", "FID", "懒加载", "预加载", "缓存", "代码分割", "虚拟列表", "Web Worker"],
  };

  const combined = (question + " " + answer).toLowerCase();
  const bank = kpBank[category] || [];
  const found = bank.filter((kp) => combined.includes(kp.toLowerCase()));

  // Minimum 2 knowledge points
  if (found.length < 2) {
    return bank.slice(0, 3);
  }
  return found.slice(0, 5);
}

// ── Parse Q&A from Markdown ───────────────────────────────────
function parseQAFromMarkdown(
  markdown: string,
  category: InterviewCategory
): Partial<InterviewQuestion>[] {
  const results: Partial<InterviewQuestion>[] = [];

  const patterns = [
    /#{2,4}\s*(?:\d+[.)]\s*)?(.+?\?)\s*\n+([\s\S]+?)(?=#{2,4}|\Z)/g,
    /\*\*Q:\*\*\s*(.+?)\n+\*\*A:\*\*\s*([\s\S]+?)(?=\*\*Q:\*\*|\Z)/g,
    /#{2,4}\s*(?:\d+[.)]\s*)?(.*?)\n+([\s\S]+?)(?=#{2,4}|\Z)/g,
  ];

  for (const pattern of patterns) {
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(markdown)) !== null) {
      const question = cleanText(match[1]);
      const answer = cleanText(match[2]);
      if (!question || !answer || question.length < 8 || answer.length < 20) continue;
      if (answer.startsWith("http") || answer.length < 30) continue;
      const kp = extractKnowledgePoints(question, answer, category);
      results.push({ category, question, answer, level: guessLevel(question, answer), knowledge_points: kp });
    }
    if (results.length >= 10) break;
  }

  return results;
}

// ── Fetch from GitHub raw Markdown ───────────────────────────
function inferCategory(url: string): InterviewCategory {
  for (const [key, cat] of Object.entries(config.interviewSourceMap)) {
    if (url.includes(key)) return cat as InterviewCategory;
  }
  return "javascript";
}

async function fetchGithubQA(url: string): Promise<Partial<InterviewQuestion>[]> {
  const category = inferCategory(url);
  logger.info(`[Interview/GitHub] ${category} <- ${url}`);
  try {
    const resp = await fetchWithRetry(url);
    const items = parseQAFromMarkdown(resp.data as string, category);
    logger.info(`[Interview/GitHub] parsed ${items.length} from ${url}`);
    return items;
  } catch (err) {
    logger.error(`[Interview/GitHub] failed ${url}: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

// ── Fetch from Juejin API ─────────────────────────────────────
async function fetchJuejinInterviews(
  tag: string,
  category: InterviewCategory
): Promise<Partial<InterviewQuestion>[]> {
  const results: Partial<InterviewQuestion>[] = [];
  const apiUrl = `https://api.juejin.cn/search_api/v1/search?query=${encodeURIComponent(tag)}&search_type=0&cursor=0&limit=10&version=1`;
  logger.info(`[Interview/Juejin] ${category} <- ${tag}`);

  try {
    const resp = await fetchWithRetry(apiUrl, {
      headers: { "Accept": "application/json", "Referer": "https://juejin.cn/" },
    });
    const data = resp.data as { data?: Array<{ article_info?: { title: string; brief_content: string } }> };
    for (const item of data?.data || []) {
      const info = item?.article_info;
      if (!info?.title || !info?.brief_content) continue;
      if (!/面试|interview|题目|考点/i.test(info.title)) continue;
      const kp = extractKnowledgePoints(info.title, info.brief_content, category);
      results.push({
        category,
        level: guessLevel(info.title, info.brief_content),
        question: info.title,
        answer: cleanText(info.brief_content).slice(0, 500),
        knowledge_points: kp,
      });
    }
    logger.info(`[Interview/Juejin] got ${results.length} for: ${tag}`);
  } catch (err) {
    logger.error(`[Interview/Juejin] failed ${tag}: ${err instanceof Error ? err.message : String(err)}`);
  }
  return results;
}

// ── Seed questions (enhanced with knowledge_points) ───────────
function getSeedQuestions(): Array<Omit<InterviewQuestion, "id" | "source" | "collected_at" | "hash" | "score_rule">> {
  return [
    { category: "javascript", level: "junior", skill: "JavaScript", question: "JavaScript 中 == 和 === 的区别是什么？", answer: "== 会进行类型转换再比较（如 '1'==1 为true）；=== 要求类型和值都相同（'1'===1 为false）。建议始终使用 === 避免隐式转换带来的问题。", knowledge_points: ["类型转换", "相等运算符", "隐式强制类型转换"] },
    { category: "javascript", level: "middle", skill: "JavaScript", question: "什么是闭包？有哪些常见应用场景？", answer: "闭包是指函数能访问其词法作用域外部变量的特性，即使外部函数已经返回。应用：模块化封装（私有变量）、柯里化、防抖节流、保存循环中的变量快照。", knowledge_points: ["闭包", "作用域", "词法环境", "内存泄漏"] },
    { category: "javascript", level: "senior", skill: "JavaScript", question: "请解释 JavaScript 事件循环（Event Loop）机制", answer: "JS是单线程的。同步代码在调用栈执行；遇到异步操作放入任务队列。调用栈清空后：先执行所有微任务（Promise.then/MutationObserver），再执行一个宏任务（setTimeout/setInterval），如此循环。", knowledge_points: ["Event Loop", "微任务", "宏任务", "调用栈", "任务队列"] },
    { category: "javascript", level: "middle", skill: "JavaScript", question: "var、let、const 的区别是什么？", answer: "var：函数作用域，存在变量提升，可重复声明。let：块级作用域，存在暂时性死区，不可重复声明。const：块级作用域，声明时必须初始化，不可重新赋值（但对象属性可修改）。", knowledge_points: ["作用域", "变量提升", "暂时性死区", "块级作用域"] },
    { category: "react", level: "junior", skill: "React", question: "React 中的 JSX 是什么？", answer: "JSX是JavaScript的语法扩展，允许在JS中编写类HTML代码。Babel将其转换为React.createElement()调用。优点：直观描述UI结构，支持{} 嵌入JS表达式，提升开发效率。", knowledge_points: ["JSX", "Babel转换", "React.createElement", "虚拟DOM"] },
    { category: "react", level: "middle", skill: "React", question: "为什么 React Hooks 不能在条件语句中调用？", answer: "React通过调用顺序来追踪每个Hook对应的state。每次渲染Hooks必须以相同顺序调用。在条件语句中使用会导致某次渲染跳过某个Hook，破坏React内部链表结构，导致状态错乱。", knowledge_points: ["Hooks规则", "调用顺序", "Fiber链表", "状态管理"] },
    { category: "react", level: "middle", skill: "React", question: "useMemo 和 useCallback 的区别是什么？", answer: "useMemo缓存计算结果：const value = useMemo(() => expensive(a,b), [a,b])。useCallback缓存函数引用：const fn = useCallback(() => doSomething(a), [a])。本质上useCallback(fn, deps) 等价于 useMemo(() => fn, deps)，前者针对函数，后者针对任意值。", knowledge_points: ["useMemo", "useCallback", "引用相等", "性能优化", "依赖数组"] },
    { category: "react", level: "senior", skill: "React", question: "React Fiber 架构解决了什么问题？", answer: "React 15的Stack Reconciler采用同步递归，大量DOM更新会阻塞主线程导致卡顿。Fiber将渲染工作拆分为可中断的小单元，支持暂停/恢复/优先级调度，使高优先级任务（如用户输入）能及时响应，实现了Concurrent Mode基础。", knowledge_points: ["Fiber架构", "时间切片", "任务调度", "Concurrent Mode", "优先级", "可中断渲染"] },
    { category: "vue", level: "junior", skill: "Vue", question: "v-if 和 v-show 的区别是什么？", answer: "v-if：条件为false时DOM节点被销毁，为true时重新创建，有更高的切换开销，适合不频繁切换的场景。v-show：始终渲染DOM，通过CSS display:none控制显隐，切换开销小，适合频繁切换的场景。", knowledge_points: ["v-if", "v-show", "DOM渲染", "条件渲染", "性能"] },
    { category: "vue", level: "middle", skill: "Vue", question: "Vue3 Composition API 相比 Options API 有哪些优势？", answer: "1. 更好的逻辑复用：通过composables封装，无mixin命名冲突。2. 更好的TypeScript支持：类型推导更完善。3. 代码组织：相关逻辑聚合，不被按选项分散。4. Tree-shaking更友好。5. 更灵活的代码组织方式。", knowledge_points: ["Composition API", "Options API", "composables", "逻辑复用", "TypeScript支持"] },
    { category: "css", level: "junior", skill: "CSS", question: "CSS 中 BFC 是什么？如何触发 BFC？", answer: "BFC（块级格式化上下文）是独立的布局环境，内部元素不影响外部。触发条件：float不为none、position为absolute/fixed、display为inline-block/flex/grid/table、overflow不为visible。用途：清除浮动、防止外边距折叠、自适应两栏布局。", knowledge_points: ["BFC", "格式化上下文", "清除浮动", "外边距折叠", "布局"] },
    { category: "browser", level: "middle", skill: "浏览器", question: "从输入URL到页面展示发生了什么？", answer: "1. DNS解析域名→IP。2. TCP三次握手建立连接。3. 发送HTTP请求。4. 服务器返回HTML。5. 浏览器解析HTML构建DOM树。6. 解析CSS构建CSSOM。7. 合并生成Render Tree。8. Layout计算几何信息。9. Paint绘制像素。10. Composite合成层最终展示。", knowledge_points: ["DNS解析", "TCP连接", "DOM构建", "CSSOM", "渲染流程", "Layout", "Paint", "Composite"] },
    { category: "typescript", level: "middle", skill: "TypeScript", question: "TypeScript 中 interface 和 type 的区别是什么？", answer: "interface：支持声明合并（同名自动合并）、只能描述对象类型、更语义化。type：支持联合/交叉/基础类型、不能重新打开扩展、更灵活。推荐：描述对象形状用interface，其他情况用type。", knowledge_points: ["interface", "type alias", "声明合并", "联合类型", "交叉类型"] },
    { category: "engineering", level: "middle", skill: "Webpack", question: "Webpack 和 Vite 的核心区别是什么？", answer: "Webpack：先打包再启动，构建依赖图后bundle所有模块，冷启动慢，生态成熟。Vite：基于原生ESM，按需编译，开发服务器启动极快；生产用Rollup打包；HMR精准高效。大型项目中Vite开发体验远优于Webpack。", knowledge_points: ["ESM", "Bundle", "HMR", "冷启动", "Tree Shaking", "构建优化"] },
    { category: "performance", level: "senior", skill: "性能优化", question: "如何优化前端首屏加载性能？", answer: "1. 代码分割+动态import懒加载路由。2. 资源压缩（gzip/brotli、图片WebP/AVIF）。3. 缓存策略（强缓存/协商缓存）。4. CDN加速静态资源。5. preload/prefetch预加载关键资源。6. SSR/SSG服务端渲染。7. HTTP/2多路复用减少请求。8. 骨架屏提升感知性能。", knowledge_points: ["Core Web Vitals", "LCP", "代码分割", "资源压缩", "缓存策略", "CDN", "SSR", "预加载"] },
  ];
}

// ── Normalize + enrich a raw question ────────────────────────
function normalizeQuestion(
  raw: Partial<InterviewQuestion>,
  source: string
): InterviewQuestion | null {
  if (!raw.question?.trim() || !raw.answer?.trim()) return null;

  const category = raw.category || "javascript";
  const kp = raw.knowledge_points?.length
    ? raw.knowledge_points
    : extractKnowledgePoints(raw.question, raw.answer, category as InterviewCategory);

  const q: InterviewQuestion = {
    id: nextId(category),
    skill: raw.skill || category.charAt(0).toUpperCase() + category.slice(1),
    category: category as InterviewCategory,
    level: raw.level || guessLevel(raw.question, raw.answer),
    question: cleanText(raw.question),
    answer: cleanText(raw.answer),
    knowledge_points: kp,
    score_rule: buildScoreRule(kp),
    source,
    collected_at: new Date().toISOString(),
  };
  q.hash = hashContent(`${q.question}${q.category}`);
  return q;
}

// ── Main entry ────────────────────────────────────────────────
export async function crawlInterview(): Promise<CrawlStats> {
  const stats: CrawlStats = { added: 0, skipped: 0, errors: 0 };
  logger.info("===== Start crawling Interview Questions (enhanced) =====");

  const existing = readJsonFile<InterviewQuestion>(config.output.interview);

  // Re-sync category counters from existing data
  for (const q of existing) {
    const cat = q.category || "javascript";
    const num = parseInt((q.id || "").split("_").pop() || "0", 10);
    if (num > (categoryCounters[cat] || 0)) categoryCounters[cat] = num;
  }

  const existingHashes = new Set(existing.map((q) => q.hash).filter(Boolean));
  const newQuestions: InterviewQuestion[] = [];

  function tryAdd(raw: Partial<InterviewQuestion>, source: string) {
    const q = normalizeQuestion(raw, source);
    if (!q) { stats.skipped++; return; }
    if (existingHashes.has(q.hash)) { stats.skipped++; return; }
    newQuestions.push(q);
    existingHashes.add(q.hash!);
  }

  // 1. GitHub
  for (const url of config.interviewSources) {
    const rawList = await fetchGithubQA(url);
    for (const raw of rawList) tryAdd(raw, url);
  }

  // 2. Juejin
  const juejinTags: Array<{ tag: string; category: InterviewCategory }> = [
    { tag: "前端面试", category: "javascript" },
    { tag: "React面试", category: "react" },
    { tag: "Vue面试", category: "vue" },
    { tag: "CSS面试", category: "css" },
  ];
  for (const { tag, category } of juejinTags) {
    const rawList = await fetchJuejinInterviews(tag, category);
    for (const raw of rawList) tryAdd(raw, `juejin/${tag}`);
  }

  // 3. Seed
  for (const raw of getSeedQuestions()) {
    tryAdd(raw as Partial<InterviewQuestion>, "seed");
  }

  const merged = deduplicateByHash([...existing, ...newQuestions]);
  writeJsonFile(config.output.interview, merged);
  stats.added = newQuestions.length;

  logger.info(`Interview done - added:${stats.added} skipped:${stats.skipped} errors:${stats.errors}`);
  return stats;
}
