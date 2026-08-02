import fs from "fs"
import path from "path"

const OUTPUT_FILE = path.join(process.cwd(), "data", "career-data", "jobs", "frontend_jobs_enhanced.json")

const COMPANIES = [
  { name: "字节跳动", size: "10000人以上", offices: ["北京", "上海", "深圳", "杭州", "成都"] },
  { name: "腾讯", size: "10000人以上", offices: ["深圳", "北京", "上海", "成都", "武汉"] },
  { name: "阿里巴巴", size: "10000人以上", offices: ["杭州", "北京", "上海", "深圳"] },
  { name: "美团", size: "10000人以上", offices: ["北京", "上海"] },
  { name: "京东", size: "10000人以上", offices: ["北京", "上海", "深圳"] },
  { name: "百度", size: "10000人以上", offices: ["北京", "上海", "深圳"] },
  { name: "网易", size: "10000人以上", offices: ["杭州", "广州"] },
  { name: "华为", size: "10000人以上", offices: ["深圳", "东莞", "成都", "西安"] },
  { name: "小米", size: "10000人以上", offices: ["北京", "南京", "武汉"] },
  { name: "蚂蚁集团", size: "10000人以上", offices: ["杭州", "上海"] },
  { name: "拼多多", size: "5000-10000人", offices: ["上海", "广州"] },
  { name: "快手", size: "5000-10000人", offices: ["北京", "上海"] },
  { name: "滴滴", size: "5000-10000人", offices: ["北京", "上海"] },
  { name: "B站", size: "5000-10000人", offices: ["上海", "北京"] },
  { name: "携程", size: "10000人以上", offices: ["上海", "北京", "成都"] },
  { name: "Google", size: "10000人以上", offices: ["北京", "上海"] },
  { name: "Microsoft", size: "10000人以上", offices: ["北京", "上海", "苏州"] },
]

const JOB_TEMPLATES = [
  { title: "React前端开发工程师", skills: ["React", "TypeScript", "Webpack", "Node.js", "Git"], salary: { junior: "10-15k", middle: "15-25k", senior: "25-45k" } },
  { title: "Vue前端开发工程师", skills: ["Vue3", "TypeScript", "Vite", "Pinia", "Element Plus"], salary: { junior: "9-14k", middle: "14-22k", senior: "22-40k" } },
  { title: "Next.js全栈工程师", skills: ["Next.js", "React", "TypeScript", "Prisma", "PostgreSQL"], salary: { junior: "12-18k", middle: "18-30k", senior: "28-50k" } },
  { title: "前端架构师", skills: ["React", "Vue", "TypeScript", "微前端", "Webpack"], salary: { junior: "15-20k", middle: "25-40k", senior: "40-70k" } },
  { title: "AI前端工程师", skills: ["React", "TypeScript", "LangChain.js", "WebSocket", "Canvas"], salary: { junior: "15-22k", middle: "22-35k", senior: "35-60k" } },
]

type Level = "junior" | "middle" | "senior"

const LEVELS: Level[] = ["junior", "middle", "senior"]
const LEVEL_NAMES = { junior: "初级", middle: "中级", senior: "高级" }
const EXPERIENCE = { junior: "1-3年", middle: "3-5年", senior: "5年以上" }

function generateEnhancedJobs(count = 100) {
  const jobs = []
  for (let i = 0; i < count; i++) {
    const template = JOB_TEMPLATES[i % JOB_TEMPLATES.length]
    const company = COMPANIES[Math.floor(Math.random() * COMPANIES.length)]
    const level = LEVELS[Math.floor(Math.random() * LEVELS.length)]
    const location = company.offices[Math.floor(Math.random() * company.offices.length)]
    
    jobs.push({
      id: "job_" + String(i + 1).padStart(3, "0"),
      title: LEVEL_NAMES[level] + template.title,
      company: company.name,
      company_size: company.size,
      location: location,
      address: location + "市XX区XX路XX号",
      level,
      experience: EXPERIENCE[level],
      salary: template.salary[level],
      skills: template.skills,
      description: company.name + "正在招聘" + LEVEL_NAMES[level] + template.title,
      requirements: [EXPERIENCE[level] + "前端开发经验", "精通" + template.skills.slice(0, 2).join("、")],
      job_url: "https://www.example.com/jobs/" + (i + 1),
      source: "enhanced",
      collected_at: new Date().toISOString(),
    })
  }
  return jobs
}

const enhancedJobs = generateEnhancedJobs(100)
fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true })
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(enhancedJobs, null, 2), "utf-8")
console.log("Generated " + enhancedJobs.length + " enhanced jobs")
