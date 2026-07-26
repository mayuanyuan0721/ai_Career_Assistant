export type JobLevel = "junior" | "middle" | "senior";
export type InterviewLevel = "junior" | "middle" | "senior";
export type SkillProficiency = "basic" | "middle" | "advanced";
export type SkillCategory =
  | "javascript"
  | "react"
  | "vue"
  | "typescript"
  | "engineering"
  | "browser";
export type InterviewCategory =
  | "javascript"
  | "react"
  | "vue"
  | "css"
  | "browser"
  | "typescript"
  | "engineering"
  | "performance";

export interface BaseRecord {
  source: string;
  collected_at: string;
  hash?: string;
}

// ── 技能权重条目 ──────────────────────────────────────────────
export interface SkillWeight {
  name: string;
  level: SkillProficiency; // 该岗位要求的掌握程度
  weight: number;          // 1-10，权重越高越核心
}

// ── 等级元信息 ─────────────────────────────────────────────────
export interface LevelMeta {
  level: JobLevel;
  level_name: string;      // "初级工程师" / "中级工程师" / "高级工程师"
  experience_year: string; // "1-3" / "3-5" / "5+"
}

// ── 岗位 JD（重构版）─────────────────────────────────────────
export interface Job extends BaseRecord {
  id: string;              // "job_001"
  title: string;
  category: string;        // "frontend"
  level: JobLevel;
  level_name: string;
  experience_year: string;
  salary: string;
  skills: SkillWeight[];   // 带权重的技能列表
  responsibilities: string[]; // 岗位职责（列表）
  requirements: string[];     // 技能要求（列表）
  description: string;
}

// ── 面试题（增强版）──────────────────────────────────────────
export interface ScoreRule {
  level: "basic" | "good" | "excellent";
  score: number;
  description: string;
}

export interface InterviewQuestion extends BaseRecord {
  id: string;              // "react_001"
  skill: string;           // "React"
  category: InterviewCategory;
  level: InterviewLevel;
  question: string;
  answer: string;
  knowledge_points: string[]; // 考察的知识点
  score_rule: ScoreRule[];    // 评分标准
}

// ── 技能模型 ─────────────────────────────────────────────────
export interface SkillLevelAbility {
  name: InterviewLevel;
  ability: string[];       // 该等级掌握的能力列表
}

export interface SkillRelation {
  prerequisite: string[];  // 前置技能
  next_skill: string[];    // 进阶技能
}

export interface SkillModel {
  id: string;              // "skill_react"
  name: string;
  category: string;        // "frontend_framework"
  level: SkillLevelAbility[];
  relation: SkillRelation;
  source: string;
  collected_at: string;
}

// ── 简历案例 ─────────────────────────────────────────────────
export interface ResumeProject {
  name: string;
  description: string;
  highlights: string[];   // 项目亮点/数据
  tech_stack: string[];
}

export interface ResumeExample {
  id: string;
  target_job: string;     // 目标岗位
  target_level: JobLevel;
  summary: string;        // 个人简介
  skills: string[];
  projects: ResumeProject[];
  source: string;
  collected_at: string;
}

// ── GitHub 项目 ───────────────────────────────────────────────
export interface Project extends BaseRecord {
  name: string;
  stack: string[];
  description: string;
  features: string[];
  stars: number;
  url: string;
}

// ── 技术文章 ─────────────────────────────────────────────────
export interface Article extends BaseRecord {
  title: string;
  content: string;
  url: string;
}

// ── 技能文档（Markdown输出，不存JSON）────────────────────────
export interface SkillDoc {
  category: SkillCategory;
  title: string;
  content: string;
  source: string;
  collected_at: string;
}

// ── 采集统计 ─────────────────────────────────────────────────
export interface CrawlStats {
  added: number;
  skipped: number;
  errors: number;
}
