import path from "path";

const DATA_DIR = path.join(process.cwd(), "data", "career-data");

export const config = {
  // 请求配置
  request: {
    timeout: 30000,
    maxRetries: 3,
    retryBaseDelay: 2000, // 每次重试间隔递增基数(ms)
    minDelay: 1000,       // 最小随机延迟
    maxDelay: 3000,       // 最大随机延迟
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
  },

  // 输出路径
  output: {
    jobs: path.join(DATA_DIR, "jobs", "frontend_jobs.json"),
    skills: path.join(DATA_DIR, "skills"),
    skillsModel: path.join(DATA_DIR, "skills", "skills_model.json"),
    interview: path.join(DATA_DIR, "interview", "questions.json"),
    projects: path.join(DATA_DIR, "projects", "projects.json"),
    articles: path.join(DATA_DIR, "articles", "frontend_articles.json"),
    resumeExamples: path.join(DATA_DIR, "resume", "resume_examples.json"),
    logs: path.join(DATA_DIR, "logs"),
  },

  // 采集数量目标
  targets: {
    jobs: { junior: 100, middle: 150, senior: 50 },
    skills: { javascript: 10, react: 10, vue: 10, typescript: 5, engineering: 10, browser: 5 },
    interview: { javascript: 100, react: 100, vue: 50, css: 50, browser: 50, typescript: 50, engineering: 50, performance: 50 },
    projects: { react: 30, vue: 20, nextjs: 20, ai: 20, engineering: 10 },
    articles: 100,
  },

  // 岗位采集关键词
  jobKeywords: [
    "React开发工程师",
    "Vue开发工程师",
    "前端开发工程师",
    "Web前端工程师",
    "Next.js开发工程师",
    "TypeScript开发工程师",
    "前端架构师",
    "AI前端工程师",
  ],

  // GitHub项目搜索关键词
  githubKeywords: {
    react: ["react admin dashboard", "react typescript boilerplate", "react enterprise"],
    vue: ["vue3 admin", "vue3 typescript project"],
    nextjs: ["nextjs full stack", "nextjs app router"],
    ai: ["ai chatbot react", "llm frontend"],
    engineering: ["frontend monorepo", "vite plugin"],
  },

  // GitHub API Token（填写后可提升请求限额）
  githubToken: process.env.GITHUB_TOKEN || "",

  // 定时任务（cron表达式，默认每天凌晨2点）
  schedule: process.env.CRON_SCHEDULE || "0 2 * * *",

  // 技能文档来源
  skillSources: {
    javascript: [
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions",
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures",
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Promises",
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/async_function",
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain",
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules",
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array",
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management",
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop",
    ],
    react: [
      "https://react.dev/learn",
      "https://react.dev/learn/describing-the-ui",
      "https://react.dev/learn/adding-interactivity",
      "https://react.dev/learn/managing-state",
      "https://react.dev/learn/escape-hatches",
      "https://react.dev/reference/react/hooks",
      "https://react.dev/learn/thinking-in-react",
      "https://react.dev/reference/react/memo",
      "https://react.dev/learn/reusing-logic-with-custom-hooks",
      "https://react.dev/learn/scaling-up-with-reducer-and-context",
    ],
    vue: [
      "https://vuejs.org/guide/introduction",
      "https://vuejs.org/guide/essentials/template-syntax",
      "https://vuejs.org/guide/essentials/reactivity-fundamentals",
      "https://vuejs.org/guide/essentials/computed",
      "https://vuejs.org/guide/essentials/lifecycle",
      "https://vuejs.org/guide/essentials/watchers",
      "https://vuejs.org/guide/components/registration",
      "https://vuejs.org/guide/components/props",
      "https://vuejs.org/guide/reusability/composables",
      "https://vuejs.org/guide/scaling-up/pinia",
    ],
    typescript: [
      "https://www.typescriptlang.org/docs/handbook/2/types-from-types.html",
      "https://www.typescriptlang.org/docs/handbook/2/generics.html",
      "https://www.typescriptlang.org/docs/handbook/2/narrowing.html",
      "https://www.typescriptlang.org/docs/handbook/decorators.html",
      "https://www.typescriptlang.org/docs/handbook/utility-types.html",
    ],
    engineering: [
      // webpack - 国内可访问
      "https://webpack.js.org/concepts/",
      "https://webpack.js.org/guides/getting-started/",
      "https://webpack.js.org/guides/code-splitting/",
      "https://webpack.js.org/guides/tree-shaking/",
      // rollup - 国内可访问
      "https://rollupjs.org/introduction/",
      "https://rollupjs.org/tutorial/",
      // eslint - 国内可访问
      "https://eslint.org/docs/latest/",
      "https://eslint.org/docs/latest/use/getting-started",
      // playwright - 国内可访问
      "https://playwright.dev/docs/intro",
      "https://playwright.dev/docs/writing-tests",
    ],
    browser: [
      "https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work",
      "https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model",
      "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API",
      "https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy",
      "https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API",
    ],
  },

  // 技术文章来源（index页 → 抓文章列表）
  articleSources: [
    { url: "https://react.dev/blog", label: "React Blog" },
    { url: "https://vuejs.org/blog/", label: "Vue Blog" },
    { url: "https://web.dev/blog/", label: "web.dev" },
    { url: "https://developer.mozilla.org/en-US/blog/", label: "MDN Blog" },
    // 掘金前端专栏（RSS聚合页，无需登录）
    { url: "https://juejin.cn/tag/%E5%89%8D%E7%AB%AF", label: "juejin-frontend" },
    { url: "https://juejin.cn/tag/React", label: "juejin-react" },
    { url: "https://juejin.cn/tag/Vue.js", label: "juejin-vue" },
    { url: "https://juejin.cn/tag/TypeScript", label: "juejin-typescript" },
    // SegmentFault 前端频道
    { url: "https://segmentfault.com/channel/frontend", label: "segmentfault-frontend" },
    { url: "https://segmentfault.com/tag/javascript", label: "segmentfault-js" },
  ],

  // 文章直链列表（已知稳定的高质量文章，直接采集内容）
  articleDirectUrls: [
    // web.dev 性能优化系列
    { url: "https://web.dev/articles/vitals", label: "web.dev", category: "performance" },
    { url: "https://web.dev/articles/rendering-performance", label: "web.dev", category: "performance" },
    { url: "https://web.dev/articles/critical-rendering-path", label: "web.dev", category: "browser" },
    { url: "https://web.dev/articles/browser-level-image-lazy-loading", label: "web.dev", category: "performance" },
    { url: "https://web.dev/articles/code-splitting-suspense", label: "web.dev", category: "react" },
    // MDN 核心文章
    { url: "https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work", label: "MDN", category: "browser" },
    { url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules", label: "MDN", category: "javascript" },
    { url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch", label: "MDN", category: "javascript" },
    { url: "https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps", label: "MDN", category: "engineering" },
    // React 官方博客
    { url: "https://react.dev/blog/2024/04/25/react-19", label: "React Blog", category: "react" },
    { url: "https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023", label: "React Blog", category: "react" },
    { url: "https://react.dev/blog/2022/06/15/react-labs-what-we-have-been-working-on-june-2022", label: "React Blog", category: "react" },
    // Vue 官方博客
    { url: "https://blog.vuejs.org/posts/vue-3-3", label: "Vue Blog", category: "vue" },
    { url: "https://blog.vuejs.org/posts/vue-3-4", label: "Vue Blog", category: "vue" },
    { url: "https://blog.vuejs.org/posts/vue-3-5", label: "Vue Blog", category: "vue" },
  ],

  // 面试题 GitHub awesome 列表（raw markdown 直链）
  interviewSources: [
    // React
    "https://raw.githubusercontent.com/sudheerj/reactjs-interview-questions/master/README.md",
    // JavaScript
    "https://raw.githubusercontent.com/sudheerj/javascript-interview-questions/master/README.md",
    // Vue
    "https://raw.githubusercontent.com/sudheerj/vuejs-interview-questions/master/README.md",
    // TypeScript
    "https://raw.githubusercontent.com/DopplerHQ/awesome-interview-questions/master/README.md",
    // CSS / HTML / JavaScript (front-end interview handbook - 正确路径)
    "https://raw.githubusercontent.com/yangshun/front-end-interview-handbook/master/contents/en/css-questions.md",
    "https://raw.githubusercontent.com/yangshun/front-end-interview-handbook/master/contents/en/html-questions.md",
    "https://raw.githubusercontent.com/yangshun/front-end-interview-handbook/master/contents/en/javascript-questions.md",
  ],

  // 面试题分类映射（URL → category）
  interviewSourceMap: {
    "sudheerj/reactjs": "react",
    "sudheerj/javascript": "javascript",
    "sudheerj/vuejs": "vue",
    "DopplerHQ": "typescript",
    "css-questions": "css",
    "html-questions": "browser",
    "javascript-questions": "javascript",
  } as Record<string, string>,
};
