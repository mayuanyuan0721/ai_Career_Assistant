"use client"

import { useState, useEffect, useCallback } from "react"
import styles from "@/css/jobMatchPanel.module.css"
import { MapPin, ExternalLink, Building2 } from "lucide-react"

interface Job {
    id: string
    title: string
    level: string
    experience: string
    salary: string
    skills: string[]
    description: string
    source: string
    location?: string
    address?: string
    company?: string
    company_size?: string
    job_url?: string
    requirements?: string[]
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
    const [fetched, setFetched] = useState(false)
    const [selectedJob, setSelectedJob] = useState<Job | null>(null)

    const userSkills: string[] = resume?.skills || []

    const fetchJobs = useCallback(async () => {
        if (userSkills.length === 0) return
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.set("skills", userSkills.join(","))
            params.set("limit", "30")
            if (levelFilter) params.set("level", levelFilter)

            const res = await fetch(`/api/career/jobs?${params}`)
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
    }, [userSkills, levelFilter])

    useEffect(() => {
        if (userSkills.length > 0) {
            fetchJobs()
        }
    }, [userSkills.length, levelFilter])

    function getMatchScore(job: Job): { score: number; matched: string[]; missing: string[] } {
        if (userSkills.length === 0) return { score: 0, matched: [], missing: job.skills }
        const userSet = new Set(userSkills.map(s => s.toLowerCase()))
        const matched = job.skills.filter(s => userSet.has(s.toLowerCase()))
        const missing = job.skills.filter(s => !userSet.has(s.toLowerCase()))
        const score = Math.round((matched.length / job.skills.length) * 100)
        return { score, matched, missing }
    }

    const sortedJobs = [...jobs].sort((a, b) => {
        return getMatchScore(b).score - getMatchScore(a).score
    })

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
                    { key: "", label: "全部" },
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
                                    {job.location && (
                                        <div className={styles.locationInfo}>
                                            <MapPin className={styles.locationIcon} />
                                            <span>{job.location}</span>
                                            {job.address && <span className={styles.address}>{job.address}</span>}
                                        </div>
                                    )}
                                </div>
                                <span className={`${styles.matchBadge} ${badgeClass}`}>
                                    {score}%
                                </span>
                            </div>

                            <div className={styles.jobMeta}>
                                <span className={styles.metaTag}>
                                    {LEVEL_LABEL[job.level] || job.level}
                                </span>
                                <span className={styles.metaTag}>{job.experience}</span>
                                <span className={`${styles.metaTag} ${styles.salary}`}>{job.salary}</span>
                            </div>

                            <div className={styles.jobSkills}>
                                {matched.map(s => (
                                    <span key={s} className={`${styles.skillTag} ${styles.skillMatched}`}>
                                        ✓ {s}
                                    </span>
                                ))}
                                {missing.map(s => (
                                    <span key={s} className={`${styles.skillTag} ${styles.skillMatched}`}>
                                        {s}
                                    </span>
                                ))}
                            </div>

                            {job.description && (
                                <button 
                                    onClick={() => setSelectedJob(job)}
                                    className={styles.applyButton}
                                >
                                    查看详情
                                </button>
                            )}
                        </div>
                    )
                })
            )}

            {resume && (
                <button className={styles.refreshBtn} onClick={fetchJobs} disabled={loading}>
                    {loading ? "⏳ 匹配中..." : "🔄 重新匹配"}
                </button>
            )}
        </div>
    )
}
