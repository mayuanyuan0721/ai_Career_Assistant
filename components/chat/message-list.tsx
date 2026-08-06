"use client"

import Message from "./message"
import { ScrollArea } from "@/components/ui/scroll-area"

interface MessageItem {
    id: string
    role: string
    content: string
    isReport?: boolean
}

interface Props {
    messages: MessageItem[]
    isLoading?: boolean
    isThinking?: boolean
    isStreaming?: boolean
    reportComponent?: React.ReactNode
    onApplySectionOptimization?: (key: string, content: string) => void  // 新增回调
}

export default function MessageList({ 
    messages, 
    isLoading, 
    isThinking, 
    isStreaming, 
    reportComponent,
    onApplySectionOptimization  // 新增 prop
}: Props) {
    // Support both isLoading shorthand and separate isThinking/isStreaming flags
    const showThinking = isThinking ?? isLoading ?? false
    const activeStreaming = isStreaming ?? false
    let lastAssistantIdx = -1
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "assistant") {
            lastAssistantIdx = i
            break
        }
    }

    return (
        <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
                {messages.map((msg, idx) => (
                    msg.isReport && reportComponent ? (
                        <div key={msg.id} className="flex items-start gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shrink-0 bg-muted">
                                {"\ud83e\udd16"}
                            </div>
                            <div className="max-w-[80%]">
                                {reportComponent}
                            </div>
                        </div>
                    ) : (
                        <Message
                            key={msg.id}
                            role={msg.role as "user" | "assistant"}
                            content={msg.content}
                            isStreaming={activeStreaming && idx === lastAssistantIdx}
                            onApplySectionOptimization={onApplySectionOptimization}  // 传递回调给 Message
                        />
                    )
                ))}
                {showThinking && (
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shrink-0 bg-muted">
                            {"\ud83e\udd16"}
                        </div>
                        <div className="rounded-lg px-4 py-2 bg-muted">
                            <span className="text-muted-foreground">
                                {"\u601d\u8003\u4e2d"}
                                <span className="inline-block ml-1">
                                    <span style={{ animation: "thinking-dot 1.4s infinite", animationDelay: "0s" }}>{"."}</span>
                                    <span style={{ animation: "thinking-dot 1.4s infinite", animationDelay: "0.2s" }}>{"."}</span>
                                    <span style={{ animation: "thinking-dot 1.4s infinite", animationDelay: "0.4s" }}>{"."}</span>
                                </span>
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
    )
}
