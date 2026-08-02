/**
 * 生成模拟招聘数据，覆盖前后端全栈岗位
 * node scripts/gen-jobs.mjs
 */
import { writeFileSync } from "fs"
import { join } from "path"

const COMPANIES = [
  { name: "阿里巴巴", size: "10000人以上" },
  { name: "腾讯", size: "10000人以上" },
  { name: "字节跳动", size: "10000人以上" },
  { name: "百度", size: "10000人以上" },
  { name: "美团", size: "10000人以上" },
  { name: "京东", size: "10000人以上" },
  { name: "网易", size: "10000人以上" },
  { name: "小米", size: "10000人以上" },
  { name: "华为", size: "10000人以上" },
  { name: "快手", size: "5000-10000人" },
  { name: "滴滴", size: "5000-10000人" },
  { name: "拼多多", size: "5000-10000人" },
  { name: "B站", size: "5000-10000人" },
  { name: "蚂蚁集团", size: "10000人以上" },
  { name: "携程", size: "10000人以上" },
  { name: "同花顺", size: "1000-5000人" },
  { name: "科大讯飞", size: "5000-10000人" },
  { name: "商汤科技", size: "1000-5000人" },
]

const CITIES = [
  { city: "北京", districts: ["海淀区中关村", "朝阳区望京", "西城区金融街", "顺义区后沙峪"] },
  { city: "上海", districts: ["浦东新区陆家嘴", "静安区南京西路", "徐汇区漕河泾", "闵行区虹桥"] },
  { city: "深圳", districts: ["南山区科技园", "福田区华强北", "龙岗区坂田", "宝安区西乡"] },
  { city: "杭州", districts: ["西湖区文三路", "余杭区未来科技城", "滨江区网商路", "萧山区钱江世纪城"] },
  { city: "广州", districts: ["天河区珠江新城", "黄埔区科学城", "番禺区大学城", "南沙区明珠湾"] },
  { city: "成都", districts: ["高新区天府软件园", "武侯区高新西区", "天府新区"] },
  { city: "武汉", districts: ["东湖高新区光谷", "武昌区徐东", "江岸区"] },
  { city: "南京", districts: ["江宁区软件大道", "鼓楼区新街口", "建邺区河西"] },
]

const JOB_TEMPLATES = [
  // 前端
  {
    category: "frontend",
    titles: { junior: "初级前端开发工程师", middle: "中级前端开发工程师", senior: "高级前端开发工程师 / 前端架构师" },
    skills: { junior: ["HTML", "CSS", "JavaScript", "Vue3", "Git"], middle: ["React", "TypeScript", "Webpack", "Node.js", "Git"], senior: ["React", "Vue3", "TypeScript", "微前端", "性能优化", "Webpack", "Vite"] },
    salary: { junior: "8-14k", middle: "15-25k", senior: "25-50k" },
    education: { junior: "本科及以上", middle: "本科及以上", senior: "本科及以上" },
    requirements: {
      junior: ["计算机相关专业本科及以上学历", "熟悉 HTML/CSS/JavaScript 基础", "了解 Vue 或 React 框架", "有实习或项目经验优先"],
      middle: ["本科及以上，3年以上前端开发经验", "熟练掌握 React 或 Vue3 + TypeScript", "熟悉 Webpack/Vite 构建工具", "有独立负责项目经验"],
      senior: ["本科及以上，5年以上前端经验", "精通 React/Vue3 + TypeScript", "有微前端/性能优化/组件库建设经验", "良好的技术视野和团队协作能力"],
    },
  },
  // Java 后端
  {
    category: "java",
    titles: { junior: "Java 开发工程师（初级）", middle: "Java 后端开发工程师", senior: "高级 Java 开发工程师 / Java 架构师" },
    skills: { junior: ["Java", "Spring Boot", "MySQL", "Maven", "Git"], middle: ["Java", "Spring Boot", "Spring Cloud", "MySQL", "Redis", "MyBatis"], senior: ["Java", "Spring Boot", "Spring Cloud", "Kafka", "Redis", "MySQL", "Docker", "微服务"] },
    salary: { junior: "8-15k", middle: "15-30k", senior: "28-55k" },
    education: { junior: "本科及以上", middle: "本科及以上", senior: "本科及以上" },
    requirements: {
      junior: ["计算机相关专业本科及以上", "熟悉 Java 基础语法及 OOP 思想", "了解 Spring Boot、MySQL 基本使用", "良好的编码习惯和自学能力"],
      middle: ["本科及以上，3年以上 Java 开发经验", "熟练掌握 Spring Boot / Spring Cloud", "熟悉 MySQL 优化及 Redis 缓存设计", "有微服务架构实践经验"],
      senior: ["5年以上 Java 开发，有分布式系统经验", "精通 JVM 调优、高并发、分布式事务", "有 Kafka/RocketMQ 消息队列使用经验", "主导过核心系统设计和技术选型"],
    },
  },
  // 全栈
  {
    category: "fullstack",
    titles: { junior: "全栈开发工程师（初级）", middle: "全栈开发工程师", senior: "高级全栈工程师" },
    skills: { junior: ["Vue3", "Node.js", "MySQL", "JavaScript", "Git"], middle: ["React", "Node.js", "TypeScript", "PostgreSQL", "Docker"], senior: ["React", "Next.js", "Node.js", "TypeScript", "PostgreSQL", "Redis", "Docker"] },
    salary: { junior: "10-16k", middle: "18-32k", senior: "28-55k" },
    education: { junior: "本科及以上", middle: "本科及以上", senior: "本科及以上" },
    requirements: {
      junior: ["熟悉前后端基本技术栈", "了解 REST API 设计", "有小程序或 Web 项目经验优先"],
      middle: ["3年以上全栈开发经验", "熟练使用 React/Vue + Node.js", "能独立完成从需求到上线的完整链路"],
      senior: ["5年以上全栈经验", "精通前后端技术栈及云部署", "有 CI/CD 流水线搭建经验"],
    },
  },
  // 测试
  {
    category: "test",
    titles: { junior: "软件测试工程师", middle: "高级测试工程师", senior: "测试开发工程师 / QA Lead" },
    skills: { junior: ["Postman", "MySQL", "Python", "Jira", "Git"], middle: ["Selenium", "Python", "Pytest", "Postman", "Jenkins", "MySQL"], senior: ["Selenium", "Python", "Pytest", "Jenkins", "Docker", "性能测试", "Jmeter"] },
    salary: { junior: "7-12k", middle: "12-22k", senior: "20-40k" },
    education: { junior: "本科及以上", middle: "本科及以上", senior: "本科及以上" },
    requirements: {
      junior: ["计算机相关专业，了解软件测试基本流程", "熟悉 Postman 接口测试", "了解 SQL 基本查询", "能编写基本测试用例"],
      middle: ["3年以上测试经验，熟练使用自动化测试框架", "熟练使用 Python + Selenium/Pytest", "有 CI/CD 集成经验", "具备良好的 Bug 定位能力"],
      senior: ["5年以上测试经验", "精通性能测试和安全测试", "有测试平台建设经验", "能推动团队测试规范和流程优化"],
    },
  },
  // Python/AI
  {
    category: "python",
    titles: { junior: "Python 开发工程师（初级）", middle: "Python 后端工程师", senior: "高级 Python 工程师 / AI 应用开发" },
    skills: { junior: ["Python", "Django", "MySQL", "Git"], middle: ["Python", "FastAPI", "Django", "PostgreSQL", "Redis", "Docker"], senior: ["Python", "FastAPI", "LangChain", "PostgreSQL", "Redis", "Docker", "Kubernetes"] },
    salary: { junior: "8-14k", middle: "15-28k", senior: "25-50k" },
    education: { junior: "本科及以上", middle: "本科及以上", senior: "本科及以上" },
    requirements: {
      junior: ["熟悉 Python 基础语法", "了解 Django/Flask 框架", "有项目或实习经验优先"],
      middle: ["3年以上 Python 开发经验", "熟练使用 FastAPI/Django", "有 LLM/AI 应用开发经验优先"],
      senior: ["5年以上，有 AI 应用或大模型工程化经验", "熟悉 LangChain / RAG 架构", "有千万级数据处理经验"],
    },
  },
]

const LEVELS = ["junior", "middle", "senior"]

let id = 1
const jobs = []

for (const template of JOB_TEMPLATES) {
  for (const level of LEVELS) {
    // 每个 level 生成多条（不同公司、城市）
    const count = level === "senior" ? 4 : level === "middle" ? 5 : 4
    for (let i = 0; i < count; i++) {
      const company = COMPANIES[(id * 3 + i) % COMPANIES.length]
      const cityData = CITIES[(id + i) % CITIES.length]
      const district = cityData.districts[i % cityData.districts.length]

      jobs.push({
        id: `job_${String(id).padStart(3, "0")}`,
        title: template.titles[level],
        company: company.name,
        company_size: company.size,
        location: cityData.city,
        address: `${cityData.city}市${district}`,
        level,
        experience: level === "junior" ? "0-3年" : level === "middle" ? "3-5年" : "5年以上",
        salary: template.salary[level],
        education: template.education[level],
        skills: template.skills[level],
        description: `${company.name}是一家行业领先的互联网科技公司，现招聘${template.titles[level]}加入我们的技术团队。`,
        requirements: template.requirements[level],
        job_url: `https://www.zhipin.com/search/?query=${encodeURIComponent(template.titles[level])}&city=${cityData.city}`,
        source: "generated",
        collected_at: new Date().toISOString(),
      })
      id++
    }
  }
}

const outPath = join(process.cwd(), "data/career-data/jobs/frontend_jobs_enhanced.json")
writeFileSync(outPath, JSON.stringify(jobs, null, 2), "utf-8")
console.log(`✅ Generated ${jobs.length} jobs → ${outPath}`)
