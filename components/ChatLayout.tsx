"use client"
import Sidebar from "./Sidebar"
import ChatBox from "./ChatBox"
import { useEffect, useState } from "react"
import AuthModal from "./AuthModal"
import {Mode} from "@/types/chat"
import ResumePanel  from "./Resume/ResumePanel"
import styles from "@/css/chatlayout.module.css"


export default function ChatLayout() {
  const [conversationId, setConversationId] = useState < string > ("");
  const [refresh, setRefresh] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState(null);
  const [checked,setChecked]=useState(false);
  const [mode,setMode]=useState<Mode>("resume_optimize");
  const [resume,setResume]=useState(null)
   async function handleLogout() {
        const res = await fetch("/api/auth/layout",{
    method:"POST",
      });
      if(res.ok){
        alert("退出成功");
        setUser(null);
      }
    }
  useEffect(() => {
   
    async function checkUser() {
      const res=await fetch(
        "/api/auth/user"
      );
      const data= await res.json();
      if(data.user){
        setUser(data.user)
      }
       setChecked(true);
    }
     checkUser();
    if (!conversationId) {
      setConversationId(crypto.randomUUID());
    }
  }, []);
  const handleRefresh = () => {
    setRefresh(
      pre => pre + 1
    );

  }
  return (
    <div className={styles.layout} >
      <div className={styles.sidebar}>
      <Sidebar
        isLogin={!!user}
        refresh={refresh}
        onDeleteConversation={
          async (id) => {
            console.log("删除聊天id", id);
            const res = await fetch(
              `/api/conversations?id=${id}`,
              { method: "DELETE" }
            );
            if (res.ok) {
              console.log("删除成功");
              setRefresh(pre => pre + 1)
            }
            if (id === conversationId) {
              const newId = crypto.randomUUID();
              setConversationId(newId);
            }
          }
        }
        activeId={conversationId}
        onSelectConversation={
          (id) => {
            console.log("选择会话:", id);
            setConversationId(id);
          }
        } />
</div>

     <div className={styles.chat}>
        <ChatBox 
        resume={resume}
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
        <ResumePanel resume={resume}  onResumeChange={setResume}/>
        </div>

         {
    showAuth &&
    <AuthModal 
      onClose={()=>{
        setShowAuth(false)
      }}
    />
  }
    </div>
  )
}