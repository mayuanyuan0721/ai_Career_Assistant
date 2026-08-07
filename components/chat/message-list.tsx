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
    isStreaming?: boolean
    reportComponent?: React.ReactNode
    onApplySectionOptimization?: (key: string, aiContent: string, userOriginal: string) => void
}

export default function MessageList({ 
    messages, 
    isLoading, 
    isStreaming, 
    reportComponent,
    onApplySectionOptimization
}: Props) {
    const activeStreaming = isStreaming ?? false
    let lastAssistantIdx = -1
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "assistant") {
            lastAssistantIdx = i
            break
        }
    }

    // 为每条消息找到前一条用户消息
    function getPreviousUserContent(idx: number): string | undefined {
        for (let i = idx - 1; i >= 0; i--) {
            if (messages[i].role === "user") {
                return messages[i].content
            }
        }
        return undefined
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
                            previousUserContent={getPreviousUserContent(idx)}
                            onApplySectionOptimization={onApplySectionOptimization}
                        />
                    )
                ))}
            </div>
        </ScrollArea>
    )
}
