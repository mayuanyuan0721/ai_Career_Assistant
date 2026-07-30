"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { useAppStore } from "@/lib/store"

interface Conversation {
    id: string
    title: string
    created_at: string
    updated_at: string
}

interface Props {
    onSelectConversation: (id: string) => void
    activeId: string
    onDeleteConversation: (id: string) => void
    isLogin: boolean
}

export default function Sidebar({ onSelectConversation, activeId, onDeleteConversation, isLogin }: Props) {
    const router = useRouter()
    
    // Get conversations directly from Zustand store - NO fetch!
    const { conversations } = useAppStore()
    
    return (
        <div className="w-[260px] border-r flex flex-col h-full">
            <div className="p-4">
                <h2 className="text-lg font-semibold mb-3">History</h2>
                <Button onClick={() => { if (!isLogin) { alert("Please login first"); return; } router.push("/chat") }} className="w-full" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    {"\u65b0\u5bf9\u8bdd"}
                </Button>
            </div>
            <Separator />
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {conversations.length === 0 && isLogin && (
                        <div className="text-center text-sm text-muted-foreground py-4">{"\u6682\u65e0\u5bf9\u8bdd"}</div>
                    )}
                    {conversations.map((item) => (
                        <div key={item.id} className={cn("flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-accent transition-colors group", activeId === item.id && "bg-accent")} onClick={() => onSelectConversation(item.id)}>
                            <span className="flex-1 truncate text-sm">{item.title}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => { e.stopPropagation(); if (confirm("\u4f60\u786e\u5b9a\u8981\u5220\u9664\u8fd9\u4e2a\u804a\u5929?")) onDeleteConversation(item.id) }}>
                                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}

