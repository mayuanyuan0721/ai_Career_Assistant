
import styles from "./page.module.css"
export default function(){
    const messages=[
    {id:1,role:'user',content:'您好,今天天气怎么样'},
    {id:2,role:'assistant',content:'您好!今天阳光明媚,适合外出活动'},
    {id:3,role:'user',content:'那我要穿什么衣服'},
    {id:4,role:'assistant',content:'建议穿轻薄的长袖,早晚温差大,可以带一件外套'},
]
    return (
       <div className={styles.container}>
           <header className={styles.header}>
               <h1 className={styles.title}>AI 助手</h1>
               <p className={styles.subtitle}>随时为您服务</p>
           </header>

            {/* 消息列表 */}
           <div className={styles.messages}>
               {messages.map((msg)=>(
                <div key={msg.id} className={`${styles.messageWrapper} ${
                    msg.role==='user'?styles.messagesUser:styles.messageAssistant
                }`}>
                  {/* 头像 */}
              <div
                className={`${styles.avatar} ${
                  msg.role ? styles.avatarUser : styles.avatarAssistant
                }`}
              >
                {msg.role==='user' ? '我' : 'AI'}
              </div>
                 {/* 气泡 */}   
                <div className={`${styles.bubble} ${
                    msg.role=='user'?styles.bubbleUser:styles.bubbleAssistant
                }`}>
                    {msg.content}
                </div>
                </div>
               ))}
           </div>
           {/* 底部输入框*/}
           <div className={styles.footer}>
             <div className={styles.inputRow}>
                <input type="text" placeholder="请输入你的问题" className={styles.input}/>
                <button className={styles.sentButton}>发送</button>
             </div>
           </div>
       </div>

    );
}
