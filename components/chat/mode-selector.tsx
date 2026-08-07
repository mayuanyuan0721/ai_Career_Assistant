"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Mode } from "@/types/chat"

interface Props {
    mode: Mode
    setMode: (mode: Mode) => void
}

const modes: { label: string; value: Mode }[] = [
    { label: "\ud83d\udcdd \u7b80\u5386\u4f18\u5316", value: "resume_optimize" },
    { label: "\ud83c\udfaf \u5c97\u4f4d\u5339\u914d", value: "job_match" },
    { label: "\ud83c\udfa4 \u6a21\u62df\u9762\u8bd5", value: "interview" },
    { label: "JD \u5206\u6790", value: "jd_analysis" },
    { label: "\u9762\u8bd5\u51c6\u5907", value: "interview_prep" },
    { label: "\u8f6c\u884c\u7ffb\u8bd1", value: "career_translate" },
]

export default function ModeSelector({ mode, setMode }: Props) {
    return (
        <div className="flex gap-2">
            {modes.map((item) => (
                <Button
                    key={item.value}
                    variant={mode === item.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMode(item.value)}
                    className={cn(
                        "text-xs transition-all",
                        mode !== item.value && "hover:bg-accent"
                    )}
                >
                    {item.label}
                </Button>
            ))}
        </div>
    )
}
