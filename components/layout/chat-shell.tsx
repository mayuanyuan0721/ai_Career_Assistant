"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/layout/sidebar"
import ChatPanel from "@/components/chat/chat-panel"
import RightPanel from "@/components/RightPanel"
import AuthModal from "@/components/auth/auth-modal"
import { Mode } from "@/types/chat"
import { ResumeReport, OptimizedSection } from "@/types/resume"
import { prefetchMessages, getMessageFromCache } from "@/lib/message-cache"

interface UIMessage {
    id: string
    role: "user" | "assistant" | "system"
    parts: { type: string; text?: string; [key: string]: unknown }[]
}

interface Props {
    conversationId: string
    initialMessages: UIMessage[]
}

export default function ChatShell({ conversationId: initialId, initialMessages }: Props) {
    const router = useRouter()

    const [activeId, setActiveId] = useState(initialId)
    const [messages, setMessages] = useState<UIMessage[]>(initialMessages)

    const [refreshKey, setRefreshKey] = useState(0)
    const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), [])

    const loadedRef = useRef(new Set<string>())
    loadedRef.current.add(initialId)

    // Don't use showAuth state here - let ChatPanel manage it separately
    // to avoid auth modal appearing on every page reload
    const [user, setUser] = useState<any>(null)
    const [mode, setMode] = useState<Mode>("resume_optimize")
    const [resume, setResume] = useState<any>(null)
    const [report, setReport] = useState<ResumeReport | null>(null)
    const [optimizedSections, setOptimizedSections] = useState<OptimizedSection>({})
    const [showPreview, setShowPreview] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)

    // Check auth once on mount
    useEffect(() => {
        let cancelled = false
        fetch("/api/auth/user")
            .then((r) => r.json())
            .then((data) => { if (!cancelled && data.user) setUser(data.user) })
            .catch(() => {})
        return () => { cancelled = true }
    }, [])

    // Load messages when switching conversations
    const loadMessages = useCallback(async (id: string) => {
        if (loadedRef.current.has(id)) return
        try {
            const res = await fetch(`/api/messages?conversationId=${id}`)
            const data = await res.json()
            const history: UIMessage[] = (data.messages ?? []).map((msg: any) => ({
                id: `db-${msg.id}`,
                role: msg.role,
                parts: [{ type: "text", text: msg.content }],
            }))
            loadedRef.current.add(id)
            setMessages(history)
        } catch (err) {
            console.error("Failed to load messages:", err)
        }
    }, [])

    // Clear resume state on conversation change
    useEffect(() => {
        setResume(null)
        setReport(null)
        setOptimizedSections({})
        setAnalyzing(false)
    }, [activeId])

    // Switch conversation: prefetch first, then navigate
    const handleSelectConversation = useCallback(async (id: string) => {
        if (id === activeId) return
        setActiveId(id)
        
        // Try cache first, or prefetch in background
        let localMessages = getMessageFromCache(id)
        if (!localMessages) {
            // Start prefetch while showing empty state
            prefetchMessages(id).catch(console.error)
        }
        
        setMessages((localMessages ?? []).map((msg: { id: string; role: "user" | "assistant"; content: string }) => ({
            id: `db-${msg.id}`,
            role: msg.role,
            parts: [{ type: "text", text: msg.content }],
        })))
        
        // RSC will reload with fresh data
        router.push(`/chat/${id}`)
    }, [activeId, router])

    async function handleLogout() {
        const res = await fetch("/api/auth/layout", { method: "POST" })
        if (res.ok) {
            setUser(null)
            setResume(null)
            setReport(null)
            setOptimizedSections({})
            setAnalyzing(false)
            setMode("resume_optimize")
            triggerRefresh()
            router.push("/chat")
        }
    }

    const handleDeleteConversation = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/conversations?id=${id}`, { method: "DELETE" })
            if (res.ok) {
                triggerRefresh()
                if (id === activeId) {
                    router.push("/chat")
                }
            } else {
                const errorData = await res.json().catch(() => null)
                alert("Delete failed: " + (errorData?.error || res.statusText))
            }
        } catch (err) {
            alert("Delete error: " + (err as Error).message)
        }
    }, [activeId, router, triggerRefresh])

    const handleSectionOptimized = useCallback((key: string, optimized: string) => {
        setOptimizedSections((prev) => ({
            ...prev,
            [key]: { optimized, accepted: true },
        }))
    }, [])

    const ResumePreview = typeof window !== "undefined"
        ? require("@/components/Resume/ResumePreview").default
        : null

    return (
        <div className="flex h-screen">
            <Sidebar
                isLogin={!!user}
                refreshKey={refreshKey}
                onDeleteConversation={handleDeleteConversation}
                activeId={activeId}
                onSelectConversation={handleSelectConversation}
            />

            <div className="flex-1 min-w-0">
                <ChatPanel
                    conversationId={activeId}
                    initialMessages={messages}
                    onLogout={handleLogout}
                    user={user}
                    mode={mode}
                    setMode={setMode}
                    resume={resume}
                    report={report}
                />
            </div>

            <div className="w-[340px] border-l overflow-hidden">
                <RightPanel
                    conversationId={activeId}
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
                    onTitleUpdate={triggerRefresh}
                />
            </div>

            {/* AuthModal removed - ChatPanel manages it internally */}

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
