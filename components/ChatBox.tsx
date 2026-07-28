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

    // Only send the latest message; the server rebuilds context from DB
    // and saves the user message exactly once (no client-side pre-save).
    const transport = useMemo(() => {
        return new DefaultChatTransport({
            api: "/api/chat",
            // Intercept non-2xx responses so server error messages
            // (rate limit, validation, auth) reach useChat's onError
            fetch: async (input, init) => {
                const res = await fetch(input, init);
                if (!res.ok) {
                    let msg = "发送失败，请稍后重试";
                    try {
                        const body = await res.clone().json();
                        if (body?.error) msg = body.error;
                    } catch { /* keep default message */ }
                    throw new Error(msg);
                }
                return res;
            },
            prepareSendMessagesRequest(request) {
                const lastMessage = request.messages[request.messages.length - 1];
                return {
                    body: {
                        message: lastMessage,
                        conversationId: conversationIdRef.current,
                        mode: modeRef.current,
                        resume: resumeRef.current
                    }
                };
            }
        })
    }, []);

    const { messages, sendMessage, status, setMessages } = useChat({
        id: conversationId,
        transport,
        onData: (dataPart) => {
            // Server pushes the generated title through the stream as soon
            // as it is ready -- refresh the sidebar immediately, no sleep
            if (dataPart.type === "data-chat-title") {
                onTitleUpdate();
            }
        },
        onFinish() {
            // Final refresh so a brand-new conversation shows up in the sidebar
            onTitleUpdate();
        },
        onError: (err) => {
            // err.message carries the parsed server error from the transport
            alert(err?.message || "发送失败，请稍后重试");
        }
    });

    // Clear + load history in ONE effect with a cancellation flag,
    // so a stale response can never pollute the newly selected conversation
    useEffect(() => {
        let cancelled = false;

        setMessages([]);

        async function loadHistory() {
            if (!conversationId) return;
            try {
                const res = await fetch(`/api/messages?conversationId=${conversationId}`);
                const data = await res.json();
                if (cancelled) return;

                const history = (data.messages ?? []).map((msg: any) => ({
                    id: `db-${msg.id}`,
                    role: msg.role,
                    parts: [{ type: "text", text: msg.content }]
                }));
                setMessages(history);
            } catch (error) {
                if (!cancelled) {
                    console.error("Failed to load history:", error);
                }
            }
        }
        loadHistory();

        return () => { cancelled = true; };
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
        if (!user) {
            alert("\u8bf7\u5148\u767b\u5f55");
            onLogin();
            return;
        }
        sendMessage({ text });
    };

    const isLoading = status === "streaming" || status === "submitted";
    const showThinking = status === "submitted" && messages.length > 0 && messages[messages.length - 1].role === "user";

    const adaptedMessages = useMemo(() => {
        return messages.map((m) => {
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
                    {user ? <button className={styles.logoutButton} onClick={outLogout}>{"\u9000\u51fa"}</button>
                        : <button className={styles.loginButton} onClick={onLogin}>{"\u767b\u5f55"}</button>}
                    {user && <div className={styles.userInfo}>
                        <span className={styles.userIcon}>{"\ud83d\udc64"}</span>
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

