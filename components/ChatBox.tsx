'use client';

import React, { useEffect, useMemo, useRef } from "react";
import styles from "@/css/page.module.css";
import InputBox from "@/components/InputBox";
import MessageList from "./MessageList";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Mode } from "@/types/chat";
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
    resumeAnalysis: string;
}


export default function ChatBox({ conversationId, onTitleUpdate, onLogin, outLogout, user, mode, setMode, resume, resumeAnalysis }: Props) {

    // Use refs for values that should not recreate transport
    const modeRef = useRef(mode);
    const resumeRef = useRef(resume);
    const conversationIdRef = useRef(conversationId);

    useEffect(() => { modeRef.current = mode; }, [mode]);
    useEffect(() => { resumeRef.current = resume; }, [resume]);
    useEffect(() => { conversationIdRef.current = conversationId; }, [conversationId]);

    /**
     * Create chat transport - only recreated when identity changes
     */
    const transport = useMemo(() => {
        return new DefaultChatTransport({
            api: "/api/chat",
            fetch: async (url, options) => {
                console.log("Sending conversationId:", conversationIdRef.current);
                console.log("Sending mode:", modeRef.current);
                console.log("Sending resume:", resumeRef.current);
                let body: any = {};
                if (options?.body) {
                    body = JSON.parse(
                        options.body as string
                    );
                }
                return fetch(url, {
                    ...options,
                    body: JSON.stringify({
                        ...body,
                        conversationId: conversationIdRef.current,
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
            console.log("AI finished", message);
            // Wait for server-side onFinish to complete title generation
            await new Promise(resolve => setTimeout(resolve, 3000));
            onTitleUpdate();
        }
    });


    /**
     * Load history messages
     */
    useEffect(() => {
        async function loadHistory() {
            if (!conversationId) {
                return;
            }
            try {
                const res = await fetch(
                    `/api/messages?conversationId=${conversationId}`
                );
                const data = await res.json();
                const history =
                    (data.messages ?? [])
                        .map((msg: any) => ({
                            id:
                                `${conversationId}-${msg.id}`,
                            role:
                                msg.role,
                            parts: [
                                {
                                    type: "text",
                                    text: msg.content
                                }
                            ]
                        }));
                setMessages(history);
            } catch (error) {
                console.error(
                    "Failed to load history:",
                    error
                );
            }
        }
        loadHistory();
    }, [
        conversationId,
        setMessages
    ]);


    const analysisAdded = useRef(false);

    // Reset analysisAdded ref when conversationId changes
    useEffect(() => {
        analysisAdded.current = false;
    }, [conversationId]);

    useEffect(() => {
        console.log(
            "Received resume analysis:",
            resumeAnalysis
        );

        if (!resumeAnalysis || analysisAdded.current) {
            return;
        }
        analysisAdded.current = true;
        setMessages((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                role: "assistant",
                parts: [
                    {
                        type: "text",
                        text: resumeAnalysis
                    }
                ]

            }
        ])
    }, [resumeAnalysis, setMessages])


    const handleSend = (text: string) => {
        if (!text.trim())
            return;
        sendMessage({ text });
    };

    const isLoading = status === "streaming" || status === "submitted";
    const showThinking = status === "submitted" && messages.length > 0 && messages[messages.length - 1].role === "user";
    const adaptedMessages =
        messages.map((m) => ({
            id: m.id,
            role:
                m.role === "system"
                    ?
                    "assistant"
                    :
                    (m.role as "user" | "assistant"),
            content:
                m.parts
                    ?.filter(
                        (p) => p.type === "text"
                    )
                    .map(
                        (p) => (p as {
                            type: "text",
                            text: string
                        }).text
                    )
                    .join("")
                ||
                ""
        }));


    return (
        <div className={styles.chatPage}>
            <header className={styles.chatHeader}>
                <h1>
                    AI Assistant
                </h1>
                <div className={styles.headerRight}>
                    {user ? <button className={styles.logoutButton} onClick={outLogout}>
                        Exit
                    </button>
                        :
                        <button className={styles.loginButton} onClick={onLogin}>
                            Login
                        </button>

                    }
                    {user && <div className={styles.userInfo}>
                        <span className={styles.userIcon}>
                            👤
                        </span>
                        <span>
                            {user.email}
                        </span>
                    </div>
                    }
                </div>
            </header>
            <main className={styles.messageArea}>
                <MessageList messages={adaptedMessages} isThinking={showThinking} />
            </main>
            <footer className={styles.inputArea}>
                <ModeSelector mode={mode} setMode={setMode} />
                <InputBox onSend={handleSend} disabled={isLoading} />
            </footer>
        </div>
    );
}
