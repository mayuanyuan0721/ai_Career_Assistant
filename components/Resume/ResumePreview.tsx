"use client"

import { useState } from "react"
import styles from "@/css/resumePreview.module.css"

interface Project {
  name?: string
  description?: string
  techStack?: string[]
  role?: string
  startDate?: string
  endDate?: string
  url?: string
  highlights?: string[]
  [key: string]: unknown
}

interface Education {
  school?: string
  tag?: string
  startDate?: string
  endDate?: string
  degree?: string
  major?: string
  courses?: string
  awards?: string[] | string
}

interface ResumeData {
  basic?: {
    name?: string
    email?: string
    phone?: string
    github?: string
    blog?: string
    [key: string]: unknown
  }
  skills?: string[]
  projects?: Project[]
  education?: Array<Education | string>
  [key: string]: unknown
}

interface OptimizedSection {
  [key: string]: {
    optimized: string
    accepted: boolean
  }
}

interface Props {
  resume: ResumeData
  optimizedSections?: OptimizedSection
  onClose: () => void
}

function categorizeSkills(skills: string[]): Record<string, string[]> {
  const keywords: Record<string, string[]> = {
    "基础": ["HTML5", "HTML", "CSS3", "CSS", "JavaScript", "ES6", "TypeScript", "TS"],
    "前端": ["React", "Vue3", "Vue", "Next.js", "Next", "Nuxt", "Angular", "Svelte"],
    "客户端": ["Electron", "Tauri", "Flutter", "React Native"],
    "后端": ["Node.js", "Express", "Koa", "Nest", "Spring Boot", "Spring", "Rust", "C++", "Java", "Python", "Go", "Django"],
    "生态": ["React Router", "Vue Router", "Redux", "Pinia", "Zustand", "Element UI", "Ant Design", "ECharts", "Tailwind", "Axios"],
    "AI": ["LLM", "Agent", "RAG", "MCP", "Skill", "Codex", "Claude", "OpenAI", "LangChain"],
    "工程化": ["Webpack", "Vite", "Rollup", "ESLint", "Turbopack", "Babel", "Jest", "Cypress"],
    "性能优化": ["SSR", "SSG", "FCP", "LCP", "缓存", "拆分", "懒加载", "预加载"],
    "其他": ["Git", "Docker", "Linux", "Nginx", "CI/CD", "AWS", "Vercel", "Supabase", "MySQL", "PostgreSQL", "MongoDB", "Redis"],
  }

  const categories: Record<string, string[]> = {}
  const used = new Set<string>()

  for (const [category, categoryKeywords] of Object.entries(keywords)) {
    const matches = skills.filter((skill) =>
      categoryKeywords.some((keyword) => skill.toLowerCase().includes(keyword.toLowerCase()))
    )

    if (matches.length > 0) {
      categories[category] = matches
      matches.forEach((skill) => used.add(skill))
    }
  }

  const other = skills.filter((skill) => !used.has(skill))
  if (other.length > 0) {
    categories["其他"] = [...(categories["其他"] || []), ...other]
  }

  return categories
}

function splitBullets(text: string): string[] {
  return text
    .split(/\n/)
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean)
}

export default function ResumePreview({ resume, optimizedSections, onClose }: Props) {
  const [exporting, setExporting] = useState(false)
  const skillGroups = categorizeSkills(resume.skills || [])

  function getProjectDescription(project: Project, index: number): string {
    const key = `project_${index}`
    if (optimizedSections?.[key]?.accepted) {
      return optimizedSections[key].optimized
    }

    return project.description || ""
  }

  function handlePrint() {
    setExporting(true)
    setTimeout(() => {
      window.print()
      setExporting(false)
    }, 100)
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.toolbar}>
        <button className={styles.closeBtn} onClick={onClose}>关闭预览</button>
        <button className={styles.printBtn} onClick={handlePrint} disabled={exporting}>
          {exporting ? "导出中..." : "导出 PDF"}
        </button>
      </div>

      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.name}>{resume.basic?.name || "姓名"}</h1>
          <div className={styles.contact}>
            {resume.basic?.email && <span>{resume.basic.email}</span>}
            {resume.basic?.email && resume.basic?.phone && <span className={styles.dot}>|</span>}
            {resume.basic?.phone && <span>{resume.basic.phone}</span>}
          </div>
        </div>

        {resume.education && resume.education.length > 0 && (
          <>
            <div className={styles.sectionBar}>教育经历</div>
            <div className={styles.sectionBody}>
              {resume.education.map((education, index) => {
                const item = typeof education === "string" ? { school: education } : education
                const awards = Array.isArray(item.awards)
                  ? item.awards
                  : item.awards?.split("\n").filter(Boolean)

                return (
                  <div key={index} className={styles.eduItem}>
                    <div className={styles.eduRow}>
                      <span className={styles.eduSchool}>
                        {item.school || "学校"}{item.tag ? ` ${item.tag}` : ""}
                      </span>
                      {(item.startDate || item.endDate) && (
                        <span className={styles.eduDate}>{item.startDate || ""} - {item.endDate || "至今"}</span>
                      )}
                    </div>
                    {(item.degree || item.major) && (
                      <div className={styles.eduDegree}>{item.degree}{item.major ? ` | ${item.major}` : ""}</div>
                    )}
                    {item.courses && <div className={styles.eduCourses}>主修课程：{item.courses}</div>}
                    {awards && awards.length > 0 && (
                      <ul className={styles.bulletList}>
                        {awards.map((award, awardIndex) => <li key={awardIndex}>{award}</li>)}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        <div className={styles.sectionBar}>专业技能</div>
        <div className={styles.sectionBody}>
          {Object.entries(skillGroups).map(([category, skills]) => (
            <div key={category} className={styles.skillRow}>
              <span className={styles.skillCat}>{category}：</span>
              <span className={styles.skillList}>{skills.join("、")}</span>
            </div>
          ))}
        </div>

        {resume.projects && resume.projects.length > 0 && (
          <>
            <div className={styles.sectionBar}>项目经历</div>
            <div className={styles.sectionBody}>
              {resume.projects.map((project, index) => {
                const bullets = splitBullets(getProjectDescription(project, index))

                return (
                  <div key={index} className={styles.projItem}>
                    <div className={styles.projRow}>
                      <span className={styles.projName}>{project.name || `项目${index + 1}`}</span>
                      {project.role && <span className={styles.projRole}>{project.role}</span>}
                      {(project.startDate || project.endDate) && (
                        <span className={styles.projDate}>{project.startDate || ""} - {project.endDate || "至今"}</span>
                      )}
                    </div>
                    {project.url && <div className={styles.projUrl}>{project.url}</div>}
                    {project.techStack && project.techStack.length > 0 && (
                      <div className={styles.projTech}>{project.techStack.join(" + ")}</div>
                    )}
                    {bullets.length > 0 && (
                      <ul className={styles.bulletList}>
                        {bullets.map((bullet, bulletIndex) => <li key={bulletIndex}>{bullet}</li>)}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
