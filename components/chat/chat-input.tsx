"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ArrowUp } from "lucide-react"

interface Props {
    onSend: (text: string) => void
    disabled?: boolean
}

export default function ChatInput({ onSend, disabled }: Props) {
    const [text, setText] = useState("")

    const handleSubmit = () => {
        if (!text.trim() || disabled) return
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
                placeholder={"\u7ed9 AI \u53d1\u9001\u6d88\u606f..."}
                disabled={disabled}
                className="min-h-[44px] resize-none"
                rows={1}
            />
            <Button
                onClick={handleSubmit}
                disabled={disabled || !text.trim()}
                size="icon"
                className="shrink-0 h-[44px] w-[44px]"
            >
                <ArrowUp className="h-4 w-4" />
            </Button>
        </div>
    )
}
