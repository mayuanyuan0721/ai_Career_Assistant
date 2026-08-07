"use client"

import { useState } from "react"

interface Props {
    resume: any
}

interface TranslateResult {
    current_background?: {
        industry?: string
        role?: string
        transferable_skills?: Array<{ skill: string; evidence?: string }>
    }
    target?: {
        field?: string
        role?: string
    }
    skill_translation?: Array<{
        original_term: string
        original_context?: string
        translated_term: string
        translated_context?: string
        category?: string
    }>
    gap_analysis?: {
        missing_skills?: Array<{ skill: string; priority?: string; learning_path?: string }>
        bridge_experiences?: Array<{ experience: string; purpose?: string }>
    }
    narrative?: {
        discovery_moment?: string
        connection_bridge?: string
        action_proof?: string
        future_vision?: string
    }
    _raw?: boolean
    summary?: string
}

const INDUSTRY_OPTIONS = [
    { value: "tech", label: "互联网/科技" },
    { value: "finance", label: "金融/银行" },
    { value: "education", label: "教育/培训" },
    { value: "consulting", label: "咨询/服务" },
    { value: "manufacturing", label: "制造/工业" },
    { value: "healthcare", label: "医疗/健康" },
    { value: "retail", label: "零售/电商" },
    { value: "media", label: "媒体/内容" },
]

const ROLE_SUGGESTIONS: Record<string, string[]> = {
    tech: ["前端工程师", "后端工程师", "全栈工程师", "产品经理", "UI/UX 设计师"],
    finance: ["数据分析师", "风控工程师", "量化开发", "金融产品经理"],
    education: ["课程设计师", "教育产品经理", "培训讲师", "教学研究员"],
    consulting: ["咨询顾问", "解决方案架构师", "项目经理", "业务分析师"],
    manufacturing: ["系统工程师", "项目经理", "数据分析师", "产品经理"],
    healthcare: ["健康产品经理", "数据分析师", "项目经理"],
    retail: ["电商运营", "产品经理", "数据分析师", "用户研究员"],
    media: ["内容运营", "产品经理", "前端工程师", "数据分析师"],
}

export default function CareerTranslatorPanel({ resume }: Props) {
    const [targetIndustry, setTargetIndustry] = useState("")
    const [targetRole, setTargetRole] = useState("")
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<TranslateResult | null>(null)
    const [error, setError] = useState("")

    const handleTranslate = async () => {
        if (!targetIndustry || !targetRole) return
        setLoading(true)
        setError("")
        setResult(null)
        try {
            const res = await fetch("/api/career/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resume, targetIndustry, targetRole }),
            })
            if (!res.ok) throw new Error("请求失败")
            const data = await res.json()
            setResult(data.data)
        } catch (err: any) {
            setError(err.message || "翻译失败")
        } finally {
            setLoading(false)
        }
    }

    const priorityColor = (p?: string) => {
        if (p === "high" || p === "必须") return "#dc2626"
        if (p === "medium" || p === "重要") return "#ca8a04"
        return "#6b7280"
    }

    if (!resume) {
        return (
            <div style={{ padding: 24, textAlign: "center", color: "#666" }}>
                <h2 style={{ marginBottom: 8 }}>转行翻译</h2>
                <p style={{ marginTop: 40 }}>请先上传简历<br />然后选择目标行业进行技能翻译</p>
            </div>
        )
    }

    return (
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, height: "100%", overflow: "auto" }}>
            <div>
                <h2 style={{ margin: 0, fontSize: 16 }}>转行翻译</h2>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>
                    将你的技能翻译为目标行业的语言
                </p>
            </div>

            {/* 目标行业选择 */}
            <div>
                <div style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>目标行业</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {INDUSTRY_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => { setTargetIndustry(opt.label); setTargetRole("") }}
                            style={{
                                padding: "4px 10px",
                                fontSize: 12,
                                background: targetIndustry === opt.label ? "#2563eb" : "#f3f4f6",
                                color: targetIndustry === opt.label ? "#fff" : "#555",
                                border: "none",
                                borderRadius: 4,
                                cursor: "pointer",
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 目标岗位选择 */}
            {targetIndustry && (
                <div>
                    <div style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>目标岗位</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {(ROLE_SUGGESTIONS[targetIndustry] || ["自定义岗位"]).map((role) => (
                            <button
                                key={role}
                                onClick={() => setTargetRole(role)}
                                style={{
                                    padding: "4px 10px",
                                    fontSize: 12,
                                    background: targetRole === role ? "#2563eb" : "#f3f4f6",
                                    color: targetRole === role ? "#fff" : "#555",
                                    border: "none",
                                    borderRadius: 4,
                                    cursor: "pointer",
                                }}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <button
                onClick={handleTranslate}
                disabled={loading || !targetIndustry || !targetRole}
                style={{
                    padding: "8px 16px",
                    background: loading || !targetIndustry || !targetRole ? "#e5e7eb" : "#2563eb",
                    color: loading || !targetIndustry || !targetRole ? "#9ca3af" : "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: loading || !targetIndustry || !targetRole ? "not-allowed" : "pointer",
                }}
            >
                {loading ? "翻译中..." : "开始翻译"}
            </button>

            {error && (
                <div style={{ padding: 10, background: "#fef2f2", color: "#dc2626", borderRadius: 6, fontSize: 13 }}>
                    {error}
                </div>
            )}

            {result && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
                    {/* 可迁移技能 */}
                    {result.current_background?.transferable_skills?.length ? (
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>你的可迁移技能</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {result.current_background.transferable_skills.map((s, i) => (
                                    <span key={i} style={{
                                        padding: "3px 8px",
                                        background: "#eff6ff",
                                        color: "#2563eb",
                                        borderRadius: 4,
                                        fontSize: 12,
                                    }}>
                                        {s.skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {/* 技能翻译对照表 */}
                    {result.skill_translation?.length ? (
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>技能翻译对照</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {result.skill_translation.map((t, i) => (
                                    <div key={i} style={{
                                        padding: 10,
                                        background: "#f8fafc",
                                        borderRadius: 6,
                                        display: "flex",
                                        gap: 8,
                                        alignItems: "center",
                                        fontSize: 12,
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 500 }}>{t.original_term}</div>
                                            {t.original_context && <div style={{ color: "#888", fontSize: 11 }}>{t.original_context}</div>}
                                        </div>
                                        <div style={{ color: "#2563eb", fontSize: 16 }}>→</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 500, color: "#2563eb" }}>{t.translated_term}</div>
                                            {t.translated_context && <div style={{ color: "#888", fontSize: 11 }}>{t.translated_context}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {/* 差距分析 */}
                    {result.gap_analysis && (
                        <div>
                            {result.gap_analysis.missing_skills?.length ? (
                                <>
                                    <div style={{ fontWeight: 600, marginBottom: 6 }}>需要补充的技能</div>
                                    {result.gap_analysis.missing_skills.map((s, i) => (
                                        <div key={i} style={{
                                            padding: "6px 0",
                                            borderBottom: i < (result.gap_analysis?.missing_skills?.length || 0) - 1 ? "1px solid #f3f4f6" : "none",
                                            fontSize: 12,
                                        }}>
                                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                                <span style={{
                                                    width: 6,
                                                    height: 6,
                                                    borderRadius: "50%",
                                                    background: priorityColor(s.priority),
                                                    flexShrink: 0,
                                                }} />
                                                <strong>{s.skill}</strong>
                                                {s.priority && <span style={{ color: priorityColor(s.priority), fontSize: 11 }}>({s.priority})</span>}
                                            </div>
                                            {s.learning_path && <div style={{ color: "#666", marginTop: 2, paddingLeft: 12 }}>{s.learning_path}</div>}
                                        </div>
                                    ))}
                                </>
                            ) : null}
                            {result.gap_analysis.bridge_experiences?.length ? (
                                <>
                                    <div style={{ fontWeight: 600, marginTop: 10, marginBottom: 6 }}>桥梁经历建议</div>
                                    {result.gap_analysis.bridge_experiences.map((e, i) => (
                                        <div key={i} style={{ fontSize: 12, padding: "4px 0" }}>
                                            • {e.experience}
                                            {e.purpose && <span style={{ color: "#888" }}> — {e.purpose}</span>}
                                        </div>
                                    ))}
                                </>
                            ) : null}
                        </div>
                    )}

                    {/* 转行叙事 */}
                    {result.narrative && (
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>转行故事框架</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {result.narrative.discovery_moment && (
                                    <div style={{ padding: 8, background: "#eff6ff", borderRadius: 4, fontSize: 12 }}>
                                        <strong style={{ color: "#2563eb" }}>发现：</strong>{result.narrative.discovery_moment}
                                    </div>
                                )}
                                {result.narrative.connection_bridge && (
                                    <div style={{ padding: 8, background: "#f0fdf4", borderRadius: 4, fontSize: 12 }}>
                                        <strong style={{ color: "#16a34a" }}>连接：</strong>{result.narrative.connection_bridge}
                                    </div>
                                )}
                                {result.narrative.action_proof && (
                                    <div style={{ padding: 8, background: "#fefce8", borderRadius: 4, fontSize: 12 }}>
                                        <strong style={{ color: "#ca8a04" }}>行动：</strong>{result.narrative.action_proof}
                                    </div>
                                )}
                                {result.narrative.future_vision && (
                                    <div style={{ padding: 8, background: "#fdf4ff", borderRadius: 4, fontSize: 12 }}>
                                        <strong style={{ color: "#a855f7" }}>愿景：</strong>{result.narrative.future_vision}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 原始输出 fallback */}
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
