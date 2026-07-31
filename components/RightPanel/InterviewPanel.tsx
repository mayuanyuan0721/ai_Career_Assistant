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

export default function InterviewPanel({ resume }: Props) {
    const router = useRouter()
    const [messages, setMessages] = useState<Message[]>([])
    const [currentQuestion, setCurrentQuestion] = useState<string>("")
    const [answerScore, setAnswerScore] = useState<number | null>(null)
    const [feedback, setFeedback] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const [isStart, setIsStart] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // 当前会话 ID（从 store 获取）
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
            const res = await fetch(`/api/career/interview`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    resume,
                    message: text,
                    conversationId
                })
            })

            if (res.ok) {
                const data = await res.json()
                setMessages(prev => [...prev, { role: "assistant", content: data.response }])
                
                // 解析 AI 回复中的评分和建议
                const scoreMatch = data.response.match(/(\d+\s*\/\s*10)/)
                if (scoreMatch) {
                    const score = parseInt(scoreMatch[1].replace(/\D/g, ""))
                    setAnswerScore(score)
                    
                    // 提取评分后的文本作为建议
                    const idx = data.response.indexOf(scoreMatch[0])
                    if (idx >= 0) {
                        const afterScore = data.response.slice(idx + scoreMatch[0].length).trim()
                        setFeedback(afterScore)
                    }
                } else {
                    setAnswerScore(7) // 默认分数
                    setFeedback("回答不错，继续深入。")
                }
            }
        } catch (err) {
            console.error("[Interview] Submit error:", err)
            alert("发送失败，请重试")
            setMessages(prev => prev.slice(0, -1)) // 移除用户消息
        } finally {
            setLoading(false)
        }
    }

    const startInterview = () => {
        setIsStart(true)
        // 通过 API 触发第一题
        handleInterviewSubmit("好的，开始面试吧！")
    }

    const restartInterview = () => {
        window.location.href = `/chat/new`
    }

    if (!resume) {
        return (
            <div className={styles.panel}>
                <h2>模拟面试</h2>
                <p className={styles.subTitle}>AI Career Assistant</p>
                <div className={styles.empty}>
                    <h3>📋</h3>
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
                <div className={styles.introText}>
                    <strong>🎯 模拟面试模式</strong><br/>
                    AI 面试官将根据你的简历进行技术面试。<br/><br/>
                    📌 特点：<br/>
                    • 每次只提一个问题<br/>
                    • 对你的回答打分并给出改进建议<br/>
                    • 问题基于你的技能栈和目标岗位<br/>
                    • 适合练习面试技巧和查漏补缺
                    <br/><br/>
                    点击下方按钮开始面试。
                </div>
                <button onClick={startInterview} className={styles.restartBtn}>
                    🚀 开始面试
                </button>
            </div>
        )
    }

    return (
        <div className={styles.panel}>
            <h2>模拟面试</h2>
            <p className={styles.subTitle}>AI Career Assistant</p>

            {/* 对话列表 */}
            <div style={{ flex: 1, overflowY: "auto", marginBottom: "14px", paddingBottom: "14px" }}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={styles.card}>
                        <div style={{ 
                            display: "flex", 
                            alignItems: "flex-start", 
                            gap: "10px",
                            marginBottom: "8px"
                        }}>
                            <div style={{ 
                                width: "32px", height: "32px", 
                                borderRadius: "50%", 
                                background: msg.role === "user" ? "#eef2ff" : "#dbeafe",
                                color: msg.role === "user" ? "#4f46e5" : "#2563eb",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "16px"
                            }}>
                                {msg.role === "user" ? "👤" : "🤖"}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "13px", color: "#555", whiteSpace: "pre-wrap" }}>
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* 评分和反馈 */}
            {answerScore !== null && (
                <div className={styles.card}>
                    <div className={`${styles.scoreBadge} ${answerScore >= 8 ? styles.scoreGood : answerScore >= 6 ? styles.scoreMid : styles.scoreBad}`}>
                        {answerScore}/10
                    </div>
                    {feedback && (
                        <div className={styles.feedback}>
                            <h5>💡 改进建议：</h5>
                            <p>{feedback}</p>
                        </div>
                    )}
                </div>
            )}

            {/* 输入框 */}
            <ChatInput onSend={handleInterviewSubmit} disabled={loading} />
        </div>
    )
}
