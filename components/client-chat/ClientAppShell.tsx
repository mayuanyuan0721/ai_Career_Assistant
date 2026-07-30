"use client"

import { useEffect, useCallback, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAppStore } from "@/lib/store"
import Sidebar from "@/components/layout/sidebar"
import ChatPanel from "@/components/chat/chat-panel"
import RightPanel from "@/components/RightPanel"
import AuthModal from "@/components/auth/auth-modal"
import { Mode } from "@/types/chat"
import { ResumeReport, OptimizedSection } from "@/types/resume"

interface Props {
    initialMessages: Array<{ id: string; role: string; parts: any[] }>
    user: any
    initialConversationId: string
}

export default function ClientChatShell({ initialMessages, user, initialConversationId }: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const initializedRef = useRef(false)
    
    const {
        conversationId,
        conversations,
        isAuthChecked,
        init,
        selectConversation,
        checkAuth,
        fetchConversations,
        getMessages,
    } = useAppStore()
    
    const [mode] = useState<Mode>("resume_optimize")
    const [resume, setResume] = useState<any>(null)
    const [report, setReport] = useState<ResumeReport | null>(null)
    const [optimizedSections, setOptimizedSections] = useState<OptimizedSection>({})
    const [showPreview, setShowPreview] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    const [showAuth, setShowAuth] = useState(false)
    const localUser = user
    
    // Initialize ONCE with correct conversationId from props
    useEffect(() => {
        if (initializedRef.current) {
            console.log('[ClientChatShell] Already initialized, skipping')
            return
        }
        
        console.log('[ClientChatShell] Initializing with conversationId:', initialConversationId)
        initializedRef.current = true
        
        init({
            initialConversationId,
            initialMessages: initialMessages as any,
            user: localUser
        })
        
        // Check auth and load conversations once
        checkAuth().catch(console.error)
        fetchConversations().catch(console.error)
    }, [initialConversationId, initialMessages, localUser])
    
    // Sync URL when conversation changes
    const updateUrl = useCallback((id: string) => {
        router.replace(`/chat/${id}`, undefined)
    }, [router])
    
    const handleSelectConversation = useCallback((id: string) => {
        if (id === conversationId) return
        
        console.log('[ClientChatShell] Selecting conversation:', id)
        selectConversation(id)
        updateUrl(id)
        
        // Preload messages in background
        useAppStore.getState().loadMessages(id).catch(console.error)
    }, [conversationId, selectConversation, updateUrl])
    
    async function handleLogout() {
        try {
            const res = await fetch("/api/auth/layout", { method: "POST" })
            if (res.ok) {
                window.location.href = "/"
            }
        } catch (err) {
            console.error("Logout failed:", err)
        }
    }
    
    const handleSectionOptimized = useCallback((key: string, optimized: string) => {
        setOptimizedSections((prev: any) => ({
            ...prev,
            [key]: { optimized, accepted: true },
        }))
    }, [])
    
    const ResumePreview = typeof window !== "undefined"
        ? require("@/components/Resume/ResumePreview").default
        : null
    
    const currentMessages = getMessages(conversationId)
    
    console.log('[ClientChatShell] Render - conversationId:', conversationId, 'pathname:', pathname)
    
    return (
        <div className="flex h-screen">
            <Sidebar
                isLogin={!!localUser}
                onDeleteConversation={(id) => console.log('delete', id)}
                activeId={conversationId}
                onSelectConversation={handleSelectConversation}
            />
            
            <div className="flex-1 min-w-0">
                <ChatPanel
                    conversationId={conversationId}
                    initialMessages={currentMessages}
                    onLogout={handleLogout}
                    user={localUser}
                    mode={mode}
                    setMode={() => {}}
                    resume={resume}
                    report={report}
                />
            </div>
            
            <div className="w-[340px] border-l overflow-hidden">
                <RightPanel
                    conversationId={conversationId}
                    mode={mode}
                    resume={resume}
                    report={report}
                    optimizedSections={optimizedSections}
                    analyzing={analyzing}
                    onReport={setReport}
                    onResumeChange={setResume}
                    onAnalyzingChange={setAnalyzing}
                    onSectionOptimized={handleSectionOptimized}
                    onShowPreview={() => setShowPreview(true)}
                    onTitleUpdate={() => {}}
                />
            </div>
            
            <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
            
            {showPreview && resume && ResumePreview && (
                <ResumePreview
                    resume={resume}
                    optimizedSections={optimizedSections}
                    onClose={() => setShowPreview(false)}
                />
            )}
        </div>
    )
}

