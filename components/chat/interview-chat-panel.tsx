"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import MessageList from "./message-list"
import ChatInput from "./chat-input"
import AuthModal from "@/components/auth/auth-modal"
import { InterviewData } from "@/types/chat"

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
    interviewData?: InterviewData
    onInterviewUpdate: (data: InterviewData) => void
}

export default function InterviewChatPanel({
    conversationId,
    initialMessages,
    onLogout,
    user,
    interviewData,
    onInterviewUpdate,
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
                        mode: 'interview',
                        interviewData: interviewData,
                    },
                }
            },
        })
    }, [conversationId, interviewData])

    const { messages, sendMessage, status, stop, setMessages } = useChat({
        id: conversationId,
        transport,
    })

    const initializedRef = useRef(false)
    useEffect(() => {
        if (initializedRef.current || initialMessages.length === 0) return
        initializedRef.current = true
        setMessages(initialMessages as any)
    }, [initialMessages, setMessages])

    const handleSend = (text: string) => {
        if (!text.trim()) return
        if (!user) {
            alert("Please login first")
            setShowAuth(true)
            return
        }
        sendMessage({ text })
    }

    const isStreaming = status === "streaming"
    const isLoading = isStreaming || status === "submitted"

    const currentQuestion = interviewData?.questions[interviewData.currentPosition]
    const adaptedMessages = useMemo(() => {
        return messages.map((message) => ({
            id: message.id,
            role: message.role === "system" ? "assistant" : (message.role as "user" | "assistant"),
            content: message.parts
                ?.filter((part) => part.type === "text")
                .map((part) => (part as { text?: string }).text || "")
                .join("") || "",
        }))
    }, [messages])

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">面试</h2>
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
                                登录
                            </Button>
                        )}
                    </div>
                </div>
                
                {interviewData && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <span>问题 {interviewData.currentPosition + 1} / {interviewData.questions.length}</span>
                        {interviewData.isCompleted && (
                            <span className="text-green-600 text-xs">已完成</span>
                        )}
                    </div>
                )}
            </div>

            {currentQuestion && !interviewData?.isCompleted && (
                <div className="p-4 bg-blue-50 border-b">
                    <div className="text-sm text-blue-600 font-medium mb-2">Current Question:</div>
                    <div className="text-base">{currentQuestion.question}</div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                <MessageList messages={adaptedMessages} isLoading={isLoading} />
            </div>

            <Separator />

            <div className="p-4">
                <ChatInput
                    onSend={handleSend}
                    isLoading={isLoading}
                    onStop={stop}
                    placeholder={interviewData?.isCompleted ? "Interview completed..." : "Please answer..."}
                />
            </div>

            <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
        </div>
    )
}
