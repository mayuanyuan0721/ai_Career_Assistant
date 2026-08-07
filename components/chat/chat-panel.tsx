"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import MessageList from "./message-list"
import ChatInput from "./chat-input"
import ModeSelector from "./mode-selector"
import ResumeAnalysis from "@/components/Resume/ResumeAnalysis"
import { Mode, ConversationType } from "@/types/chat"
import { ResumeReport } from "@/types/resume"
import AuthModal from "@/components/auth/auth-modal"
import { useAppStore } from "@/lib/store"

interface UIMessagePart {
    type: string
    text?: string
    [key: string]: unknown
}

interface UIMessage {
    id: string
    role: "user" | "assistant" | "system"
    parts: UIMessagePart[]
}

interface Props {
    conversationId: string
    conversationType?: ConversationType
    initialMessages: UIMessage[]
    onLogout: () => void
    user: any
    mode: Mode
    setMode: (mode: Mode) => void
    resume: any
    report: ResumeReport | null
    onApplySectionOptimization?: (key: string, aiContent: string, userOriginal: string) => void
}

export default function ChatPanel({
    conversationId,
    conversationType = 'chat',
    initialMessages,
    onLogout,
    user: userProp,
    mode,
    setMode,
    resume,
    report,
    onApplySectionOptimization,  // 新增 prop
}: Props) {
    const [showAuth, setShowAuth] = useState(false)
    // 使用 store 中的 user（客户端 checkAuth 后更新），而非仅依赖 SSR prop
    const storeUser = useAppStore((s) => s.user)
    const user = storeUser || userProp

    const transport = useMemo(() => {
        return new DefaultChatTransport({
            api: "/api/chat",
            fetch: async (input, init) => {
                const res = await fetch(input, init)
                if (!res.ok) {
                    let msg = "error"
                    try {
                        const body = await res.clone().json()
                        if (body?.error) msg = body.error
                    } catch {}
                    throw new Error(msg)
                }
                return res
            },
            prepareSendMessagesRequest(request) {
                const lastMessage = request.messages[request.messages.length - 1]
                return {
                    body: {
                        message: lastMessage,
                        conversationId,
                        mode,
                        resume,
                    },
                }
            },
        })
    }, [conversationId, mode, resume])

    const { messages, sendMessage, status, stop, setMessages } = useChat({
        id: conversationId,
        transport,
    })

    const prevConversationIdRef = useRef(conversationId)
    const prevInitialMessagesRef = useRef(initialMessages)
    
    useEffect(() => {
        // 当 conversationId 变化时，同步消息
        const idChanged = prevConversationIdRef.current !== conversationId
        const messagesChanged = prevInitialMessagesRef.current !== initialMessages
        const lengthMismatch = messages.length !== initialMessages.length
        
        console.log('[ChatPanel] Effect triggered:', { 
            idChanged, 
            messagesChanged,
            lengthMismatch,
            currentConvId: conversationId,
            prevConvId: prevConversationIdRef.current,
            initialMsgsLen: initialMessages.length,
            currentMsgsLen: messages.length,
        })
        
        // conversationId 变化时，必须同步消息（包括清空空对话的情况）
        if (idChanged) {
            prevConversationIdRef.current = conversationId
            prevInitialMessagesRef.current = initialMessages
            console.log('[ChatPanel] Conversation changed, syncing messages:', { count: initialMessages.length })
            setMessages(initialMessages as any)
        } else if (initialMessages.length > 0 && (messagesChanged || lengthMismatch)) {
            // 非切换对话，但 initialMessages 更新时也要同步
            prevInitialMessagesRef.current = initialMessages
            console.log('[ChatPanel] Initial messages updated:', { count: initialMessages.length })
            setMessages(initialMessages as any)
        }
    }, [initialMessages, setMessages, conversationId, messages.length])

    const reportAdded = useRef(false)
    useEffect(() => { reportAdded.current = false }, [conversationId])
    useEffect(() => {
        if (!report || reportAdded.current) {
            return
        }
        reportAdded.current = true
        setMessages((prev) => {
            // 防止重复插入：检查是否已存在 report 标记消息
            const hasReportMessage = prev.some(m => m.id === "report-report-message")
            if (hasReportMessage) {
                return prev
            }
            const newMessage = {
                id: "report-report-message",
                role: "assistant", 
                parts: [{ type: "text", text: "__REPORT__" }]
            }
            return [...prev, newMessage]
        })
    }, [report, setMessages])

    const handleSend = (text: string) => {
        if (!text.trim()) return
        if (!user) {
            setShowAuth(true)
            return
        }
        sendMessage({ text })
    }

    const isStreaming = status === "streaming"
    const isLoading = isStreaming || status === "submitted"

    const adaptedMessages = useMemo(() => {
        return messages.map((m) => {
            const text = m.parts
                ?.filter((p) => p.type === "text")
                .map((p) => (p as { type: string; text: string }).text)
                .join("") || ""
            return {
                id: m.id,
                role: m.role === "system" ? "assistant" : (m.role as "user" | "assistant"),
                content: text,
                isReport: text === "__REPORT__",
            }
        })
    }, [messages])

    // Interview mode: Show instruction in center panel
    if (mode === 'interview') {
        return (
            <div className="flex flex-col h-full">
                <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setMode('resume_optimize')}
                            >
                                返回聊天
                            </Button>
                            <h2 className="text-lg font-semibold">面试模式</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            {user ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">{user.email}</span>
                                    <Button variant="ghost" size="sm" onClick={onLogout}>
                                        退出
                                    </Button>
                                </div>
                            ) : (
                                <Button variant="ghost" size="sm" onClick={() => setShowAuth(true)}>
                                    Login
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center max-w-md">
                        <h3 className="text-xl font-semibold mb-2">面试进行中</h3>
                        <p className="text-muted-foreground mb-6">
                            请在右侧面板与 AI 面试官互动。<br/>
                            面试官将根据你的简历提出问题。
                        </p>
                        <div className="space-y-2 text-sm text-left bg-blue-50 p-4 rounded-lg">
                            <p className="font-medium">面试特点：</p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                <li>One question at a time</li>
                                <li>Real-time scoring (X/10)</li>
                                <li>Personalized feedback</li>
                                <li>Questions based on your skills</li>
                            </ul>
                        </div>
                        <Button 
                            className="mt-6"
                            onClick={() => setMode('resume_optimize')}
                        >
                            Switch to Chat Mode
                        </Button>
                    </div>
                </div>

                <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
            </div>
        )
    }

    // Normal chat mode
    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Chat</h2>
                    <div className="flex items-center gap-2">
                        {user ? (
                            <div className="flex items-center gap-2">
                                <span className="text-sm">{user.email}</span>
                                <Button variant="ghost" size="sm" onClick={onLogout}>
                                    退出
                                </Button>
                            </div>
                        ) : (
                            <Button variant="ghost" size="sm" onClick={() => setShowAuth(true)}>
                                Login
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <MessageList
                    messages={adaptedMessages}
                    isLoading={isLoading}
                    reportComponent={report ? <ResumeAnalysis report={report} /> : undefined}
                    onApplySectionOptimization={onApplySectionOptimization}  // 新增
                />
            </div>

            <Separator />

            <div className="p-4 border-t">
                <div className="mb-3">
                    <ModeSelector mode={mode} setMode={setMode} />
                </div>
                <ChatInput
                    onSend={handleSend}
                    isLoading={isLoading}
                    onStop={stop}
                />
            </div>

            <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
        </div>
    )
}
