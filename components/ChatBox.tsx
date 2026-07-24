'use client';

import React, { useEffect, useMemo,useRef } from "react";
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

  /**
   * 创建聊天请求传输
   */
  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: "/api/chat",
      fetch: async (url, options) => {
        console.log("发送时 conversationId:", conversationId);
        console.log("发送时 mode:", mode);
        console.log("发送时 resume:", resume);
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
            conversationId,
            mode,
            resume
          })
        })
      }
    })
  }, [
    conversationId,
    mode,
    resume
  ]);

  const { messages, sendMessage, status, setMessages } = useChat({
    id: conversationId,
    transport,
    onFinish() {
      console.log("AI完成");
      onTitleUpdate();
    }
  });


  /**
   * 加载历史消息
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
          "加载历史失败:",
          error
        );
      }
    }
    loadHistory();
  }, [
    conversationId,
    setMessages
  ]);


  const analysisAdded =useRef(false);
  useEffect(()=>{
 console.log(
   "收到简历分析:",
   resumeAnalysis
 );

    if(!resumeAnalysis||analysisAdded.current){
      return;
    }
    setMessages((prev)=>[
      ...prev,
      {
        id:crypto.randomUUID(),
        role:"assistant",
        parts:[
          {
             type:"text",
            text:resumeAnalysis
          }
        ]

      }
    ])
  },[resumeAnalysis,setMessages])


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
            退出登录
          </button>
            :
            <button className={styles.loginButton} onClick={onLogin}>
              登录
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