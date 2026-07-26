'use client';

import React, { useEffect, useMemo, useRef } from "react";
import styles from "@/css/page.module.css";
import InputBox from "@/components/InputBox";
import MessageList from "./MessageList";
import ResumeAnalysis from "./Resume/ResumeAnalysis";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Mode } from "@/types/chat";
import { ResumeReport } from "@/types/resume";
import ModeSelector from "./ModeSelector"


interface Props {
    conversationId: string;
    onTitleUpdate: () => void;
    onLogin: () => void;
    outLogout: () => void;
    user: any;
    mode: Mode;
    setMode: (mode: Mode) => void;
    resume: any;
    report: ResumeReport | null;
}


export default function ChatBox({ conversationId, onTitleUpdate, onLogin, outLogout, user, mode, setMode, resume, report }: Props) {

    const modeRef = useRef(mode);
    const resumeRef = useRef(resume);
    const conversationIdRef = useRef(conversationId);

    useEffect(() => { modeRef.current = mode; }, [mode]);
    useEffect(() => { resumeRef.current = resume; }, [resume]);
    useEffect(() => { conversationIdRef.current = conversationId; }, [conversationId]);

    const transport = useMemo(() => {
        return new DefaultChatTransport({
            api: "/api/chat",
            fetch: async (url, options) => {
                let body: any = {};
                if (options?.body) {
                    body = JSON.parse(options.body as string);
                }

                // FIX: Use conversationIdRef.current to get latest value
                const currentConvId = conversationIdRef.current;

                // FIX: Save user message to DB before sending
                // This prevents message loss when loadHistory runs
                const lastMsg = body.messages?.[body.messages.length - 1];
                if (lastMsg?.role === 'user' && lastMsg?.parts && currentConvId) {
                    const userText = lastMsg.parts
                        .filter((p: any) => p.type === 'text')
                        .map((p: any) => p.text)
                        .join('');
                    if (userText.trim()) {
                        try {
                            await fetch('/api/messages', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    conversationId: currentConvId,
                                    role: 'user',
                                    content: userText
                                })
                            });
                        } catch (e) {
                            console.warn('Failed to save user message:', e);
                        }
                    }
                }

                return fetch(url, {
                    ...options,
                    body: JSON.stringify({
                        ...body,
                        conversationId: currentConvId,
                        mode: modeRef.current,
                        resume: resumeRef.current
                    })
                })
            }
        })
    }, []);

    const { messages, sendMessage, status, setMessages } = useChat({
        id: conversationId,
        transport,
        async onFinish(message) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            onTitleUpdate();
        }
    });

    // FIX: Clear useChat state when conversationId changes
    // This prevents old messages from mixing with new conversation
    useEffect(() => {
        if (conversationId) {
            setMessages([]);
        }
    }, [conversationId, setMessages]);

    useEffect(() => {
        async function loadHistory() {
            if (!conversationId) return;
            try {
                const res = await fetch(`/api/messages?conversationId=${conversationId}`);
                const data = await res.json();

                // FIX: Deduplicate messages by database ID
                const seen = new Set<string>();
                const history = (data.messages ?? [])
                    .filter((msg: any) => {
                        if (seen.has(msg.id)) return false;
                        seen.add(msg.id);
                        return true;
                    })
                    .map((msg: any) => ({
                        id: `db-${msg.id}`,
                        role: msg.role,
                        parts: [{ type: "text", text: msg.content }]
                    }));
                setMessages(history);
            } catch (error) {
                console.error("Failed to load history:", error);
            }
        }
        loadHistory();
    }, [conversationId, setMessages]);


    const reportAdded = useRef(false);

    useEffect(() => {
        reportAdded.current = false;
    }, [conversationId]);

    useEffect(() => {
        if (!report || reportAdded.current) return;
        reportAdded.current = true;
        setMessages((prev) => [
            ...prev,
            {
                id: `report-${Date.now()}`,
                role: "assistant",
                parts: [{ type: "text", text: "__REPORT__" }]
            }
        ]);
    }, [report, setMessages]);


    const handleSend = (text: string) => {
        if (!text.trim()) return;
        // FIX: Check conversationId before sending
        if (!conversationIdRef.current) {
            alert("Please create or select a conversation first");
            return;
        }
        sendMessage({ text });
    };

    const isLoading = status === "streaming" || status === "submitted";
    const showThinking = status === "submitted" && messages.length > 0 && messages[messages.length - 1].role === "user";

    // FIX: Deduplicate messages in adaptedMessages as well
    const adaptedMessages = useMemo(() => {
        const seen = new Set<string>();
        return messages
            .filter((m) => {
                // Keep __REPORT__ messages (they have unique IDs)
                const text = m.parts?.filter((p) => p.type === "text").map((p) => (p as any).text).join("") || "";
                if (text === "__REPORT__") return true;
                // Deduplicate by id
                if (seen.has(m.id)) return false;
                seen.add(m.id);
                return true;
            })
            .map((m) => {
                const text = m.parts
                    ?.filter((p) => p.type === "text")
                    .map((p) => (p as { type: string; text: string }).text)
                    .join("") || "";

                return {
                    id: m.id,
                    role: m.role === "system" ? "assistant" : (m.role as "user" | "assistant"),
                    content: text,
                    isReport: text === "__REPORT__"
                };
            });
    }, [messages]);


    return (
        <div className={styles.chatPage}>
            <header className={styles.chatHeader}>
                <h1>AI Assistant</h1>
                <div className={styles.headerRight}>
                    {user ? <button className={styles.logoutButton} onClick={outLogout}>退出</button>
                        : <button className={styles.loginButton} onClick={onLogin}>登录</button>}
                    {user && <div className={styles.userInfo}>
                        <span className={styles.userIcon}>👤</span>
                        <span>{user.email}</span>
                    </div>}
                </div>
            </header>
            <main className={styles.messageArea}>
                <MessageList
                    messages={adaptedMessages}
                    isThinking={showThinking}
                    reportComponent={report ? <ResumeAnalysis report={report} /> : undefined}
                />
            </main>
            <footer className={styles.inputArea}>
                <ModeSelector mode={mode} setMode={setMode} />
                <InputBox onSend={handleSend} disabled={isLoading} />
            </footer>
        </div>
    );
}
