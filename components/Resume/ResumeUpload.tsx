"use client"

import { ResumeReport } from "@/types/resume"

interface Props {
    onParsed: (data: any) => void
    onAnalysis: (report: ResumeReport) => void
    onAnalysisEnd: () => void
    onAnalysisStart: () => void
    conversationId: string;
    onTitleUpdate: () => void;
}

const ACCEPTED_TYPES = ".md,.txt,.pdf,.docx";

export default function ResumeUpload({ onParsed, onAnalysis, onAnalysisEnd, onAnalysisStart, conversationId, onTitleUpdate }: Props) {
    async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
        if (!conversationId) {
            alert("请先点击「新对话」");
            return;
        }
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // 1. Extract text from file
            const formData = new FormData();
            formData.append("file", file);

            const extractRes = await fetch("/api/resume/extract", {
                method: "POST",
                body: formData,
            });

            if (!extractRes.ok) {
                const errData = await extractRes.json().catch(() => ({}));
                alert(errData.error || "文件解析失败，请重试");
                return;
            }

            const { text, filename } = await extractRes.json();
            console.log(`[RESUME] Extracted ${filename}: ${text.length} chars`);

            // 2. Upload resume text to database
            const resResume = await fetch("/api/resume/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename, content: text, conversationId })
            });
            const dataResume = await resResume.json();
            console.log("[RESUME] Uploaded:", dataResume);

            // 3. Parse resume with AI
            const res = await fetch("/api/resume/parse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: text })
            });
            if (!res.ok) {
                alert("简历AI解析失败，请重试");
                return;
            }
            const data = await res.json();
            const resume = data.data;
            onParsed(resume);

            // 4. Deep analyze with structured report
            onAnalysisStart();

            // Generate user profile (non-critical)
            try {
                const profileRes = await fetch("/api/profile/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ resume })
                });
                const profileData = await profileRes.json();
                console.log("[RESUME] User profile:", profileData);
            } catch (profileErr) {
                console.warn("[RESUME] Profile generation failed (non-critical):", profileErr);
            }

            // Deep analysis (returns structured report)
            const analyzeRes = await fetch("/api/resume/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resume, skills: resume.skills || [] })
            });

            if (!analyzeRes.ok) {
                console.error("[RESUME] Analysis failed");
                alert("AI分析失败，请重试");
                onAnalysisEnd();
                return;
            }

            const analyzeData = await analyzeRes.json();
            console.log("[RESUME] Report:", analyzeData);

            // Pass structured report (not raw text)
            onAnalysis(analyzeData.data);

            // 4.5 Save parsed resume data and report to database
            try {
                const saveRes = await fetch("/api/resume/save", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        conversationId,
                        resumeData: resume,
                        report: analyzeData.data,
                        filename
                    })
                });
                if (!saveRes.ok) {
                    const saveErr = await saveRes.json().catch(() => ({}));
                    console.warn("[RESUME] Save parsed data failed:", saveErr);
                } else {
                    console.log("[RESUME] Parsed data saved to DB");
                }
            } catch (saveErr) {
                console.warn("[RESUME] Save parsed data failed (non-critical):", saveErr);
            }

            // 5. Generate title (non-critical)
            try {
                const summary = analyzeData.data.summary || "";
                const titleRes = await fetch("/api/conversation/title", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        conversationId,
                        content: summary.substring(0, 200)
                    })
                });
                if (titleRes.ok) {
                    onTitleUpdate();
                }
            } catch (titleErr) {
                console.warn("[RESUME] Title generation failed (non-critical):", titleErr);
            }

            // 6. Save analysis summary as a message
            try {
                const summary = analyzeData.data.summary || "简历分析完成";
                const msgRes = await fetch("/api/messages", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        conversationId,
                        role: "assistant",
                        content: summary
                    })
                });
                if (!msgRes.ok) {
                    const errData = await msgRes.json().catch(() => ({}));
                    console.error("[RESUME] Save message failed:", msgRes.status, errData);
                } else {
                    console.log("[RESUME] Analysis message saved");
                }
            } catch (msgErr) {
                console.error("[RESUME] Save message error:", msgErr);
            }

        } catch (err) {
            console.error("[RESUME] Unexpected error:", err);
            alert("上传失败: " + (err as Error).message);
        } finally {
            onAnalysisEnd();
        }
    }

    return (
        <label style={{ display: "block", cursor: "pointer" }}>
            <input type="file" accept={ACCEPTED_TYPES} hidden
                onChange={uploadFile} />
            <div>
                📎 上传简历 (.md/.pdf/.docx)
            </div>
        </label>
    )
}
