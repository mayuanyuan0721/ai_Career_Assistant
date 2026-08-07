"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface Props {
    onSend: (text: string) => void
    isLoading?: boolean
    onStop?: () => void
    placeholder?: string
    disabled?: boolean
}

export default function ChatInput({ onSend, isLoading, onStop, placeholder, disabled }: Props) {
    const [text, setText] = useState("")

    const handleSubmit = () => {
        if (!text.trim() || isLoading || disabled) return
        onSend(text)
        setText("")
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    return (
        <div className="flex items-end gap-2">
            <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder ?? "给 AI 发送消息..."}
                disabled={isLoading || disabled}
                className="min-h-[44px] resize-none"
                rows={1}
            />
            {isLoading && onStop ? (
                <Button
                    onClick={onStop}
                    variant="outline"
                    className="shrink-0 h-[44px] px-4"
                >
                    停止
                </Button>
            ) : (
                <Button
                    onClick={handleSubmit}
                    disabled={isLoading || disabled || !text.trim()}
                    className="shrink-0 h-[44px] px-4"
                >
                    发送
                </Button>
            )}
        </div>
    )
}
