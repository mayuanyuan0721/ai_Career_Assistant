'use client';
import React, { useEffect, useState } from "react";
import styles from "@/css/page.module.css";
import InputBox from "@/components/InputBox";
import MessageList from "./MessageList";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {Mode} from "@/types/chat"
import ModeSelector from "./ModeSelector"

interface Props {
  conversationId: string;
  onTitleUpdate:()=>void;
  onLogin:()=>void;
  outLogout:()=>void;
  user:any;
  mode:Mode;
  setMode:(str:string)=>void;
}
  
export default function ChatBox({ conversationId,onTitleUpdate,onLogin,outLogout,user,mode,setMode }: Props) {
  const { messages, sendMessage, status,setMessages } = useChat({
    
    id: conversationId,
     onFinish(){
    console.log(
      "AI完成"
    );
    onTitleUpdate();
 },


    transport: new DefaultChatTransport({
      api: "/api/chat",
      fetch: async (url, options) => {
        console.log("发送时 conversationId:", conversationId);
        console.log("发送时 mode:", mode);
        let body = {};
        //这个叫可选链
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
             mode
          })
        })
      }
    }),
  });

   useEffect(()=>{
    async function loadHistory(){
      if(!conversationId){
        return;
      }
      try{
        const res = await fetch(
          `/api/messages?conversationId=${conversationId}`
        );
        const data = await res.json();
       
        const history =
          (data.messages ?? [])
          .map((msg:any)=>({
            id:
            `${conversationId}-${msg.id}`,
            role:
            msg.role,
            parts:[
              {
                type:"text",
                text:msg.content
              }
            ]
          }));
        setMessages(history);
      }catch(error){
        console.error(
          "加载历史失败:",
          error
        );
      }
    }
    loadHistory();
  },[conversationId,setMessages]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    sendMessage({ text });
  };
  //isLoading  控制输入框  isThinking 控制提示
  //status有三个状态，第一个状态是subimit刚发送，streaming：DeepSeek开始返回，submitted返回完毕
 const isLoading = status === "streaming" || status === "submitted";
 const showThinking =
 status === "submitted" &&
 messages.length > 0 &&
 messages[messages.length-1].role === "user";

  const adaptedMessages = messages.map((m) => ({
    id: m.id,
    role: m.role === "system" ? "assistant" : (m.role as "user" | "assistant"),
    content:
      m.parts
        ?.filter((p) => p.type === "text")
        .map((p) => (p as { type: "text"; text: string }).text)
        .join("") || "",
  }));
   

  return (
    <div className={styles.chatPage}>
      <header className={styles.chatHeader}>
        <h1>AI Assistant</h1>
   
  
<div className={styles.headerRight}>

{
  user ?
  <button 
    className={styles.logoutButton}
    onClick={outLogout}
  >
    退出登录
  </button>
  :
  <button 
    className={styles.loginButton}
    onClick={onLogin}
  >
    登录
  </button>
}

{
  user &&
  <div className={styles.userInfo}>
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
        <MessageList messages={adaptedMessages} isThinking={showThinking}/>
      </main>

      <footer className={styles.inputArea}>
        <ModeSelector mode={mode} setMode={setMode} />

        <InputBox onSend={handleSend} disabled={isLoading} />
      </footer>
    </div>
  );
}

/** 
export default function chatBox(){
    const [messages2,setMessages]=useState<{
     id: number; role: 'user' | 'assistant'; content: string
    }[]>([
      {id:1,role:'user',content:'您好,今天天气怎么样'},
    {id:2,role:'assistant',content:'您好!今天阳光明媚,适合外出活动'},
    {id:3,role:'user',content:'那我要穿什么衣服'},
    {id:4,role:'assistant',content:'建议穿轻薄的长袖,早晚温差大,可以带一件外套'},
    ])

   /**
    * 模拟AI接口回复
    *  const handleSent=(text:string)=>{
        const newUserMsg={
            id:Date.now(),
            role:'user' as const,
            content:text
        };
        setMessages((prev) => [...prev, newUserMsg]);
        setTimeout(()=>{
            const aiReply ={
                id:Date.now()+1,
                role:'assistant' as const,
                content:`收到你的消息：「${text}」，我还在学习中，暂时只能这样回复。`,

            }
            setMessages((pre)=>[...pre,aiReply])
        },1500);
    } 

    //
   const [isWaiting, setIsWaiting] = useState(false);
   const handleSent=async (text:string)=>{
    const newUserMsg={
         id:Date.now(),
         role:'user' as const,
         content:text
    }
    //做一个拼接，将用户说的话，立马加入在当前对话上去
      setMessages((prev) => [...prev, newUserMsg]);
      setIsWaiting(true)
      try{
        const respones=await fetch('/api/chat',{
              method:'POST',
        headers:{
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({message:text}),  
        })
        //解析deeoseek请求后返回的数据
        const data =await respones.json();
        if(!respones.ok){
            throw new Error(data.error || '请求失败')
        }
        //做得是真正的AI回复的功能
        const aiMsg={
            id:Date.now()+1,
                role:'assistant' as const,
                content:data.reply,

        };
        setMessages((prev)=>[...prev,aiMsg])
      }catch(error:any){
        const errorMsg={
            id:Date.now()+1,
              role: 'assistant' as const,
      content: `哎呀，出错了：${error.message || '请检查网络'}`,
        };
           setMessages((prev) => [...prev, errorMsg]);

      }finally{
          setIsWaiting(false);
      }
   }

    return(
        <div className={styles.container}>
             <header className={styles.header}>
               <h1 className={styles.title}>AI 助手</h1>
               <p className={styles.subtitle}>随时为您服务</p>
           </header>
             <MessageList messages={messages2}/>
             <InputBox onSend={handleSent} disabled={isWaiting} />
        </div>
    )
}
*/
