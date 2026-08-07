"use client"

import { useState, useRef } from "react"
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
  ranking?: string
  awards?: string[] | string
}

interface CampusExperience {
  title?: string
  organization?: string
  role?: string
  startDate?: string
  endDate?: string
  description?: string
  highlights?: string[]
}

interface JobIntention {
  position?: string
  salary?: string
  city?: string
}

interface ResumeData {
  basic?: {
    name?: string
    email?: string
    phone?: string
    github?: string
    blog?: string
    linkedin?: string
    location?: string
    title?: string
    gender?: string
    age?: string
    [key: string]: unknown
  }
  jobIntention?: JobIntention
  skills?: string[]
  projects?: Project[]
  education?: Array<Education | string>
  campusExperience?: CampusExperience[]
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
  // Keep original skill descriptions, don't extract tech names
  // Just categorize based on whether they contain tech keywords
  const categoryKeywords: Record<string, string[]> = {
    "基础": ["HTML", "CSS", "JavaScript", "TypeScript", "ES6", "ECMAScript", "HTML5", "CSS3"],
    "前端框架": ["React", "Vue", "Next.js", "Nuxt.js", "Angular", "Svelte"],
    "客户端": ["Electron", "Tauri", "Flutter", "React Native"],
    "后端": ["Node.js", "Express", "Koa", "Spring Boot", "Java", "Python", "Go", "Django", "PHP", "Rust"],
    "生态工具": ["Redux", "Pinia", "Zustand", "Ant Design", "Element UI", "Axios", "jQuery", "Webpack", "Vite"],
    "AI": ["LLM", "OpenAI", "LangChain", "Agent", "RAG"],
    "性能优化": ["SSR", "SSG", "性能优化"],
    "数据库": ["MySQL", "PostgreSQL", "MongoDB", "Redis", "Supabase", "Firebase"],
    "运维/其他": ["Git", "Docker", "Linux", "CI/CD", "AWS", "Vercel", "HTTP", "TCP/IP"],
  }

  const categories: Record<string, string[]> = {}
  const categorized = new Set<string>()

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    const matches: string[] = []
    
    for (const skill of skills) {
      if (categorized.has(skill)) continue
      const lowerSkill = skill.toLowerCase()
      const hasKeyword = keywords.some((kw) => lowerSkill.includes(kw.toLowerCase()))
      
      if (hasKeyword && skill.trim().length > 0) {
        matches.push(skill)
        categorized.add(skill)
      }
    }
    
    if (matches.length > 0) {
      categories[category] = matches
    }
  }

  // Step 3: Any uncategorized skills go to "其他"
  const uncategorized = skills.filter((s) => !categorized.has(s) && s.trim().length > 0)
  if (uncategorized.length > 0) {
    categories["其他"] = uncategorized
  }

  return categories
}

function splitBullets(text: string): string[] {
  return text
    .split(/\n/)
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean)
}

function splitLines(text: string): string[] {
  return text.split(/\n/).map((l) => l.trim()).filter(Boolean)
}

/* ── STAR format parser ── */
interface StarSection {
  type: "context" | "situation" | "task" | "action" | "result"
  label: string
  content: string
}

function parseStarFormat(text: string): { isStar: boolean; sections: StarSection[] } {
  // Detect STAR markers: 背景(S), 任务(T), 行动(A), 结果(R)
  const starPattern = /(背景|Situation|S)\s*[\(（]?[STsS]?[\)）]?\s*[：:]|(任务|Task|T)\s*[\(（]?[Tt]?[\)）]?\s*[：:]|(行动|Action|A)\s*[\(（]?[Aa]?[\)）]?\s*[：:]|(结果|Result|R)\s*[\(（]?[Rr]?[\)）]?\s*[：:]/
  
  if (!starPattern.test(text)) {
    return { isStar: false, sections: [] }
  }

  const sections: StarSection[] = []
  // Split by STAR markers
  const lines = text.split(/\n/)
  let currentType: StarSection["type"] = "context"
  let currentLabel = ""
  let currentContent: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Check if this line starts a STAR section
    const starMatch = trimmed.match(/^(背景|Situation|S)\s*[\(（]?[STsS]?[\)）]?\s*[：:]\s*(.*)/i)
      || trimmed.match(/^(任务|Task|T)\s*[\(（]?[Tt]?[\)）]?\s*[：:]\s*(.*)/i)
      || trimmed.match(/^(行动|Action|A)\s*[\(（]?[Aa]?[\)）]?\s*[：:]\s*(.*)/i)
      || trimmed.match(/^(结果|Result|R)\s*[\(（]?[Rr]?[\)）]?\s*[：:]\s*(.*)/i)

    if (starMatch) {
      // Save previous section
      if (currentContent.length > 0 || currentLabel) {
        sections.push({ type: currentType, label: currentLabel, content: currentContent.join("\n") })
      }
      // Start new section
      const keyword = starMatch[1].toLowerCase()
      if (keyword.includes("背景") || keyword === "s" || keyword === "situation") {
        currentType = "situation"
        currentLabel = "背景"
      } else if (keyword.includes("任务") || keyword === "t" || keyword === "task") {
        currentType = "task"
        currentLabel = "任务"
      } else if (keyword.includes("行动") || keyword === "a" || keyword === "action") {
        currentType = "action"
        currentLabel = "行动"
      } else if (keyword.includes("结果") || keyword === "r" || keyword === "result") {
        currentType = "result"
        currentLabel = "成果"
      }
      currentContent = starMatch[2] ? [starMatch[2]] : []
    } else {
      currentContent.push(trimmed)
    }
  }
  // Save last section
  if (currentContent.length > 0 || currentLabel) {
    sections.push({ type: currentType, label: currentLabel, content: currentContent.join("\n") })
  }

  return { isStar: true, sections }
}

export default function ResumePreview({ resume, optimizedSections, onClose }: Props) {
  const [exporting, setExporting] = useState(false)
  const pageRef = useRef<HTMLDivElement>(null)
  const skillGroups = categorizeSkills(resume.skills || [])

  function getProjectDescription(project: Project, index: number): string {
    const key = `project_${index}`
    if (optimizedSections?.[key]?.accepted) {
      return optimizedSections[key].optimized
    }
    
    // 查找最近的包含"## 项目名称"或"## 项目描述"的优化内容
    if (optimizedSections && Object.keys(optimizedSections).length > 0) {
      for (const [optKey, optValue] of Object.entries(optimizedSections)) {
        if (optValue.accepted && typeof optValue.optimized === 'string') {
          // 检测是否包含"## 项目名称"或"## 项目描述"的头部格式
          if (optValue.optimized.includes('## 项目名称') || 
              optValue.optimized.includes('## 项目描述') ||
              optValue.optimized.includes('### 项目')) {
            const descriptionSectionStart = optValue.optimized.indexOf('## 项目描述')
            
            if (descriptionSectionStart >= 0) {
              // 提取从项目描述开始的完整内容
              const remainingText = optValue.optimized.substring(descriptionSectionStart + 9)
              // 停止于下一个章节（以#开头的行）
              const nextSectionIndex = remainingText.match(/\n#{2,3}\s/)?.index ?? remainingText.length
              const fullDesc = remainingText.substring(0, nextSectionIndex).trim()
              
              console.log('[ResumePreview] Auto-detected project description:', {
                key: optKey,
                originalDesc: project.description?.substring(0, 50),
                newDesc: fullDesc.substring(0, 50)
              })
              
              return fullDesc
            }
          }
        }
      }
    }
    
    return project.description || ""
  }

  async function handlePrint() {
    if (!pageRef.current || exporting) return
    setExporting(true)
    
    try {
      const element = pageRef.current
      const fileName = resume.basic?.name ? `${resume.basic.name}_简历.pdf` : "简历.pdf"
      
      const opt = {
        margin: 0,
        filename: fileName,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          letterRendering: true 
        },
        jsPDF: { 
          unit: "mm", 
          format: "a4", 
          orientation: "portrait"
        },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] }
      }
      
      // 动态导入 html2pdf.js（纯浏览器库，不能在服务端加载）
      const html2pdf = (await import("html2pdf.js")).default
      await html2pdf().set(opt as any).from(element).save()
    } catch (err) {
      console.error("[ResumePreview] PDF export failed:", err)
      alert("导出失败，请重试")
    } finally {
      setExporting(false)
    }
  }

  // Build personal info line
  const personalInfoParts: string[] = []
  if (resume.basic?.gender) personalInfoParts.push(resume.basic.gender)
  if (resume.basic?.age) personalInfoParts.push(`年龄：${resume.basic.age}`)
  if (resume.basic?.phone) personalInfoParts.push(resume.basic.phone)
  if (resume.basic?.email) personalInfoParts.push(resume.basic.email)

  // Job intention
  const intention = resume.jobIntention
  const intentionParts: string[] = []
  if (intention?.position) intentionParts.push(`求职意向：${intention.position}`)
  if (intention?.salary) intentionParts.push(`期望薪资：${intention.salary}`)
  if (intention?.city) intentionParts.push(`期望城市：${intention.city}`)

  return (
    <div className={styles.overlay}>
      <div className={styles.toolbar}>
        <button className={styles.closeBtn} onClick={onClose}>关闭预览</button>
        <button className={styles.printBtn} onClick={handlePrint} disabled={exporting}>
          {exporting ? "导出中..." : "下载 PDF"}
        </button>
      </div>

      <div className={styles.page} ref={pageRef}>
        {/* ── Header ── */}
        <div className={styles.header}>
          <h1 className={styles.name}>{resume.basic?.name || "姓名"}</h1>
        </div>

        {/* ── Personal Info Line ── */}
        {personalInfoParts.length > 0 && (
          <div className={styles.infoLine}>
            {personalInfoParts.map((part, i) => (
              <span key={i}>
                {i > 0 && <span className={styles.separator}> | </span>}
                {part}
              </span>
            ))}
          </div>
        )}

        {/* ── Job Intention Line ── */}
        {intentionParts.length > 0 && (
          <div className={styles.infoLine}>
            {intentionParts.map((part, i) => (
              <span key={i}>
                {i > 0 && <span className={styles.separator}> | </span>}
                {part}
              </span>
            ))}
          </div>
        )}

        {/* ── Education ── */}
        {resume.education && resume.education.length > 0 && (
          <>
            <div className={styles.sectionHeader}>教育经历</div>
            <div className={styles.sectionContent}>
              {resume.education.map((education, index) => {
                const item = typeof education === "string" ? { school: education } : education
                const awards = Array.isArray(item.awards)
                  ? item.awards
                  : item.awards?.split("\n").filter(Boolean)

                return (
                  <div key={index} className={styles.entry}>
                    <div className={styles.entryRow}>
                      <div className={styles.entryLeft}>
                        <span className={styles.entryTitle}>
                          {item.school || "学校"}
                        </span>
                        {item.degree && <span className={styles.entryMeta}>{item.degree}</span>}
                        {item.major && <span className={styles.entryMeta}>{item.major}</span>}
                      </div>
                      <div className={styles.entryRight}>
                        {(item.startDate || item.endDate) && (
                          <span className={styles.entryDate}>{item.startDate || ""} - {item.endDate || "至今"}</span>
                        )}
                      </div>
                    </div>
                    {item.ranking && <div className={styles.entrySub}>专业排名：{item.ranking}</div>}
                    {item.courses && <div className={styles.entrySub}>主修课程：{item.courses}</div>}
                    {awards && awards.length > 0 && (
                      <ol className={styles.numberedList}>
                        {awards.map((award, awardIndex) => (
                          <li key={awardIndex}>{award}</li>
                        ))}
                      </ol>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ── Campus Experience (在校经历) ── */}
        {resume.campusExperience && resume.campusExperience.length > 0 && (
          <>
            <div className={styles.sectionHeader}>在校经历</div>
            <div className={styles.sectionContent}>
              {resume.campusExperience.map((exp, index) => {
                const highlights = exp.highlights || splitLines(exp.description || "")
                return (
                  <div key={index} className={styles.entry}>
                    <div className={styles.entryRow}>
                      <div className={styles.entryLeft}>
                        {exp.organization && <span className={styles.entryTitle}>{exp.organization}</span>}
                        {exp.role && <span className={styles.entryMeta}>{exp.role}</span>}
                        {!exp.organization && exp.title && <span className={styles.entryTitle}>{exp.title}</span>}
                      </div>
                      <div className={styles.entryRight}>
                        {(exp.startDate || exp.endDate) && (
                          <span className={styles.entryDate}>{exp.startDate || ""} - {exp.endDate || "至今"}</span>
                        )}
                      </div>
                    </div>
                    {highlights.length > 0 && (
                      <ol className={styles.numberedList}>
                        {highlights.map((h, i) => <li key={i}>{h}</li>)}
                      </ol>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ── Projects ── */}
        {resume.projects && resume.projects.length > 0 && (
          <>
            <div className={styles.sectionHeader}>项目经历</div>
            <div className={styles.sectionContent}>
              {resume.projects.map((project, index) => {
                const descText = getProjectDescription(project, index)
                const { isStar, sections: starSections } = parseStarFormat(descText)
                const bullets = isStar ? [] : splitBullets(descText)

                return (
                  <div key={index} className={styles.entry}>
                    <div className={styles.entryRow}>
                      <div className={styles.entryLeft}>
                        <span className={styles.entryTitle}>{project.name || `项目${index + 1}`}</span>
                        {project.role && <span className={styles.entryMeta}>{project.role}</span>}
                      </div>
                      <div className={styles.entryRight}>
                        {(project.startDate || project.endDate) && (
                          <span className={styles.entryDate}>{project.startDate || ""} - {project.endDate || "至今"}</span>
                        )}
                      </div>
                    </div>
                    {project.techStack && project.techStack.length > 0 && (
                      <div className={styles.techLine}>
                        <span className={styles.techLabel}>技术栈：</span>
                        {project.techStack.join("、")}
                      </div>
                    )}
                    {/* STAR format rendering */}
                    {isStar && starSections.map((sec, si) => {
                      const secLines = sec.content.split("\n").map(l => l.trim()).filter(Boolean)
                      // Filter out numbered prefixes like "1." "2." for action items
                      const cleanLines = secLines.map(l => l.replace(/^\d+[\.、)\）]\s*/, ""))

                      if (sec.type === "action") {
                        return (
                          <div key={si} className={styles.starSection}>
                            <span className={styles.starLabel}>{sec.label}</span>
                            <ol className={styles.numberedList}>
                              {cleanLines.map((line, li) => <li key={li}>{line}</li>)}
                            </ol>
                          </div>
                        )
                      }
                      if (sec.type === "result") {
                        return (
                          <div key={si} className={styles.starSection}>
                            <span className={styles.starLabel}>{sec.label}</span>
                            <div className={styles.starResult}>{cleanLines.join("")}</div>
                          </div>
                        )
                      }
                      // situation / task / context
                      return (
                        <div key={si} className={styles.starSection}>
                          <span className={styles.starLabel}>{sec.label}</span>
                          <span className={styles.starText}>{cleanLines.join("")}</span>
                        </div>
                      )
                    })}
                    {/* Regular bullet rendering */}
                    {bullets.length > 0 && (
                      <div className={styles.projDesc}>
                        {bullets.map((bullet, bulletIndex) => (
                          <div key={bulletIndex} className={styles.bulletItem}>{bullet}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ── Skills ── */}
        {(resume.skills?.length ?? 0) > 0 && (
          <>
            <div className={styles.sectionHeader}>专业技能</div>
            <div className={styles.sectionContent}>
              <ol className={styles.numberedList}>
                {resume.skills!.map((skill, index) => (
                  <li key={index}>{skill}</li>
                ))}
              </ol>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
