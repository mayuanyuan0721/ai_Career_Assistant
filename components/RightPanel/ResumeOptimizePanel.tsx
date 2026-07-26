"use client"

import { useState } from "react"
import styles from "@/css/resumePanel.module.css"
import ResumeUpload from "@/components/Resume/ResumeUpload"
import { ResumeReport, OptimizedSection } from "@/types/resume"


interface Props {
    resume: any;
    report: ResumeReport | null;
    optimizedSections: OptimizedSection;
    onResumeChange: (data: any) => void;
    onReport: (report: ResumeReport | null) => void;
    analyzing: boolean;
    onAnalyzingChange: (value: boolean) => void;
    onSectionOptimized: (key: string, optimized: string) => void;
    onShowPreview: () => void;
    conversationId: string;
    onTitleUpdate: () => void;
}


export default function ResumeOptimizePanel({
    resume, report, optimizedSections, onResumeChange, onReport,
    analyzing, onAnalyzingChange, onSectionOptimized, onShowPreview,
    conversationId, onTitleUpdate
}: Props) {

    const [optimizingKey, setOptimizingKey] = useState<string | null>(null);
    const [optimizeResult, setOptimizeResult] = useState<any>(null);

    async function handleDeepOptimize(section: any, index: number) {
        const key = `${section.type}_${index}`;
        setOptimizingKey(key);
        setOptimizeResult(null);

        try {
            const res = await fetch("/api/resume/optimize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    section: section.type,
                    sectionName: section.name || "",
                    original: section.original,
                    targetRole: "前端开发工程师",
                    skills: resume?.skills || []
                })
            });

            if (!res.ok) {
                alert("优化失败，请重试");
                return;
            }

            const data = await res.json();
            setOptimizeResult(data.data);

            // Auto-accept the optimization
            onSectionOptimized(key, data.data.optimized);
        } catch (err) {
            console.error("Optimize error:", err);
            alert("优化请求失败: " + (err as Error).message);
        } finally {
            setOptimizingKey(null);
        }
    }

    return (
        <div className={styles.panel}>
            <h2>简历优化</h2>
            <p className={styles.subTitle}>AI Career Assistant</p>

            {!resume ? (
                <div className={styles.empty}>
                    <h3>上传你的简历</h3>
                    <p>支持 .md / .pdf / .docx 格式</p>
                    {conversationId && (
                        <ResumeUpload
                            conversationId={conversationId}
                            onAnalysis={onReport}
                            onParsed={onResumeChange}
                            onAnalysisStart={() => { onAnalyzingChange(true) }}
                            onAnalysisEnd={() => { onAnalyzingChange(false) }}
                            onTitleUpdate={onTitleUpdate} />
                    )}
                </div>
            ) : (
                <div>
                    {/* File status */}
                    <div className={styles.card}>
                        <div className={styles.file}>
                            <span>📄</span>
                            <div>
                                <h4>简历已上传</h4>
                                <p>{analyzing ? "⏳ AI分析中..." : "✅ 分析完成"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Score summary */}
                    {report && !report._raw && (
                        <div className={styles.card}>
                            <h3 style={{ margin: "0 0 10px", fontSize: 15 }}>
                                📊 综合评分：
                                <span style={{
                                    fontSize: 28,
                                    fontWeight: 700,
                                    color: report.score.total >= 70 ? "#22c55e" : report.score.total >= 50 ? "#f59e0b" : "#ef4444",
                                    marginLeft: 8
                                }}>
                                    {report.score.total}
                                </span>
                            </h3>
                            <p style={{ fontSize: 13, color: "#555", margin: 0 }}>{report.summary}</p>
                        </div>
                    )}

                    {/* Sections with optimize buttons */}
                    {report?.sections?.map((sec, i) => {
                        const key = `${sec.type}_${i}`;
                        const isOptimized = optimizedSections[key]?.accepted;
                        const isOptimizing = optimizingKey === key;

                        return (
                            <div key={i} className={styles.section}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <h3 style={{ margin: 0, fontSize: 14 }}>
                                        {sec.type === "project" ? "📁" : sec.type === "skills" ? "🛠" : "💼"}
                                        {" "}{sec.name || sec.type}
                                    </h3>
                                    <span style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: sec.score >= 70 ? "#22c55e" : "#f59e0b"
                                    }}>{sec.score}分</span>
                                </div>

                                {/* Show optimized text if accepted */}
                                {isOptimized && (
                                    <div style={{
                                        marginTop: 8,
                                        padding: "8px 10px",
                                        background: "#f0fdf4",
                                        borderRadius: 8,
                                        fontSize: 12,
                                        color: "#166534",
                                        whiteSpace: "pre-wrap"
                                    }}>
                                        ✅ {optimizedSections[key].optimized.slice(0, 120)}...
                                    </div>
                                )}

                                {/* Deep optimize button */}
                                <button
                                    className={styles.button}
                                    style={{
                                        marginTop: 8,
                                        background: isOptimized ? "#22c55e" : "#111827",
                                        fontSize: 12,
                                        height: 32
                                    }}
                                    onClick={() => handleDeepOptimize(sec, i)}
                                    disabled={isOptimizing}
                                >
                                    {isOptimizing ? "⏳ 优化中..." : isOptimized ? "✅ 已优化 - 重新优化" : "🔧 深度优化此段"}
                                </button>

                                {/* Show deep optimize result */}
                                {optimizeResult && optimizingKey === null && `${sec.type}_${i}` === key && (
                                    <div style={{ marginTop: 8 }}>
                                        {optimizeResult.interview_questions?.length > 0 && (
                                            <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                                                <strong>面试追问预测：</strong>
                                                <ul style={{ paddingLeft: 16, margin: "4px 0" }}>
                                                    {optimizeResult.interview_questions.slice(0, 3).map((q: string, j: number) => (
                                                        <li key={j}>{q}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Action buttons */}
                    {report && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 15 }}>
                            <button
                                className={styles.button}
                                onClick={onShowPreview}
                                style={{ background: "#2563eb" }}
                            >
                                📄 预览优化后简历
                            </button>
                            <ResumeUpload
                                conversationId={conversationId}
                                onAnalysis={onReport}
                                onParsed={onResumeChange}
                                onAnalysisStart={() => { onAnalyzingChange(true) }}
                                onAnalysisEnd={() => { onAnalyzingChange(false) }}
                                onTitleUpdate={onTitleUpdate} />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
