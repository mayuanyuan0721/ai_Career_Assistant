"use client"

import { useEffect, useCallback, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAppStore } from "@/lib/store"
import Sidebar from "@/components/layout/sidebar"
import ChatPanel from "@/components/chat/chat-panel"
import RightPanel from "@/components/RightPanel"
import AuthModal from "@/components/auth/auth-modal"
import { Mode, ConversationType } from "@/types/chat"
import { ResumeReport, OptimizedSection } from "@/types/resume"
import { InterviewData } from "@/types/chat"

interface Props {
    initialMessages: Array<{ id: string; role: string; parts: any[] }>
    user: any
    initialConversationId: string
    initialConversationType?: ConversationType
}

export default function ClientChatShell({ 
    initialMessages, 
    user, 
    initialConversationId,
    initialConversationType = 'chat'
}: Props) {
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
        getConversationById,
    } = useAppStore()
    
    const [mode, setMode] = useState<Mode>("resume_optimize")
    const [resume, setResume] = useState<any>(null)
    const [report, setReport] = useState<ResumeReport | null>(null)
    const [optimizedSections, setOptimizedSections] = useState<OptimizedSection>({})
    const [showPreview, setShowPreview] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    const [showAuth, setShowAuth] = useState(false)
    const [interviewData, setInterviewData] = useState<InterviewData | undefined>(undefined)
    const localUser = user
    
    console.log('[ClientChatShell] Render - conversationId:', conversationId, 'resume:', !!resume)
    
    // Load resume from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('resume-data')
            console.log('[ClientChatShell] Loaded from localStorage:', saved ? 'found' : 'not found')
            if (saved) {
                const data = JSON.parse(saved)
                console.log('[ClientChatShell] Resume data:', data)
                setResume(data.resume)
                setReport(data.report)
                setOptimizedSections(data.optimizedSections || {})
            }
        } catch (err) {
            console.error('[ClientChatShell] Failed to load resume:', err)
        }
    }, [])
    
    // Save resume to localStorage when it changes
    useEffect(() => {
        if (resume) {
            try {
                const data = { resume, report, optimizedSections }
                localStorage.setItem('resume-data', JSON.stringify(data))
                console.log('[ClientChatShell] Saved to localStorage:', !!resume)
            } catch (err) {
                console.error('[ClientChatShell] Failed to save resume:', err)
            }
        }
    }, [resume, report, optimizedSections])
    
    useEffect(() => {
        if (initializedRef.current) {
            return
        }
        
        initializedRef.current = true
        
        console.log('[ClientChatShell] Initializing with conversationId:', initialConversationId)
        
        init({
            initialConversationId,
            initialMessages: initialMessages as any,
            user: localUser
        })
        
        checkAuth().catch(console.error)
        fetchConversations().catch(console.error)
    }, [initialConversationId, initialMessages, localUser])
    
    const currentConversation = getConversationById(conversationId)
    const conversationType = currentConversation?.type || initialConversationType
    
    useEffect(() => {
        if (conversationType === 'interview' && currentConversation?.interview_data) {
            setInterviewData(currentConversation.interview_data)
        }
    }, [conversationType, currentConversation])
    
    // Debug: Log messages
    useEffect(() => {
        const msgs = getMessages(conversationId)
        console.log('[ClientChatShell] Messages for conversation:', conversationId, 'count:', msgs?.length || 0)
    }, [conversationId, getMessages])
    
    const updateUrl = useCallback((id: string) => {
        router.replace("/chat/" + id, undefined)
    }, [router])
    
    const handleSelectConversation = useCallback((id: string) => {
        selectConversation(id)
        updateUrl(id)
    }, [selectConversation, updateUrl])
    
    const handleLogout = useCallback(async () => {
        await fetch("/api/auth/logout", { method: "POST" })
        localStorage.removeItem('resume-data')
        window.location.href = "/"
    }, [])
    
    const handleResumeChange = useCallback((data: any) => {
        console.log('[ClientChatShell] Resume changed:', !!data)
        setResume(data)
    }, [])
    
    const handleReport = useCallback((r: ResumeReport | null) => {
        setReport(r)
    }, [])
    
    const handleAnalyzingChange = useCallback((v: boolean) => {
        setAnalyzing(v)
    }, [])
    
    const handleSectionOptimized = useCallback((key: string, optimized: string) => {
        setOptimizedSections(prev => ({ ...prev, [key]: { optimized, accepted: false } }))
    }, [])
    
    const handleShowPreview = useCallback(() => {
        setShowPreview(v => !v)
    }, [])
    
    const handleTitleUpdate = useCallback(() => {
        fetchConversations().catch(console.error)
    }, [fetchConversations])
    
    if (!isAuthChecked) {
        return null
    }
    
    return (
        <div className="flex h-screen bg-background">
            <Sidebar
                conversations={conversations}
                activeId={conversationId}
                onSelectConversation={handleSelectConversation}
                onLogout={handleLogout}
            />
            
            <div className="flex-1 flex flex-col min-w-0">
                <ChatPanel
                    conversationId={conversationId}
                    conversationType={conversationType}
                    initialMessages={getMessages(conversationId) || []}
                    onLogout={handleLogout}
                    user={localUser}
                    mode={mode}
                    setMode={setMode}
                    resume={resume}
                    report={report}
                />
            </div>
            
            <div className="w-[400px] border-l">
                <RightPanel
                    conversationId={conversationId}
                    mode={mode}
                    resume={resume}
                    report={report}
                    optimizedSections={optimizedSections}
                    analyzing={analyzing}
                    onResumeChange={handleResumeChange}
                    onReport={handleReport}
                    onAnalyzingChange={handleAnalyzingChange}
                    onSectionOptimized={handleSectionOptimized}
                    onShowPreview={handleShowPreview}
                    onTitleUpdate={handleTitleUpdate}
                />
            </div>
            
            <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
        </div>
    )
}