/**
 * 数据迁移脚本：将现有 JSON 数据导入到数据库
 * 用法：npx ts-node database/migrate-data.ts
 */

// 加载环境变量
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env.local") });

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function migrateIndustries() {
  console.log("📋 Migrating industries...");
  
  const industries = [
    { name: "前端开发", slug: "frontend", icon: "🎨", description: "Web前端开发工程师，负责网站界面和交互" },
    { name: "后端开发", slug: "backend", icon: "⚙️", description: "服务端开发工程师，负责业务逻辑和系统架构" },
    { name: "UI/UX设计", slug: "design", icon: "🎯", description: "UI/UX设计师，负责产品视觉和用户体验" },
    { name: "产品经理", slug: "product", icon: "📋", description: "产品经理，负责产品规划和需求分析" },
    { name: "数据分析", slug: "data", icon: "📊", description: "数据分析师，负责数据挖掘和分析" },
    { name: "移动开发", slug: "mobile", icon: "📱", description: "iOS/Android开发工程师，负责移动应用开发" },
    { name: "测试工程师", slug: "testing", icon: "🧪", description: "测试工程师，负责质量保证和自动化测试" },
    { name: "运维工程师", slug: "devops", icon: "🔧", description: "运维工程师，负责服务器和基础设施管理" },
  ];

  const { data, error } = await supabase
    .from("industries")
    .upsert(industries, { onConflict: "slug" })
    .select();

  if (error) {
    console.error("❌ Failed to migrate industries:", error);
    return null;
  }

  console.log(`✅ Migrated ${data?.length} industries`);
  return data;
}

async function migrateFrontendJobs(industryId: string) {
  console.log("💼 Migrating frontend jobs...");
  
  const jobsPath = path.join(__dirname, "../data/career-data/jobs/frontend_jobs.json");
  const jobsData = JSON.parse(fs.readFileSync(jobsPath, "utf-8"));

  const jobs = jobsData.map((job: any) => ({
    industry_id: industryId,
    title: job.title,
    level: job.level,
    experience: job.experience,
    salary: job.salary,
    education: job.education,
    skills: job.skills || [],
    description: job.description,
    requirements: job.requirements || [],
    responsibilities: job.responsibility ? [job.responsibility] : [],
    company: job.company,
    company_size: job.company_size,
    location: job.location,
    address: job.address,
    source: job.source || "mock",
    job_url: job.job_url,
    posted_at: job.posted_at,
    collected_at: job.collected_at,
    hash: job.hash,
    is_active: true,
  }));

  const { data, error } = await supabase
    .from("jobs")
    .upsert(jobs)
    .select();

  if (error) {
    console.error("❌ Failed to migrate jobs:", error);
    return;
  }

  console.log(`✅ Migrated ${data?.length} jobs`);
}

async function migrateFrontendSkills(industryId: string) {
  console.log("🎯 Migrating frontend skills...");
  
  const skillsPath = path.join(__dirname, "../data/career-data/skills");
  const skillFiles = fs.readdirSync(skillsPath).filter(f => f.endsWith(".md"));

  const skills: any[] = [];
  
  for (const file of skillFiles) {
    const content = fs.readFileSync(path.join(skillsPath, file), "utf-8");
    const fileName = path.basename(file, ".md");
    
    // 简单解析 markdown（可以根据需要增强）
    const lines = content.split("\n").filter(l => l.trim());
    
    for (const line of lines) {
      if (line.startsWith("# ")) {
        // 标题行，提取分类
        const category = line.replace("# ", "").trim();
        skills.push({
          industry_id: industryId,
          category,
          name: category,
          name_en: fileName,
          level: "all",
          weight: 3,
          is_core: true,
          description: content.substring(0, 200),
        });
      }
    }
  }

  const { data, error } = await supabase
    .from("skills")
    .upsert(skills, { onConflict: "industry_id,name" })
    .select();

  if (error) {
    console.error("❌ Failed to migrate skills:", error);
    return;
  }

  console.log(`✅ Migrated ${data?.length} skills`);
}

async function main() {
  console.log("🚀 Starting data migration...\n");

  // 1. 迁移行业
  const industries = await migrateIndustries();
  if (!industries) {
    console.error("Migration failed!");
    process.exit(1);
  }

  // 2. 找到前端行业 ID
  const frontendIndustry = industries.find(i => i.slug === "frontend");
  if (!frontendIndustry) {
    console.error("Frontend industry not found!");
    process.exit(1);
  }

  // 3. 迁移前端岗位
  await migrateFrontendJobs(frontendIndustry.id);

  // 4. 迁移前端技能
  await migrateFrontendSkills(frontendIndustry.id);

  console.log("\n✅ Migration completed!");
}

main().catch(console.error);
