"use client"

import { useState } from "react"

interface Props {
    resume: any
}

interface JDAnalysisResult {
    job_info?: {
        title?: string
        company?: string
        location?: string
        salary?: string
        level?: string
    }
    match_score?: {
        total?: number
        required_score?: number
        preferred_score?: number
        level?: string
        recommendation?: string
    }
    requirements_breakdown?: {
        required?: Array<{ skill: string; matched: boolean; evidence?: string; count_in_jd?: number }>
        preferred?: Array<{ skill: string; matched: boolean; suggestion?: string }>
    }
    strengths_to_emphasize?: Array<{ point: string; why: string }>
    gaps_to_address?: {
        critical?: Array<{ gap: string; strategy?: string }>
        major?: Array<{ gap: string; strategy?: string }>
        minor?: Array<{ gap: string; strategy?: string }>
    }
    red_flags?: {
        warnings?: Array<{ type: string; signal: string; interpretation?: string; severity?: string }>
        positive_signals?: string[]
    }
    resume_customization?: {
        summary_rewrite?: string
        keywords_to_add?: Array<{ keyword: string; place_in?: string }>
    }
    _raw?: boolean
    summary?: string
}

export default function JDAnalysisPanel({ resume }: Props) {
    const [jd, setJd] = useState("")
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<JDAnalysisResult | null>(null)
    const [error, setError] = useState("")

    const handleAnalyze = async () => {
        if (!jd.trim()) return
        setLoading(true)
        setError("")
        setResult(null)
        try {
            const res = await fetch("/api/career/analyze-jd", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jd, resume }),
            })
            if (!res.ok) throw new Error("请求失败")
            const data = await res.json()
            setResult(data.data)
        } catch (err: any) {
            setError(err.message || "分析失败")
        } finally {
            setLoading(false)
        }
    }

    const scoreColor = (score: number) =>
        score >= 75 ? "#16a34a" : score >= 60 ? "#ca8a04" : "#dc2626"

    const scoreBg = (score: number) =>
        score >= 75 ? "#f0fdf4" : score >= 60 ? "#fefce8" : "#fef2f2"

    if (!resume) {
        return (
            <div style={{ padding: 24, textAlign: "center", color: "#666" }}>
                <h2 style={{ marginBottom: 8 }}>JD 分析</h2>
                <p style={{ marginTop: 40 }}>请先上传简历<br />然后粘贴岗位 JD 进行匹配分析</p>
            </div>
        )
    }

    return (
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, height: "100%", overflow: "auto" }}>
            <div>
                <h2 style={{ margin: 0, fontSize: 16 }}>JD 分析</h2>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>粘贴岗位 JD，分析匹配度与定制策略</p>
            </div>

            <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="粘贴完整的岗位 JD 内容...&#10;&#10;包括：岗位职责、任职要求、优先条件等"
                style={{
                    width: "100%",
                    minHeight: 120,
                    padding: 10,
                    border: "1px solid #e5e7eb",
                    borderRadius: 6,
                    fontSize: 13,
                    resize: "vertical",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                }}
            />

            <button
                onClick={handleAnalyze}
                disabled={loading || !jd.trim()}
                style={{
                    padding: "8px 16px",
                    background: loading || !jd.trim() ? "#e5e7eb" : "#2563eb",
                    color: loading || !jd.trim() ? "#9ca3af" : "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: loading || !jd.trim() ? "not-allowed" : "pointer",
                }}
            >
                {loading ? "分析中..." : "开始分析"}
            </button>

            {error && (
                <div style={{ padding: 10, background: "#fef2f2", color: "#dc2626", borderRadius: 6, fontSize: 13 }}>
                    {error}
                </div>
            )}

            {result && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {/* 匹配评分 */}
                    {result.match_score && (
                        <div style={{
                            padding: 14,
                            background: scoreBg(result.match_score.total || 0),
                            borderRadius: 8,
                            border: `1px solid ${scoreColor(result.match_score.total || 0)}33`,
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 13, color: "#555" }}>匹配度</span>
                                <span style={{
                                    fontSize: 28,
                                    fontWeight: 700,
                                    color: scoreColor(result.match_score.total || 0),
                                }}>
                                    {result.match_score.total || 0}%
                                </span>
                            </div>
                            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                                {result.match_score.level} — {result.match_score.recommendation}
                            </div>
                            {(result.match_score.required_score != null || result.match_score.preferred_score != null) && (
                                <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 12 }}>
                                    {result.match_score.required_score != null && (
                                        <span>必须技能: <strong>{result.match_score.required_score}%</strong></span>
                                    )}
                                    {result.match_score.preferred_score != null && (
                                        <span>优先技能: <strong>{result.match_score.preferred_score}%</strong></span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 岗位信息 */}
                    {result.job_info && (result.job_info.title || result.job_info.company) && (
                        <div style={{ padding: 12, background: "#f8fafc", borderRadius: 6, fontSize: 13 }}>
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>
                                {result.job_info.title} {result.job_info.company && `@ ${result.job_info.company}`}
                            </div>
                            <div style={{ color: "#666", fontSize: 12 }}>
                                {[result.job_info.location, result.job_info.salary, result.job_info.level]
                                    .filter(Boolean).join(" · ")}
                            </div>
                        </div>
                    )}

                    {/* 要求分解 */}
                    {result.requirements_breakdown && (
                        <div style={{ fontSize: 13 }}>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>要求匹配明细</div>
                            {result.requirements_breakdown.required?.map((r, i) => (
                                <div key={`req-${i}`} style={{
                                    padding: "4px 0",
                                    display: "flex",
                                    gap: 6,
                                    alignItems: "flex-start",
                                    fontSize: 12,
                                }}>
                                    <span style={{ color: r.matched ? "#16a34a" : "#dc2626", flexShrink: 0 }}>
                                        {r.matched ? "✓" : "✗"}
                                    </span>
                                    <span>{r.skill}</span>
                                    {r.evidence && <span style={{ color: "#888" }}>— {r.evidence}</span>}
                                </div>
                            ))}
                            {result.requirements_breakdown.preferred?.filter(p => !p.matched).map((p, i) => (
                                <div key={`pref-${i}`} style={{
                                    padding: "4px 0",
                                    display: "flex",
                                    gap: 6,
                                    alignItems: "flex-start",
                                    fontSize: 12,
                                    color: "#ca8a04",
                                }}>
                                    <span style={{ flexShrink: 0 }}>△</span>
                                    <span>{p.skill}</span>
                                    {p.suggestion && <span style={{ color: "#888" }}>— {p.suggestion}</span>}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 差距分析 */}
                    {result.gaps_to_address && (
                        <div style={{ fontSize: 13 }}>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>差距与应对</div>
                            {["critical", "major", "minor"].map((level) => {
                                const gaps = (result.gaps_to_address as any)[level]
                                if (!gaps?.length) return null
                                const labels: Record<string, string> = { critical: "致命", major: "重要", minor: "轻微" }
                                const colors: Record<string, string> = { critical: "#dc2626", major: "#ca8a04", minor: "#6b7280" }
                                return (
                                    <div key={level} style={{ marginBottom: 6 }}>
                                        <div style={{ fontSize: 11, color: colors[level], fontWeight: 600 }}>{labels[level]}</div>
                                        {gaps.map((g: any, i: number) => (
                                            <div key={i} style={{ fontSize: 12, padding: "2px 0" }}>
                                                {g.gap} {g.strategy && <span style={{ color: "#888" }}>→ {g.strategy}</span>}
                                            </div>
                                        ))}
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* 红旗检测 */}
                    {result.red_flags && (
                        <div style={{ fontSize: 13 }}>
                            {result.red_flags.warnings && result.red_flags.warnings.length > 0 && (
                                <div style={{ marginBottom: 6 }}>
                                    <div style={{ fontWeight: 600, marginBottom: 4, color: "#dc2626" }}>警告信号</div>
                                    {result.red_flags.warnings.map((w, i) => (
                                        <div key={i} style={{
                                            padding: "6px 8px",
                                            background: "#fef2f2",
                                            borderRadius: 4,
                                            marginBottom: 4,
                                            fontSize: 12,
                                        }}>
                                            <div style={{ fontWeight: 500 }}>"{w.signal}"</div>
                                            {w.interpretation && <div style={{ color: "#666", marginTop: 2 }}>{w.interpretation}</div>}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {result.red_flags.positive_signals && result.red_flags.positive_signals.length > 0 && (
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: 4, color: "#16a34a" }}>正面信号</div>
                                    {result.red_flags.positive_signals.map((s, i) => (
                                        <div key={i} style={{ fontSize: 12, padding: "2px 0", color: "#15803d" }}>✓ {s}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 简历定制建议 */}
                    {result.resume_customization?.summary_rewrite && (
                        <div style={{ fontSize: 13 }}>
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>个人简介改写建议</div>
                            <div style={{
                                padding: 10,
                                background: "#eff6ff",
                                borderRadius: 6,
                                fontSize: 12,
                                lineHeight: 1.6,
                                color: "#1e40af",
                            }}>
                                {result.resume_customization.summary_rewrite}
                            </div>
                        </div>
                    )}

                    {/* 原始输出（fallback） */}
                    {result._raw && result.summary && (
                        <div style={{
                            padding: 12,
                            background: "#f9fafb",
                            borderRadius: 6,
                            fontSize: 12,
                            lineHeight: 1.6,
                            whiteSpace: "pre-wrap",
                        }}>
                            {result.summary}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
