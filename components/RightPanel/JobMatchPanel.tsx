"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import styles from "@/css/jobMatchPanel.module.css"
import { MapPin, ExternalLink, Building2 } from "lucide-react"
import IndustrySelector from "@/components/ui/industry-selector"
import { calculateMatchScore, getMatchLevel, getMatchSuggestions } from "@/lib/career-data/skill-matcher"

interface Job {
    id: string
    title: string
    level: string
    experience: string
    salary: string
    education?: string
    skills: string[]
    description: string
    requirements?: string[]
    source: string
    location?: string
    address?: string
    company?: string
    company_size?: string
    job_url?: string
}

interface Props {
    resume: any
}

const LEVEL_LABEL: Record<string, string> = {
    junior: "初级",
    middle: "中级",
    senior: "高级",
}

export default function JobMatchPanel({ resume }: Props) {
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(false)
    const [levelFilter, setLevelFilter] = useState<string>("")
    const [educationFilter, setEducationFilter] = useState<string>("")
    const [fetched, setFetched] = useState(false)
    const [selectedIndustry, setSelectedIndustry] = useState<string>("frontend")

    const rawSkills: string[] = resume?.skills || []

    // Resume skills may be long sentences like "熟悉C和Java语言，具备良好的编码习惯".
    // Extract known tech keywords so they can match against job skill tags.
    const TECH_KEYWORDS = [
        "React","Vue","Vue3","Angular","Svelte","Next.js","Nuxt",
        "TypeScript","JavaScript","ES6","HTML","CSS","Sass","Less","Tailwind",
        "Node.js","Express","Koa","Nest","Spring","Spring Boot","SpringMVC","Mybatis",
        "Java","Python","Go","Rust","C++","C#","PHP","Ruby","Swift","Kotlin",
        "MySQL","PostgreSQL","MongoDB","Redis","SQLite","SQL",
        "Webpack","Vite","Rollup","Babel","ESLint","Jest","Cypress","Vitest",
        "Docker","Kubernetes","Linux","Nginx","Git","Maven","Gradle",
        "AWS","Vercel","Supabase","Firebase",
        "GraphQL","REST","gRPC","WebSocket",
        "Electron","React Native","Flutter","UniApp","Taro",
        "Postman","Axure","Figma","Sketch",
    ]

    const extractedSkills: string[] = useMemo(() => {
        const found = new Set<string>()
        const combined = rawSkills.join(" ")
        for (const kw of TECH_KEYWORDS) {
            if (combined.toLowerCase().includes(kw.toLowerCase())) {
                found.add(kw)
            }
        }
        // Also keep any short raw skills (≤20 chars) that look like tech tags
        for (const s of rawSkills) {
            if (s.length <= 20 && /^[a-zA-Z0-9.#+\-_/ ]+$/.test(s)) {
                found.add(s)
            }
        }
        return Array.from(found)
    }, [rawSkills.join(",")])

    // Use extracted keywords for API; fall back to raw if nothing extracted
    const effectiveSkills = extractedSkills.length > 0 ? extractedSkills : rawSkills
    const skillsKey = effectiveSkills.join(",")

    const fetchJobs = useCallback(async (skills: string[], level: string, industry: string) => {
        if (skills.length === 0) return
        setLoading(true)
        try {
            // 使用新的行业 API
            const params = new URLSearchParams()
            params.set("industry", industry)
            params.set("limit", "30")
            if (level) params.set("level", level)

            const res = await fetch(`/api/jobs?${params}`)
            if (res.ok) {
                const data = await res.json()
                setJobs(data.jobs || [])
                setFetched(true)
            }
        } catch (err) {
            console.error("[JobMatch] Fetch failed:", err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (skillsKey) {
            console.log('[JobMatch] Fetching jobs for industry:', selectedIndustry, 'skills:', effectiveSkills)
            fetchJobs(effectiveSkills, levelFilter, selectedIndustry)
        }
    }, [skillsKey, levelFilter, selectedIndustry, fetchJobs])
    
    // 添加手动刷新功能
    const handleRefresh = useCallback(() => {
        console.log('[JobMatch] Manual refresh triggered')
        setFetched(false) // 重置状态以触发重新获取
        fetchJobs(effectiveSkills, levelFilter, selectedIndustry)
    }, [effectiveSkills, levelFilter, selectedIndustry, fetchJobs])
    function getMatchScore(job: Job): { score: number; matched: string[]; missing: string[] } {
        // 使用智能技能匹配算法
        return calculateMatchScore(effectiveSkills, job.skills, selectedIndustry)
    }

    // Apply education filter client-side (no need for extra API param)
    const sortedJobs = [...jobs]
        .filter(j => !educationFilter || (j.education || "").includes(educationFilter))
        .sort((a, b) => getMatchScore(b).score - getMatchScore(a).score)

    const avgScore = sortedJobs.length > 0
        ? Math.round(sortedJobs.reduce((sum, j) => sum + getMatchScore(j).score, 0) / sortedJobs.length)
        : 0

    const highMatchCount = sortedJobs.filter(j => getMatchScore(j).score >= 70).length

    if (!resume) {
        return (
            <div className={styles.panel}>
                <h2>岗位匹配</h2>
                <p className={styles.subTitle}>AI Career Assistant</p>
                <div className={styles.empty}>
                    <h3>📋</h3>
                    <p>请先上传简历<br/>分析完成后将为你推荐匹配岗位</p>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.panel}>
            <h2>岗位匹配</h2>
            <p className={styles.subTitle}>AI Career Assistant</p>

            {/* 行业选择器 */}
            <div style={{ marginBottom: "12px" }}>
                <IndustrySelector 
                    value={selectedIndustry} 
                    onChange={setSelectedIndustry} 
                />
            </div>

            {fetched && sortedJobs.length > 0 && (
                <div className={styles.summary}>
                    <div className={styles.summaryScore}>{avgScore}%</div>
                    <div className={styles.summaryText}>
                        共 <strong>{sortedJobs.length}</strong> 个匹配岗位<br/>
                        高匹配（≥70%）：<strong>{highMatchCount}</strong> 个
                    </div>
                </div>
            )}

            <div className={styles.toolbar}>
                {[
                    { key: "", label: "全部级别" },
                    { key: "junior", label: "初级" },
                    { key: "middle", label: "中级" },
                    { key: "senior", label: "高级" },
                ].map(item => (
                    <button
                        key={item.key}
                        className={levelFilter === item.key ? styles.active : ""}
                        onClick={() => setLevelFilter(item.key)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            <div className={styles.toolbar} style={{ marginBottom: 10 }}>
                {[
                    { key: "", label: "不限学历" },
                    { key: "大专", label: "大专" },
                    { key: "本科", label: "本科" },
                    { key: "硕士", label: "硕士" },
                ].map(item => (
                    <button
                        key={item.key}
                        className={educationFilter === item.key ? styles.active : ""}
                        onClick={() => setEducationFilter(item.key)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className={styles.loading}>⏳ 正在匹配岗位...</div>
            ) : sortedJobs.length === 0 && fetched ? (
                <div className={styles.empty}>
                    <h3>😕</h3>
                    <p>暂无匹配岗位<br/>试试调整筛选条件</p>
                </div>
            ) : (
                sortedJobs.map((job, idx) => {
                    const { score, matched, missing } = getMatchScore(job)
                    const badgeClass = score >= 70 ? styles.matchHigh : score >= 40 ? styles.matchMid : styles.matchLow

                    return (
                        <div key={job.id || `${job.title}-${idx}`} className={styles.jobCard}>
                            <div className={styles.jobHeader}>
                                <div>
                                    <h3 className={styles.jobTitle}>{job.title}</h3>
                                    {job.company && (
                                        <div className={styles.companyInfo}>
                                            <Building2 className={styles.companyIcon} />
                                            <span>{job.company}</span>
                                            {job.company_size && <span className={styles.companySize}>({job.company_size})</span>}
                                        </div>
                                    )}
                                    {job.address && (
                                        <div className={styles.locationInfo}>
                                            <MapPin className={styles.locationIcon} />
                                            <span>{job.address}</span>
                                        </div>
                                    )}
                                </div>
                                <span className={`${styles.matchBadge} ${badgeClass}`}>
                                    {score}%
                                </span>
                            </div>

                            <div className={styles.jobMeta}>
                                <span className={styles.metaTag}>{LEVEL_LABEL[job.level] || job.level}</span>
                                <span className={styles.metaTag}>{job.experience}</span>
                                <span className={`${styles.metaTag} ${styles.salary}`}>{job.salary}</span>
                                {job.education && <span className={styles.metaTag}>🎓 {job.education}</span>}
                            </div>

                            <div className={styles.jobSkills}>
                                {matched.map(s => (
                                    <span key={s} className={`${styles.skillTag} ${styles.skillMatched}`}>✓ {s}</span>
                                ))}
                                {missing.map(s => (
                                    <span key={s} className={`${styles.skillTag} ${styles.skillMissing}`}>✗ {s}</span>
                                ))}
                            </div>

                            {/* 智能匹配建议 */}
                            {getMatchSuggestions(effectiveSkills, job.skills, selectedIndustry).length > 0 && (
                                <div style={{ 
                                    marginTop: "8px", 
                                    padding: "8px", 
                                    background: "#f0f9ff", 
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    color: "#0369a1"
                                }}>
                                    {getMatchSuggestions(effectiveSkills, job.skills, selectedIndustry).map((suggestion, idx) => (
                                        <div key={idx} style={{ marginTop: idx > 0 ? "4px" : 0 }}>
                                            {suggestion}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {job.requirements && job.requirements.length > 0 && (
                                <div className={styles.requirements}>
                                    <div className={styles.requirementsTitle}>招聘要求</div>
                                    <ul className={styles.requirementsList}>
                                        {job.requirements.map((r, i) => (
                                            <li key={i}>{r}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {job.job_url && (
                                <a
                                    href={job.job_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.applyButton}
                                >
                                    查看详情 <ExternalLink style={{ width: 12, height: 12, display: "inline", marginLeft: 4 }} />
                                </a>
                            )}
                        </div>
                    )
                })
            )}

            {resume && (
                <button className={styles.refreshBtn} onClick={handleRefresh} disabled={loading}>
                    {loading ? "⏳ 匹配中..." : "🔄 重新匹配"}
                </button>
            )}
        </div>
    )
}
