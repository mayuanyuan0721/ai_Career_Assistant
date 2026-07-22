import styles from "@/css/page.module.css";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function MessageList({
  messages,
  isThinking
}: {
  messages: Message[];
  isThinking:boolean;
}) {
  return (
    <div className={styles.messages}>
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={
            msg.role === "user"
              ? styles.userMessage
              : styles.aiMessage
          }
        >
          <div className={styles.avatar}>
            {msg.role === "user" ? "U" : "AI"}
          </div>

          <div className={styles.content}>
            <Markdown remarkPlugins={[remarkGfm]}  >
            {msg.content}
            </Markdown>
          </div>
        
        </div>
      ))}
        {
            isThinking&&(
              <div>
                 AI正在思考...
              </div>
            )
          }
    </div>
  );
}