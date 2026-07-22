"use client"
import Sidebar from "./Sidebar"
import ChatBox from "./ChatBox"
import { useEffect, useState } from "react"
import AuthModal from "./AuthModal"


export default function ChatLayout() {
  const [conversationId, setConversationId] = useState < string > ("");
  const [refresh, setRefresh] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState(null);
  const [checked,setChecked]=useState(false);
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
    <div style={{
      display: "flex"
    }}>
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


      <div style={{ flex: 1 }}>
        <ChatBox 
        user={user}
        outLogout={handleLogout}
        conversationId={conversationId}
          onTitleUpdate={handleRefresh}
          onLogin={() => {
            setShowAuth(true)
          }}
        />
        {
          showAuth && <AuthModal onClose={() => { setShowAuth(false) }} />
        }
      </div>
    </div>
  )
}