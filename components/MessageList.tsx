import styles from "@/css/page.module.css"
import Message from "./Message"

interface MessageItem {
    id: string;
    role: string;
    content: string;
    isReport?: boolean;
}

interface Props {
    messages: MessageItem[];
    isThinking: boolean;
    reportComponent?: React.ReactNode;
}

export default function MessageList({ messages, isThinking, reportComponent }: Props) {
    return (
        <div className={styles.messages}>
            {messages.map((msg) => (
                msg.isReport && reportComponent ? (
                    <div key={msg.id} className={`${styles.messageWrapper} ${styles.messageAssistant}`}>
                        <div className={`${styles.avatar} ${styles.avatarAssistant}`}>🤖</div>
                        <div style={{ background: "transparent", padding: 0, maxWidth: "100%" }}>
                            {reportComponent}
                        </div>
                    </div>
                ) : (
                    <Message key={msg.id} role={msg.role as "user" | "assistant"} content={msg.content} />
                )
            ))}
            {isThinking && (
                <div className={`${styles.messageWrapper} ${styles.messageAssistant}`}>
                    <div className={`${styles.avatar} ${styles.avatarAssistant}`}>🤖</div>
                    <div className={`${styles.bubble} ${styles.bubbleAssistant}`}>
                        <span className={styles.thinking}>思考中</span>
                    </div>
                </div>
            )}
        </div>
    )
}
