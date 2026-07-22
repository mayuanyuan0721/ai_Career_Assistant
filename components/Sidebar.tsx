"use client"
import {Trash2} from "lucide-react";
import { useEffect,useState } from "react"
import styles from "@/css/siderbar.module.css"
interface Conversation{
    id:string;
    title:string;
    created_at:string;
    updated_at:string;
}

interface Props{
    onSelectConversation:(id:string)=>void;
    activeId:string;
    refresh:number;
    onDeleteConversation:(id:string)=>void;
    isLogin:boolean
}


export default function Sidebar({onSelectConversation,activeId,onDeleteConversation,refresh,isLogin}:Props){
    const [conversations,setConversations]=useState<Conversation[]>([]);
      const [loading, setLoading] = useState(true);
     useEffect(() => {
        if(!isLogin){
            return ;
        }
    fetch("/api/conversations")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json(); // ③ 返回 Promise
      })
      .then((data) => {
         console.log(
        "历史记录:",
        data
    );
         setConversations(
        data.conversations ?? []
    );
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [refresh,isLogin]);


    return(
        <div className={styles.sidebar}>
         <h2>历史记录</h2>
            <button className={styles.newChat} onClick={()=>{
            if(!isLogin){
                 alert("请先登录");
                 return;
            }
            const id=crypto.randomUUID();
             onSelectConversation(id);}}>
                +
                 新聊天
            </button>
            
        {
           conversations.map(item=>{
         return (
       <div key={item.id} className={
        activeId==item.id? `${styles.item} ${styles.active}`:styles.item
        }
       onClick={()=>{onSelectConversation(item.id)}
        }
       >
          <span className={styles.title}>
              {item.title}
          </span>
         <button className={styles.deleteBtn} onClick={(e)=>{e.stopPropagation();
             if(
               confirm("确定删除这个聊天吗？")
              ){
              onDeleteConversation(item.id);
               }}}>
            <Trash2 size={16}/>
         </button>
       </div>
           )
       })
        }
        </div>

    )
}