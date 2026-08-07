"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import styles from "@/css/interviewPanel.module.css"
import ChatInput from "@/components/chat/chat-input"

interface Message {
    role: "user" | "assistant"
    content: string
}

interface Props {
    resume: any
}

// 常见岗位选项
const ROLE_OPTIONS = [
    "前端开发工程师",
    "后端开发工程师",
    "全栈开发工程师",
    "React 开发工程师",
    "Vue 开发工程师",
    "Java 开发工程师",
    "Python 开发工程师",
    "产品经理",
    "UI/UX 设计师",
    "数据分析师",
    "测试工程师",
    "运维工程师",
    "算法工程师",
]

// 解析 AI 面试回复为结构化数据
function parseInterviewResponse(content: string) {
    const sections: {
        scores?: Array<{ dimension: string; score: number; comment: string }>
        totalScore?: number
        highlights?: string[]
        suggestions?: string[]
        referenceAnswer?: string
        nextQuestion?: string
        other?: string
    } = {}

    // 提取评分表
    const scoreSection = content.match(/##\s*📊\s*本次评分[\s\S]*?(?=##|$)/)
    if (scoreSection) {
        const scoreLines = scoreSection[0].split("\n")
        const scores: Array<{ dimension: string; score: number; comment: string }> = []
        
        for (const line of scoreLines) {
            // 匹配表格行: | 维度 | 分数 | 说明 |
            const match = line.match(/\|\s*([^|]+)\s*\|\s*(\d+(?:\.\d+)?)\/10\s*\|\s*([^|]+)\s*\|/)
            if (match && !match[1].includes("维度")) {
                const dimension = match[1].replace(/\*\*/g, "").trim()
                const score = parseFloat(match[2])
                const comment = match[3].trim()
                
                if (dimension === "综合") {
                    sections.totalScore = score
                } else {
                    scores.push({ dimension, score, comment })
                }
            }
        }
        if (scores.length > 0) sections.scores = scores
    }

    // 提取亮点
    const highlightsMatch = content.match(/##\s*✅\s*亮点([\s\S]*?)(?=##|$)/)
    if (highlightsMatch) {
        sections.highlights = highlightsMatch[1]
            .split("\n")
            .map(l => l.replace(/^[-•]\s*/, "").trim())
            .filter(l => l.length > 0)
    }

    // 提取改进建议
    const suggestionsMatch = content.match(/##\s*💡\s*改进建议([\s\S]*?)(?=##|$)/)
    if (suggestionsMatch) {
        sections.suggestions = suggestionsMatch[1]
            .split("\n")
            .map(l => l.replace(/^[-•]\s*/, "").trim())
            .filter(l => l.length > 0)
    }

    // 提取参考答案
    const refMatch = content.match(/##\s*📖\s*参考答案要点([\s\S]*?)(?=##|$)/)
    if (refMatch) {
        sections.referenceAnswer = refMatch[1].trim()
    }

    // 提取下一个问题
    const nextMatch = content.match(/##\s*❓\s*下一个问题([\s\S]*?)$/)
    if (nextMatch) {
        sections.nextQuestion = nextMatch[1].trim().replace(/^>\s*/gm, "")
    }

    // 如果没有匹配到任何结构化内容，返回原始文本
    if (!sections.scores && !sections.highlights && !sections.nextQuestion) {
        sections.other = content
    }

    return sections
}

// 评分颜色
function getScoreColor(score: number): string {
    if (score >= 8) return "#16a34a"
    if (score >= 6) return "#ca8a04"
    return "#dc2626"
}

function getScoreBg(score: number): string {
    if (score >= 8) return "#f0fdf4"
    if (score >= 6) return "#fefce8"
    return "#fef2f2"
}

// 渲染结构化的面试回复
function InterviewResponse({ content }: { content: string }) {
    const data = parseInterviewResponse(content)

    // 如果没有结构化数据，直接显示原文
    if (data.other) {
        return <div style={{ fontSize: "13px", color: "#555", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{data.other}</div>
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* 评分区域 */}
            {data.scores && (
                <div style={{
                    padding: "12px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#555", marginBottom: "8px" }}>
                        本次评分
                    </div>
                    
                    {/* 各维度评分 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
                        {data.scores.map((s, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "12px", color: "#666", width: "70px", flexShrink: 0 }}>
                                    {s.dimension}
                                </span>
                                <div style={{
                                    flex: 1,
                                    height: "6px",
                                    background: "#e5e7eb",
                                    borderRadius: "3px",
                                    overflow: "hidden",
                                }}>
                                    <div style={{
                                        width: `${s.score * 10}%`,
                                        height: "100%",
                                        background: getScoreColor(s.score),
                                        borderRadius: "3px",
                                        transition: "width 0.3s ease",
                                    }} />
                                </div>
                                <span style={{
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: getScoreColor(s.score),
                                    width: "35px",
                                    textAlign: "right",
                                }}>
                                    {s.score}/10
                                </span>
                            </div>
                        ))}
                    </div>
                    
                    {/* 综合评分 */}
                    {data.totalScore != null && (
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 10px",
                            background: getScoreBg(data.totalScore),
                            borderRadius: "6px",
                        }}>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "#555" }}>综合</span>
                            <span style={{
                                fontSize: "24px",
                                fontWeight: 700,
                                color: getScoreColor(data.totalScore),
                            }}>
                                {data.totalScore}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* 亮点 */}
            {data.highlights && data.highlights.length > 0 && (
                <div style={{
                    padding: "10px 12px",
                    background: "#f0fdf4",
                    borderRadius: "6px",
                    borderLeft: "3px solid #16a34a",
                }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#16a34a", marginBottom: "6px" }}>
                        亮点
                    </div>
                    {data.highlights.map((h, i) => (
                        <div key={i} style={{ fontSize: "12px", color: "#555", lineHeight: 1.6, marginTop: i > 0 ? "4px" : 0 }}>
                            • {h}
                        </div>
                    ))}
                </div>
            )}

            {/* 改进建议 */}
            {data.suggestions && data.suggestions.length > 0 && (
                <div style={{
                    padding: "10px 12px",
                    background: "#eff6ff",
                    borderRadius: "6px",
                    borderLeft: "3px solid #2563eb",
                }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#2563eb", marginBottom: "6px" }}>
                        改进建议
                    </div>
                    {data.suggestions.map((s, i) => (
                        <div key={i} style={{ fontSize: "12px", color: "#555", lineHeight: 1.6, marginTop: i > 0 ? "6px" : 0 }}>
                            {i + 1}. {s}
                        </div>
                    ))}
                </div>
            )}

            {/* 参考答案 */}
            {data.referenceAnswer && (
                <div style={{
                    padding: "10px 12px",
                    background: "#fefce8",
                    borderRadius: "6px",
                    borderLeft: "3px solid #ca8a04",
                }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#ca8a04", marginBottom: "6px" }}>
                        参考答案要点
                    </div>
                    <div style={{ fontSize: "12px", color: "#555", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                        {data.referenceAnswer}
                    </div>
                </div>
            )}

            {/* 下一个问题 */}
            {data.nextQuestion && (
                <div style={{
                    padding: "12px",
                    background: "#faf5ff",
                    borderRadius: "8px",
                    border: "1px solid #e9d5ff",
                }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#7c3aed", marginBottom: "8px" }}>
                        下一个问题
                    </div>
                    <div style={{ fontSize: "13px", color: "#333", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                        {data.nextQuestion}
                    </div>
                </div>
            )}
        </div>
    )
}

export default function InterviewPanel({ resume }: Props) {
    const router = useRouter()
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(false)
    const [isStart, setIsStart] = useState(false)
    const [targetRole, setTargetRole] = useState<string>("前端开发工程师")
    const [customRole, setCustomRole] = useState<string>("")
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const { conversationId } = useAppStore()
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        if (messages.length > 0) scrollToBottom()
    }, [messages])
    
    const handleInterviewSubmit = async (text: string) => {
        if (!conversationId || loading) return

        setLoading(true)
        setMessages(prev => [...prev, { role: "user", content: text }])
        
        try {
            const effectiveRole = customRole.trim() || targetRole
            
            const res = await fetch(`/api/career/interview`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    resume,
                    message: text,
                    conversationId,
                    targetRole: effectiveRole
                })
            })

            if (res.ok) {
                const data = await res.json()
                setMessages(prev => [...prev, { role: "assistant", content: data.response }])
            } else {
                const errData = await res.json().catch(() => ({}))
                alert(errData.error || "面试请求失败")
                setMessages(prev => prev.slice(0, -1))
            }
        } catch (err) {
            console.error("[Interview] Submit error:", err)
            alert("发送失败，请重试")
            setMessages(prev => prev.slice(0, -1))
        } finally {
            setLoading(false)
        }
    }

    const startInterview = () => {
        setIsStart(true)
        handleInterviewSubmit("好的，开始面试吧！")
    }

    if (!resume) {
        return (
            <div className={styles.panel}>
                <h2>模拟面试</h2>
                <p className={styles.subTitle}>AI Career Assistant</p>
                <div className={styles.empty}>
                    <p>请先上传简历<br/>分析完成后将启动模拟面试</p>
                </div>
            </div>
        )
    }

    if (!isStart) {
        return (
            <div className={styles.panel}>
                <h2>模拟面试</h2>
                <p className={styles.subTitle}>AI Career Assistant</p>
                
                {/* 目标岗位选择 */}
                <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "13px", color: "#555", marginBottom: "8px" }}>
                        目标岗位
                    </div>
                    
                    {/* 预设岗位 */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                        {ROLE_OPTIONS.map((role) => (
                            <button
                                key={role}
                                onClick={() => { setTargetRole(role); setCustomRole("") }}
                                style={{
                                    padding: "4px 10px",
                                    fontSize: "12px",
                                    background: targetRole === role && !customRole ? "#2563eb" : "#f3f4f6",
                                    color: targetRole === role && !customRole ? "#fff" : "#555",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                }}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                    
                    {/* 自定义岗位 */}
                    <input
                        type="text"
                        placeholder="或输入自定义岗位..."
                        value={customRole}
                        onChange={(e) => setCustomRole(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "8px 12px",
                            fontSize: "13px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                            boxSizing: "border-box",
                        }}
                    />
                </div>
                
                <div className={styles.introText}>
                    <strong>模拟面试模式</strong><br/>
                    AI 面试官将根据你的简历和目标岗位进行技术面试。<br/><br/>
                    特点：<br/>
                    - 题库 + AI 混合出题，覆盖所有行业<br/>
                    - 详细评分（技术深度/表达/实践）<br/>
                    - 参考答案和改进建议<br/>
                    - 根据回答动态调整难度
                    <br/><br/>
                    当前目标岗位：<strong>{customRole || targetRole}</strong>
                </div>
                <button onClick={startInterview} className={styles.restartBtn}>
                    开始面试
                </button>
            </div>
        )
    }

    return (
        <div className={styles.panel}>
            <h2>模拟面试</h2>
            <p className={styles.subTitle}>目标：{customRole || targetRole}</p>

            {/* 对话列表 */}
            <div style={{ flex: 1, overflowY: "auto", marginBottom: "14px", paddingBottom: "14px" }}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={styles.card}>
                        <div style={{ 
                            display: "flex", 
                            alignItems: "flex-start", 
                            gap: "10px",
                        }}>
                            <div style={{ 
                                width: "32px", height: "32px", 
                                borderRadius: "50%", 
                                background: msg.role === "user" ? "#eef2ff" : "#dbeafe",
                                color: msg.role === "user" ? "#4f46e5" : "#2563eb",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "12px",
                                flexShrink: 0,
                                fontWeight: 600,
                            }}>
                                {msg.role === "user" ? "我" : "AI"}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                {msg.role === "assistant" ? (
                                    <InterviewResponse content={msg.content} />
                                ) : (
                                    <div style={{ fontSize: "13px", color: "#555", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                                        {msg.content}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* 输入框 */}
            <ChatInput onSend={handleInterviewSubmit} isLoading={loading} />
        </div>
    )
}
