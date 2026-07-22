import styles from "@/css/page.module.css"

interface MessageProps {
    role:'user'|'assistant'
    content: string
}

export default function Messages({role,content}:MessageProps){
    const isUser=role==='user'
     {/* 消息列表 */}
    const  wrapperClass=`${styles.messageWrapper} ${
        isUser?styles.messagesUser:styles.messageAssistant
    }`;
     {/* 头像 */}
    const avatarClass=`${styles.avatar}${
        isUser? styles.avatarUser:styles.avatarAssistant
    }`;
      {/* 气泡 */}
    const bubbleClass=`${styles.bubble} ${
        isUser? styles.bubbleUser:styles.bubbleAssistant
    }`;
    return (
        <div className={wrapperClass}>
            <div className={avatarClass}>{isUser?'我':'AI'}</div>
            <div className={bubbleClass}>{content}</div>
        </div>
    )
}