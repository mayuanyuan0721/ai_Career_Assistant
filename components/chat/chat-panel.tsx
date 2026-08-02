"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LogOut, User, Mic, ArrowLeft } from "lucide-react"
import MessageList from "./message-list"
import ChatInput from "./chat-input"
import ModeSelector from "./mode-selector"
import ResumeAnalysis from "@/components/Resume/ResumeAnalysis"
import { Mode, ConversationType } from "@/types/chat"
import { ResumeReport } from "@/types/resume"
import AuthModal from "@/components/auth/auth-modal"

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
}

export default function ChatPanel({
    conversationId,
    conversationType = 'chat',
    initialMessages,
    onLogout,
    user,
    mode,
    setMode,
    resume,
    report,
}: Props) {
    const [showAuth, setShowAuth] = useState(false)

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

    const initializedRef = useRef(false)
    useEffect(() => {
        if (initializedRef.current || initialMessages.length === 0) return
        initializedRef.current = true
        console.log('[ChatPanel] Setting initial messages:', initialMessages.length)
        setMessages(initialMessages as any)
    }, [initialMessages, setMessages])

    const reportAdded = useRef(false)
    useEffect(() => { reportAdded.current = false }, [conversationId])
    useEffect(() => {
        if (!report || reportAdded.current) return
        reportAdded.current = true
        setMessages((prev) => [
            ...prev,
            { id: "report-" + Date.now(), role: "assistant", parts: [{ type: "text", text: "__REPORT__" }] },
        ])
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
                                className="flex items-center gap-1"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Chat
                            </Button>
                            <Mic className="h-5 w-5 text-blue-500" />
                            <h2 className="text-lg font-semibold">Interview Mode</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            {user ? (
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span className="text-sm">{user.email}</span>
                                    <Button variant="ghost" size="sm" onClick={onLogout}>
                                        <LogOut className="h-4 w-4 mr-1" />
                                        Logout
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
                        <div className="text-6xl mb-4">🎤</div>
                        <h3 className="text-xl font-semibold mb-2">Interview in Progress</h3>
                        <p className="text-muted-foreground mb-6">
                            Please use the right panel to interact with the AI interviewer.<br/>
                            The interviewer will ask questions based on your resume.
                        </p>
                        <div className="space-y-2 text-sm text-left bg-blue-50 p-4 rounded-lg">
                            <p className="font-medium">📌 Interview Features:</p>
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
                                <User className="h-4 w-4" />
                                <span className="text-sm">{user.email}</span>
                                <Button variant="ghost" size="sm" onClick={onLogout}>
                                    <LogOut className="h-4 w-4 mr-1" />
                                    Logout
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
