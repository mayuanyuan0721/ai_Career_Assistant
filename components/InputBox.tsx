"use client";

import { useState } from "react";
import styles from "@/css/InputBox.module.css";

interface Props {
  onSend: (text:string) => void;
  disabled?: boolean;
}

export default function InputBox({ onSend, disabled }: Props) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim() || disabled) return;
    onSend(text);
    setText("");
  };

  const handleKeyDown = (e:React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={styles.inputWrapper}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="给 AI 发送消息..."
        disabled={disabled}
      />
      <button onClick={handleSubmit} disabled={disabled}>
        ↑
      </button>
    </div>
  );
}