"use client"
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react"
import styles from "@/css/siderbar.module.css"

interface Conversation {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
}

interface Props {
    onSelectConversation: (id: string) => void;
    activeId: string;
    refresh: number;
    onDeleteConversation: (id: string) => void;
    isLogin: boolean;
}


export default function Sidebar({ onSelectConversation, activeId, onDeleteConversation, refresh, isLogin }: Props) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLogin) {
            setConversations([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        fetch("/api/conversations")
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch");
                return res.json();
            })
            .then((data) => {
                console.log("History:", data);
                setConversations(data.conversations ?? []);
            })
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, [refresh, isLogin]);


    return (
        <div className={styles.sidebar}>
            <h2>History</h2>
            <button className={styles.newChat} onClick={() => {
                if (!isLogin) {
                    alert("Please login first");
                    return;
                }
                // No API call needed: just switch to a fresh client-generated id.
                // The server creates the conversation when the first message is sent,
                // so abandoned empty chats never pollute the history list.
                onSelectConversation(crypto.randomUUID());
            }}>
                + New Chat
            </button>

            {
                conversations.map(item => {
                    return (
                        <div key={item.id} className={
                            activeId == item.id ? `${styles.item} ${styles.active}` : styles.item
                        }
                            onClick={() => { onSelectConversation(item.id) }}
                        >
                            <span className={styles.title}>
                                {item.title}
                            </span>
                            <button className={styles.deleteBtn} onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm("你确定要删除这个聊天?")) {
                                    await onDeleteConversation(item.id);
                                }
                            }}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )
                })
            }
        </div>
    )
}
