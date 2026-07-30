"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LogOut, User } from "lucide-react"
import MessageList from "./message-list"
import ChatInput from "./chat-input"
import ModeSelector from "./mode-selector"
import ResumeAnalysis from "@/components/Resume/ResumeAnalysis"
import { Mode } from "@/types/chat"
import { ResumeReport } from "@/types/resume"
import AuthModal from "@/components/auth/auth-modal"

// UIMessage shape from AI SDK
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
    initialMessages: UIMessage[]
    onLogout: () => void
    user: any
    mode: Mode
    setMode: (mode: Mode) => void
    resume: any
    report: ResumeReport | null
}

export default function ChatPanel({
    conversationId,
    initialMessages,
    onLogout,
    user,
    mode,
    setMode,
    resume,
    report,
}: Props) {
    const modeRef = useRef(mode)
    const resumeRef = useRef(resume)
    const conversationIdRef = useRef(conversationId)

    // Local auth modal management - no need to pass callbacks from parent
    const [showAuth, setShowAuth] = useState(false)
    const handleLogin = () => setShowAuth(true)

    useEffect(() => { modeRef.current = mode }, [mode])
    useEffect(() => { resumeRef.current = resume }, [resume])
    useEffect(() => { conversationIdRef.current = conversationId }, [conversationId])

    const transport = useMemo(() => {
        return new DefaultChatTransport({
            api: "/api/chat",
            fetch: async (input, init) => {
                const res = await fetch(input, init)
                if (!res.ok) {
                    let msg = "发送失败，请稍后重试"
                    try {
                        const body = await res.clone().json()
                        if (body?.error) msg = body.error
                    } catch { /* keep default */ }
                    throw new Error(msg)
                }
                return res
            },
            prepareSendMessagesRequest(request) {
                const lastMessage = request.messages[request.messages.length - 1]
                return {
                    body: {
                        message: lastMessage,
                        conversationId: conversationIdRef.current,
                        mode: modeRef.current,
                        resume: resumeRef.current,
                    },
                }
            },
        })
    }, [])

    const { messages, sendMessage, status, stop, setMessages } = useChat({
        id: conversationId,
        transport,
        // Don't call onTitleUpdate here - it causes cascading re-renders
        // The title should be fetched separately in the RightPanel
    })

    // Load initial messages from RSC (server-side loaded data)
    const initializedRef = useRef(false)
    useEffect(() => {
        if (initializedRef.current || initialMessages.length === 0) return
        initializedRef.current = true
        setMessages(initialMessages as any)
    }, [initialMessages, setMessages])

    // Handle report injection
    const reportAdded = useRef(false)
    useEffect(() => { reportAdded.current = false }, [conversationId])
    useEffect(() => {
        if (!report || reportAdded.current) return
        reportAdded.current = true
        setMessages((prev) => [
            ...prev,
            { id: `report-${Date.now()}`, role: "assistant", parts: [{ type: "text", text: "__REPORT__" }] },
        ])
    }, [report, setMessages])

    const handleSend = (text: string) => {
        if (!text.trim()) return
        if (!user) {
            alert("请先登录")
            setShowAuth(true)
            return
        }
        sendMessage({ text })
    }

    const isStreaming = status === "streaming"
    const isLoading = isStreaming || status === "submitted"
    const showThinking = status === "submitted" && messages.length > 0 && messages[messages.length - 1].role === "user"

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

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 border-b">
                <h1 className="text-lg font-semibold">AI Assistant</h1>
                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>{user.email}</span>
                            </div>
                            <Button variant="outline" size="sm" onClick={onLogout}>
                                <LogOut className="h-3 w-3 mr-1" />
                                {"\u9000\u51fa"}
                            </Button>
                        </>
                    ) : (
                        <Button size="sm" onClick={() => setShowAuth(true)}>
                            {"登录"}
                        </Button>
                    )}
                </div>
            </header>

            {/* Auth Modal - managed locally */}
            <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />

            {/* Messages */}
            <main className="flex-1 overflow-hidden">
                <MessageList
                    messages={adaptedMessages}
                    isThinking={showThinking}
                    isStreaming={isStreaming}
                    reportComponent={report ? <ResumeAnalysis report={report} /> : undefined}
                />
            </main>

            {/* Input */}
            <Separator />
            <footer className="p-4 space-y-2">
                <ModeSelector mode={mode} setMode={setMode} />
                <div className="flex items-end gap-2">
                    <div className="flex-1">
                        <ChatInput onSend={handleSend} disabled={isLoading} />
                    </div>
                    {isStreaming && (
                        <Button variant="destructive" size="sm" onClick={() => stop()} className="h-[44px]">
                            {"\u23f9"} {"\u505c\u6b62"}
                        </Button>
                    )}
                </div>
            </footer>
        </div>
    )
}
