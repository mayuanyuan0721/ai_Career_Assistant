"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

interface MessageProps {
    role: "user" | "assistant"
    content: string
    isStreaming?: boolean
    previousUserContent?: string
    onApplySectionOptimization?: (key: string, aiContent: string, userOriginal: string) => void
}

export default function Message({ 
    role, 
    content, 
    isStreaming,
    previousUserContent,
    onApplySectionOptimization
}: MessageProps) {
    const isUser = role === "user"

    return (
        <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
            {/* Avatar */}
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shrink-0 ${
                isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
            }`}>
                {isUser ? "\u6211" : "AI"}
            </div>

            {/* Bubble */}
            <div className={`rounded-lg px-4 py-2 max-w-[80%] ${
                isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
            }`}>
                {isUser ? (
                    <span>{content}</span>
                ) : (
                    <div className="markdown-body">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                code({ className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(className || "")
                                    const codeString = String(children).replace(/\n$/, "")

                                    if (!match && !codeString.includes("\n")) {
                                        return (
                                            <code className="inline-code" {...props}>
                                                {children}
                                            </code>
                                        )
                                    }

                                    return (
                                        <div className="code-block-wrap">
                                            <div className="code-block-header">
                                                <span>{match?.[1] || "code"}</span>
                                                <button
                                                    className="code-copy-btn"
                                                    onClick={() => navigator.clipboard.writeText(codeString)}
                                                >
                                                    {"\u590d\u5236"}
                                                </button>
                                            </div>
                                            <SyntaxHighlighter
                                                style={oneDark}
                                                language={match?.[1] || "text"}
                                                PreTag="div"
                                                customStyle={{ margin: 0, borderRadius: 0, fontSize: "0.875rem" }}
                                            >
                                                {codeString}
                                            </SyntaxHighlighter>
                                        </div>
                                    )
                                }
                            }}
                        >
                            {content}
                        </ReactMarkdown>
                        <div className="flex gap-2 mt-2">
                            {!isUser && onApplySectionOptimization && (
                                <button
                                    onClick={() => {
                                        const key = `assistant_${Date.now()}`
                                        const aiContent = content.replace(/\s*$/, '')
                                        const userOriginal = previousUserContent || ''
                                        onApplySectionOptimization(key, aiContent, userOriginal)
                                    }}
                                    style={{
                                        background: '#f0fdf4',
                                        border: '1px solid #bbf7d0',
                                        color: '#166534',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    应用此建议到简历
                                </button>
                            )}
                            {isStreaming && <span className="streaming-cursor">▎</span>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
