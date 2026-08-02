"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"

export default function EmptyChatPage() {
    const router = useRouter()
    const { conversations, isAuthChecked } = useAppStore()

    useEffect(() => {
        if (!isAuthChecked) return
        
        // 如果有对话，跳转到第一个
        if (conversations.length > 0) {
            router.replace(`/chat/${conversations[0].id}`)
        }
    }, [conversations, isAuthChecked, router])

    return (
        <div className="flex h-screen items-center justify-center">
            <div className="text-center space-y-4">
                <h1 className="text-2xl font-bold">👋 欢迎使用 AI Career Assistant</h1>
                <p className="text-muted-foreground">
                    {conversations.length === 0 
                        ? "你还没有对话，点击左侧的“新对话”按钮开始吧！"
                        : "正在加载..."
                    }
                </p>
            </div>
        </div>
    )
}
