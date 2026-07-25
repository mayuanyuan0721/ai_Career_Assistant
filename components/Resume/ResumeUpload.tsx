"use client"

interface Props {
    onParsed: (data: any) => void
    onAnalysis: (data: string) => void
    onAnalysisEnd: () => void
    onAnalysisStart: () => void
    conversationId: string;
    onTitleUpdate: () => void;
}


export default function ResumeUpload({ onParsed, onAnalysis, onAnalysisEnd, onAnalysisStart, conversationId, onTitleUpdate }: Props) {
    async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
        if (!conversationId) {
            alert("Please click 'New Chat' first");
            return;
        }
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }

        try {
            // Read markdown file
            const text = await file.text();

            // 1. Upload resume to database
            const resResume = await fetch("/api/resume/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename: file.name, content: text })
            });
            const dataResume = await resResume.json();
            console.log("[RESUME] Uploaded:", dataResume);

            // 2. Parse resume with AI
            const res = await fetch("/api/resume/parse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: text })
            });
            if (!res.ok) {
                console.error("[RESUME] Parse failed");
                alert("Resume parsing failed, please try again");
                return;
            }
            const data = await res.json();
            console.log("[RESUME] Parsed:", data);
            const resume = data.data;
            onParsed(resume);

            // 3. Analyze resume with AI
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
            


            const analyzeRes = await fetch("/api/resume/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resume })
            });
            if (!analyzeRes.ok) {
                console.error("[RESUME] Analysis failed");
                alert("AI analysis failed, please try again");
                onAnalysisEnd();
                return;
            }

            const analyzeData = await analyzeRes.json();
            console.log("[RESUME] Analysis:", analyzeData);
            onAnalysis(analyzeData.data);

            // 4. Generate title (non-critical, don't block on failure)
            try {
                const titleRes = await fetch("/api/conversation/title", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        conversationId,
                        content: analyzeData.data.substring(0, 200)
                    })
                });
                if (titleRes.ok) {
                    console.log("[RESUME] Title updated, refreshing sidebar");
                    // Refresh sidebar to show new title
                    onTitleUpdate();
                }
            } catch (titleErr) {
                console.warn("[RESUME] Title generation failed (non-critical):", titleErr);
            }

            // 5. Save analysis as a message
            try {
                const msgRes = await fetch("/api/messages", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        conversationId,
                        role: "assistant",
                        content: analyzeData.data
                    })
                });
                if (!msgRes.ok) {
                    console.warn("[RESUME] Save message failed:", msgRes.status);
                }
            } catch (msgErr) {
                console.warn("[RESUME] Save message error (non-critical):", msgErr);
            }

        } catch (err) {
            console.error("[RESUME] Unexpected error:", err);
            alert("Upload failed: " + (err as Error).message);
        } finally {
            onAnalysisEnd();
        }
    }


    return (
        <label style={{ display: "block", cursor: "pointer" }}>
            <input type="file" accept=".md" hidden
                onChange={uploadFile} />
            <div>
                📎 Upload Resume
            </div>
        </label>
    )
}
