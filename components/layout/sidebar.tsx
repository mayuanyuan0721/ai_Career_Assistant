"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { useAppStore } from "@/lib/store"
import { Conversation } from "@/types/chat"

interface Props {
    onSelectConversation: (id: string) => void
    activeId: string
    onDeleteConversation: (id: string) => void
    isLogin?: boolean
    conversations?: Conversation[]
    refreshKey?: number
    onLogout?: () => void
    onShowAuth?: () => void  // 新增：显示登录/注册弹窗
}

export default function Sidebar({ conversations: propConversations, onSelectConversation, activeId, onDeleteConversation, isLogin = true, onShowAuth }: Props) {
    const router = useRouter()
    
    // Get conversations directly from Zustand store
    const { conversations: storeConversations } = useAppStore()
    const conversations = propConversations ?? storeConversations
    
    const handleNewChat = () => {
        if (!isLogin) {
            // 未登录时，弹出登录弹窗而不是 alert
            if (onShowAuth) {
                onShowAuth()
            } else {
                alert("请先登录后再创建对话")
            }
            return
        }
        router.push("/chat")
    }
    
    return (
        <div className="w-[260px] border-r flex flex-col h-full">
            <div className="p-4">
                <h2 className="text-lg font-semibold mb-3">History</h2>
                <Button onClick={handleNewChat} className="w-full" size="sm">
                    新对话
                </Button>
            </div>
            <Separator />
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {conversations.length === 0 && isLogin && (
                        <div className="text-center text-sm text-muted-foreground py-4">暂无对话</div>
                    )}
                    {conversations.map((item) => (
                        <div 
                            key={item.id} 
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-accent transition-colors group", 
                                activeId === item.id && "bg-accent"
                            )} 
                            onClick={() => onSelectConversation(item.id)}
                        >
                            <span className="flex-1 truncate text-sm">{item.title}</span>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-xs" 
                                onClick={(e) => { 
                                    e.stopPropagation()
                                    if (confirm("确定要删除这个聊天?")) {
                                        onDeleteConversation(item.id)
                                    }
                                }}
                            >
                                删除
                            </Button>
                        </div>
                    ))}
                </div>
            </ScrollArea>
            <Separator />
            <div className="p-2">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start" 
                    onClick={() => router.push("/settings")}
                >
                    数据更新设置
                </Button>
            </div>
        </div>
    )
}
