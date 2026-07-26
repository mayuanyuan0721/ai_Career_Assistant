"use client"
import Sidebar from "./Sidebar"
import ChatBox from "./ChatBox"
import { useEffect, useState } from "react"
import AuthModal from "./AuthModal"
import { Mode } from "@/types/chat"
import { ResumeReport, OptimizedSection } from "@/types/resume"
import ResumePreview from "./Resume/ResumePreview"
import styles from "@/css/chatlayout.module.css"
import RightPanel from "./RightPanel"


export default function ChatLayout() {
    const [conversationId, setConversationId] = useState<string>("");
    const [refresh, setRefresh] = useState(0);
    const [showAuth, setShowAuth] = useState(false);
    const [user, setUser] = useState(null);
    const [checked, setChecked] = useState(false);
    const [mode, setMode] = useState<Mode>("resume_optimize");
    const [resume, setResume] = useState(null);
    const [report, setReport] = useState<ResumeReport | null>(null);
    const [optimizedSections, setOptimizedSections] = useState<OptimizedSection>({});
    const [showPreview, setShowPreview] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    async function handleLogout() {
        const res = await fetch("/api/auth/layout", {
            method: "POST",
        });
        if (res.ok) {
            alert("Logout successful");
            setUser(null);
            setConversationId("");
            setResume(null);
            setReport(null);
            setOptimizedSections({});
            setAnalyzing(false);
            setMode("resume_optimize");
            setRefresh(pre => pre + 1);
        }
    }

    useEffect(() => {
        async function checkUser() {
            const res = await fetch("/api/auth/user");
            const data = await res.json();
            if (data.user) {
                setUser(data.user);
            }
            setChecked(true);
        }
        checkUser();
    }, []);

    // Clear resume-related state when switching conversations
    useEffect(() => {
        setResume(null);
        setReport(null);
        setOptimizedSections({});
        setAnalyzing(false);
    }, [conversationId]);

    const handleRefresh = () => {
        console.log("Refresh Sidebar");
        setRefresh(pre => pre + 1);
    }

    // Handle section optimization result
    const handleSectionOptimized = (key: string, optimized: string) => {
        setOptimizedSections(prev => ({
            ...prev,
            [key]: { optimized, accepted: true }
        }));
    };

    return (
        <div className={styles.layout} >
            <div className={styles.sidebar}>
                <Sidebar
                    isLogin={!!user}
                    refresh={refresh}
                    onDeleteConversation={
                        async (id) => {
                            console.log("Delete conversation id", id);
                            try {
                                const res = await fetch(
                                    `/api/conversations?id=${id}`,
                                    { method: "DELETE" }
                                );
                                if (res.ok) {
                                    console.log("Delete successful");
                                    setRefresh(pre => pre + 1);
                                    if (id === conversationId) {
                                        setConversationId("");
                                    }
                                } else {
                                    const errorData = await res.json().catch(() => null);
                                    console.error("Delete failed:", res.status, errorData);
                                    alert("Delete failed: " + (errorData?.error || res.statusText));
                                }
                            } catch (err) {
                                console.error("Delete error:", err);
                                alert("Delete error: " + (err as Error).message);
                            }
                        }
                    }
                    activeId={conversationId}
                    onSelectConversation={
                        (id) => {
                            console.log("Select conversation:", id);
                            setConversationId(id);
                        }
                    } />
            </div>

            <div className={styles.chat}>
                <ChatBox
                    resume={resume}
                    report={report}
                    setMode={setMode}
                    mode={mode}
                    user={user}
                    outLogout={handleLogout}
                    conversationId={conversationId}
                    onTitleUpdate={handleRefresh}
                    onLogin={() => {
                        setShowAuth(true)
                    }}
                />
            </div>

            <div className={styles.resume}>
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
                    onTitleUpdate={handleRefresh} />
            </div>

            {showAuth && <AuthModal onClose={() => { setShowAuth(false) }} />}

            {showPreview && resume && (
                <ResumePreview
                    resume={resume}
                    optimizedSections={optimizedSections}
                    onClose={() => setShowPreview(false)}
                />
            )}
        </div>
    )
}
