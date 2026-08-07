"use client"

import { useState } from "react"

interface Props {
    resume: any
}

interface InterviewPrepResult {
    role_analysis?: {
        target_position?: string
        target_company?: string
        key_competencies?: Array<{ competency: string; evidence_from_jd?: string }>
    }
    predicted_questions?: {
        high_probability?: Array<{ question: string; use_story?: string; answer_strategy?: string }>
        medium_probability?: Array<{ question: string; category?: string }>
    }
    star_story_bank?: Array<{
        name: string
        use_for?: string[]
        star?: { situation: string; task: string; action: string; result: string }
        full_version?: string
        short_version?: string
        one_liner?: string
    }>
    self_introduction?: {
        tailored_pitch?: string
        key_points?: string[]
    }
    questions_to_ask?: {
        for_hiring_manager?: string[]
        for_team_members?: string[]
    }
    difficult_questions_prep?: Array<{
        question: string
        formula?: string
        sample_answer?: string
    }>
    _raw?: boolean
    summary?: string
}

type Tab = "stories" | "questions" | "intro" | "tips"

export default function InterviewPrepPanel({ resume }: Props) {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<InterviewPrepResult | null>(null)
    const [error, setError] = useState("")
    const [activeTab, setActiveTab] = useState<Tab>("stories")
    const [expandedStory, setExpandedStory] = useState<number | null>(null)

    const handleGenerate = async () => {
        if (!resume) return
        setLoading(true)
        setError("")
        setResult(null)
        try {
            const res = await fetch("/api/career/interview-prep", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resume, industry: "frontend" }),
            })
            if (!res.ok) throw new Error("请求失败")
            const data = await res.json()
            setResult(data.data)
        } catch (err: any) {
            setError(err.message || "生成失败")
        } finally {
            setLoading(false)
        }
    }

    const tabs: { key: Tab; label: string }[] = [
        { key: "stories", label: "STAR 故事" },
        { key: "questions", label: "预测问题" },
        { key: "intro", label: "自我介绍" },
        { key: "tips", label: "应对技巧" },
    ]

    if (!resume) {
        return (
            <div style={{ padding: 24, textAlign: "center", color: "#666" }}>
                <h2 style={{ marginBottom: 8 }}>面试准备</h2>
                <p style={{ marginTop: 40 }}>请先上传简历<br />然后生成面试准备材料</p>
            </div>
        )
    }

    return (
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, height: "100%", overflow: "auto" }}>
            <div>
                <h2 style={{ margin: 0, fontSize: 16 }}>面试准备</h2>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>
                    基于简历生成 STAR 故事、预测问题和回答策略
                </p>
            </div>

            {!result && (
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    style={{
                        padding: "8px 16px",
                        background: loading ? "#e5e7eb" : "#2563eb",
                        color: loading ? "#9ca3af" : "#fff",
                        border: "none",
                        borderRadius: 6,
                        fontSize: 13,
                        cursor: loading ? "not-allowed" : "pointer",
                    }}
                >
                    {loading ? "生成中..." : "生成面试准备材料"}
                </button>
            )}

            {error && (
                <div style={{ padding: 10, background: "#fef2f2", color: "#dc2626", borderRadius: 6, fontSize: 13 }}>
                    {error}
                </div>
            )}

            {result && (
                <>
                    {/* Tab 切换 */}
                    <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #e5e7eb", paddingBottom: 4 }}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    padding: "4px 10px",
                                    fontSize: 12,
                                    background: activeTab === tab.key ? "#2563eb" : "transparent",
                                    color: activeTab === tab.key ? "#fff" : "#555",
                                    border: "none",
                                    borderRadius: 4,
                                    cursor: "pointer",
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                        <button
                            onClick={() => { setResult(null); setActiveTab("stories") }}
                            style={{
                                marginLeft: "auto",
                                padding: "4px 8px",
                                fontSize: 11,
                                background: "transparent",
                                color: "#888",
                                border: "1px solid #e5e7eb",
                                borderRadius: 4,
                                cursor: "pointer",
                            }}
                        >
                            重新生成
                        </button>
                    </div>

                    {/* STAR 故事银行 */}
                    {activeTab === "stories" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {result.star_story_bank?.length ? (
                                result.star_story_bank.map((story, i) => (
                                    <div key={i} style={{
                                        padding: 12,
                                        background: "#f8fafc",
                                        borderRadius: 6,
                                        border: "1px solid #e5e7eb",
                                    }}>
                                        <div
                                            style={{ fontWeight: 600, fontSize: 13, cursor: "pointer", marginBottom: expandedStory === i ? 8 : 0 }}
                                            onClick={() => setExpandedStory(expandedStory === i ? null : i)}
                                        >
                                            {story.name} {expandedStory === i ? "▾" : "▸"}
                                        </div>
                                        {story.use_for && (
                                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                                                {story.use_for.map((tag, j) => (
                                                    <span key={j} style={{
                                                        padding: "1px 6px",
                                                        background: "#eff6ff",
                                                        color: "#2563eb",
                                                        borderRadius: 3,
                                                        fontSize: 11,
                                                    }}>
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {expandedStory === i && story.star && (
                                            <div style={{ fontSize: 12, lineHeight: 1.7 }}>
                                                <div style={{ marginBottom: 4 }}>
                                                    <strong style={{ color: "#2563eb" }}>S 情境：</strong>{story.star.situation}
                                                </div>
                                                <div style={{ marginBottom: 4 }}>
                                                    <strong style={{ color: "#2563eb" }}>T 任务：</strong>{story.star.task}
                                                </div>
                                                <div style={{ marginBottom: 4 }}>
                                                    <strong style={{ color: "#2563eb" }}>A 行动：</strong>{story.star.action}
                                                </div>
                                                <div>
                                                    <strong style={{ color: "#16a34a" }}>R 结果：</strong>{story.star.result}
                                                </div>
                                                {story.short_version && (
                                                    <div style={{ marginTop: 8, padding: 8, background: "#fff", borderRadius: 4, border: "1px solid #e5e7eb" }}>
                                                        <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>60 秒精简版</div>
                                                        <div>{story.short_version}</div>
                                                    </div>
                                                )}
                                                {story.one_liner && (
                                                    <div style={{ marginTop: 6, padding: 8, background: "#fff", borderRadius: 4, border: "1px solid #e5e7eb" }}>
                                                        <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>15 秒一句话版</div>
                                                        <div>{story.one_liner}</div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div style={{ fontSize: 12, color: "#888" }}>暂无故事数据</div>
                            )}
                        </div>
                    )}

                    {/* 预测问题 */}
                    {activeTab === "questions" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {result.predicted_questions?.high_probability?.length ? (
                                <>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: "#dc2626" }}>高概率问题</div>
                                    {result.predicted_questions.high_probability.map((q, i) => (
                                        <div key={i} style={{
                                            padding: 10,
                                            background: "#fef2f2",
                                            borderRadius: 6,
                                            fontSize: 12,
                                        }}>
                                            <div style={{ fontWeight: 500, marginBottom: 4 }}>{q.question}</div>
                                            {q.use_story && <div style={{ color: "#888" }}>使用故事：{q.use_story}</div>}
                                            {q.answer_strategy && <div style={{ color: "#666", marginTop: 2 }}>策略：{q.answer_strategy}</div>}
                                        </div>
                                    ))}
                                </>
                            ) : null}
                            {result.predicted_questions?.medium_probability?.length ? (
                                <>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: "#ca8a04", marginTop: 8 }}>中概率问题</div>
                                    {result.predicted_questions.medium_probability.map((q, i) => (
                                        <div key={i} style={{
                                            padding: 8,
                                            background: "#fefce8",
                                            borderRadius: 6,
                                            fontSize: 12,
                                        }}>
                                            {q.question}
                                            {q.category && <span style={{ color: "#888", marginLeft: 6 }}>({q.category})</span>}
                                        </div>
                                    ))}
                                </>
                            ) : null}
                        </div>
                    )}

                    {/* 自我介绍 */}
                    {activeTab === "intro" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {result.self_introduction?.tailored_pitch && (
                                <div style={{
                                    padding: 12,
                                    background: "#eff6ff",
                                    borderRadius: 6,
                                    fontSize: 13,
                                    lineHeight: 1.7,
                                    color: "#1e40af",
                                }}>
                                    {result.self_introduction.tailored_pitch}
                                </div>
                            )}
                            {result.self_introduction?.key_points && (
                                <div style={{ fontSize: 12 }}>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>要点提示</div>
                                    {result.self_introduction.key_points.map((p, i) => (
                                        <div key={i} style={{ padding: "2px 0" }}>• {p}</div>
                                    ))}
                                </div>
                            )}
                            {result.questions_to_ask && (
                                <div style={{ fontSize: 12, marginTop: 8 }}>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>反问面试官</div>
                                    {result.questions_to_ask.for_hiring_manager?.map((q, i) => (
                                        <div key={`hm-${i}`} style={{ padding: "2px 0" }}>问 Manager：{q}</div>
                                    ))}
                                    {result.questions_to_ask.for_team_members?.map((q, i) => (
                                        <div key={`tm-${i}`} style={{ padding: "2px 0" }}>问团队：{q}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 应对技巧 */}
                    {activeTab === "tips" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {result.difficult_questions_prep?.map((q, i) => (
                                <div key={i} style={{
                                    padding: 12,
                                    background: "#f8fafc",
                                    borderRadius: 6,
                                    border: "1px solid #e5e7eb",
                                    fontSize: 12,
                                }}>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{q.question}</div>
                                    {q.formula && (
                                        <div style={{ color: "#2563eb", marginBottom: 4 }}>公式：{q.formula}</div>
                                    )}
                                    {q.sample_answer && (
                                        <div style={{
                                            padding: 8,
                                            background: "#fff",
                                            borderRadius: 4,
                                            border: "1px solid #e5e7eb",
                                            lineHeight: 1.6,
                                        }}>
                                            {q.sample_answer}
                                        </div>
                                    )}
                                </div>
                            ))}
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
                </>
            )}
        </div>
    )
}
