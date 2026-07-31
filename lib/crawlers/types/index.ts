export type JobLevel = "junior" | "middle" | "senior"
export type InterviewLevel = "junior" | "middle" | "senior"
export type SkillProficiency = "basic" | "middle" | "advanced"
export type SkillCategory =
  | "javascript"
  | "react"
  | "vue"
  | "typescript"
  | "engineering"
  | "browser"
export type InterviewCategory =
  | "javascript"
  | "react"
  | "vue"
  | "css"
  | "browser"
  | "typescript"
  | "engineering"
  | "performance"

export interface BaseRecord {
  source: string
  collected_at: string
  hash?: string
}

export interface SkillWeight {
  name: string
  level: SkillProficiency
  weight: number
}

export interface LevelMeta {
  level: JobLevel
  level_name: string
  experience_year: string
}

export interface Job extends BaseRecord {
  id: string
  title: string
  category: string
  level: JobLevel
  level_name: string
  experience_year: string
  salary: string
  skills: SkillWeight[]
  responsibilities: string[]
  requirements: string[]
  description: string
  // New fields for real job data
  location?: string        // 工作地点（城市）
  address?: string         // 详细地址
  company?: string         // 公司名称
  company_size?: string    // 公司规模
  job_url?: string         // 岗位链接
  contact?: string         // 联系方式
}

export interface ScoreRule {
  level: "basic" | "good" | "excellent"
  score: number
  description: string
}

export interface InterviewQuestion extends BaseRecord {
  id: string
  skill: string
  category: InterviewCategory
  level: InterviewLevel
  question: string
  answer: string
  knowledge_points: string[]
  score_rule: ScoreRule[]
}

export interface SkillLevelAbility {
  name: InterviewLevel
  ability: string[]
}

export interface SkillRelation {
  prerequisite: string[]
  next_skill: string[]
}

export interface SkillModel {
  id: string
  name: string
  category: string
  level: SkillLevelAbility[]
  relation: SkillRelation
  source: string
  collected_at: string
}

export interface ResumeProject {
  name: string
  description: string
  highlights: string[]
  tech_stack: string[]
}

export interface ResumeExample {
  id: string
  target_job: string
  target_level: string
  summary: string
  skills: string[]
  projects: ResumeProject[]
}

export interface CrawlStats {
  added: number
  skipped: number
  errors: number
}