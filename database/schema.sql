-- 多行业职业助手数据库 Schema
-- 支持前端、后端、设计、产品等多个行业

-- ============================================
-- 1. 行业表
-- ============================================
CREATE TABLE IF NOT EXISTS industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- 行业名称："前端开发" | "后端开发" | "UI设计" | ...
  slug TEXT UNIQUE NOT NULL,             -- 行业标识："frontend" | "backend" | "design" | ...
  icon TEXT,                             -- 图标 emoji 或 URL
  description TEXT,                      -- 行业描述
  is_active BOOLEAN DEFAULT true,        -- 是否启用
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. 技能表（按行业分类）
-- ============================================
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id UUID REFERENCES industries(id) ON DELETE CASCADE,
  category TEXT,                         -- 技能分类："编程语言" | "框架" | "工具" | "软技能" | ...
  name TEXT NOT NULL,                    -- 技能名称
  name_en TEXT,                          -- 英文名称（用于匹配）
  level TEXT CHECK (level IN ('junior', 'middle', 'senior', 'all')),  -- 适用级别
  weight INT DEFAULT 1,                  -- 权重（1-5，用于匹配算法）
  is_core BOOLEAN DEFAULT false,         -- 是否核心技能
  description TEXT,                      -- 技能描述
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(industry_id, name)              -- 同一行业内技能名唯一
);

-- ============================================
-- 3. 岗位表（按行业分类）
-- ============================================
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id UUID REFERENCES industries(id) ON DELETE CASCADE,
  title TEXT NOT NULL,                   -- 岗位名称
  level TEXT CHECK (level IN ('junior', 'middle', 'senior')),  -- 岗位级别
  experience TEXT,                       -- 经验要求："1-3年" | "3-5年" | ...
  salary TEXT,                           -- 薪资范围："15-25k" | ...
  education TEXT,                        -- 学历要求："本科" | "硕士" | ...
  skills JSONB DEFAULT '[]',             -- 需要的技能 ID 列表
  description TEXT,                      -- 岗位描述
  requirements JSONB DEFAULT '[]',       -- 招聘要求
  responsibilities JSONB DEFAULT '[]',   -- 岗位职责
  company TEXT,                          -- 公司名称
  company_size TEXT,                     -- 公司规模
  location TEXT,                         -- 工作地点
  address TEXT,                          -- 详细地址
  source TEXT,                           -- 数据来源："boss" | "lagou" | "zhaopin" | "mock"
  job_url TEXT,                          -- 原始链接
  posted_at TIMESTAMP WITH TIME ZONE,    -- 发布时间
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  -- 爬取时间
  hash TEXT,                             -- 用于去重
  is_active BOOLEAN DEFAULT true         -- 是否有效
);

-- ============================================
-- 4. 简历模板表
-- ============================================
CREATE TABLE IF NOT EXISTS resume_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id UUID REFERENCES industries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- 模板名称
  sections JSONB DEFAULT '[]',           -- 模板结构
  tips JSONB DEFAULT '[]',               -- 优化建议
  keywords JSONB DEFAULT '[]',           -- 关键词库
  example TEXT,                          -- 示例简历
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. 面试题库表
-- ============================================
CREATE TABLE IF NOT EXISTS interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id UUID REFERENCES industries(id) ON DELETE CASCADE,
  category TEXT,                         -- 题目分类："JavaScript" | "React" | "系统设计" | ...
  level TEXT CHECK (level IN ('junior', 'middle', 'senior')),
  question TEXT NOT NULL,                -- 题目内容
  answer TEXT,                           -- 参考答案
  tags JSONB DEFAULT '[]',               -- 标签
  difficulty INT CHECK (difficulty BETWEEN 1 AND 5),  -- 难度 1-5
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. 用户简历表（扩展现有表）
-- ============================================
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS industry_id UUID REFERENCES industries(id);
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS target_industry TEXT;  -- 目标行业

-- ============================================
-- 索引优化
-- ============================================
CREATE INDEX IF NOT EXISTS idx_skills_industry ON skills(industry_id);
CREATE INDEX IF NOT EXISTS idx_jobs_industry ON jobs(industry_id);
CREATE INDEX IF NOT EXISTS idx_jobs_level ON jobs(level);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_interview_industry ON interview_questions(industry_id);
CREATE INDEX IF NOT EXISTS idx_interview_level ON interview_questions(level);

-- ============================================
-- 插入初始数据：行业列表
-- ============================================
INSERT INTO industries (name, slug, icon, description) VALUES
  ('前端开发', 'frontend', '🎨', 'Web前端开发工程师，负责网站界面和交互'),
  ('后端开发', 'backend', '⚙️', '服务端开发工程师，负责业务逻辑和系统架构'),
  ('UI/UX设计', 'design', '🎯', 'UI/UX设计师，负责产品视觉和用户体验'),
  ('产品经理', 'product', '📋', '产品经理，负责产品规划和需求分析'),
  ('数据分析', 'data', '📊', '数据分析师，负责数据挖掘和分析'),
  ('移动开发', 'mobile', '📱', 'iOS/Android开发工程师，负责移动应用开发'),
  ('测试工程师', 'testing', '🧪', '测试工程师，负责质量保证和自动化测试'),
  ('运维工程师', 'devops', '🔧', '运维工程师，负责服务器和基础设施管理')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 更新现有数据：为现有岗位设置行业
-- ============================================
-- 假设现有的 frontend_jobs.json 数据需要迁移
-- 可以通过脚本批量导入
