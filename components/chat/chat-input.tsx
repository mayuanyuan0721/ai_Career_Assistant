"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ArrowUp, Square } from "lucide-react"

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
                placeholder={placeholder ?? "\u7ed9 AI \u53d1\u9001\u6d88\u606f..."}
                disabled={isLoading || disabled}
                className="min-h-[44px] resize-none"
                rows={1}
            />
            {isLoading && onStop ? (
                <Button
                    onClick={onStop}
                    size="icon"
                    variant="outline"
                    className="shrink-0 h-[44px] w-[44px]"
                >
                    <Square className="h-4 w-4" />
                </Button>
            ) : (
                <Button
                    onClick={handleSubmit}
                    disabled={isLoading || disabled || !text.trim()}
                    size="icon"
                    className="shrink-0 h-[44px] w-[44px]"
                >
                    <ArrowUp className="h-4 w-4" />
                </Button>
            )}
        </div>
    )
}
