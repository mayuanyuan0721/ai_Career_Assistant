"use client"

interface Props {
    onParsed: (data: any) => void
    onAnalysis: (data: string) => void
    onAnalysisEnd:()=>void
    onAnalysisStart:()=>void
    conversationId:string;

}


export default function ResumeUpload({ onParsed, onAnalysis,onAnalysisEnd,onAnalysisStart,conversationId }: Props) {
    async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }
        // 读取 markdown 文件
        const text = await file.text();
        // 调用解析接口
        const res = await fetch(
            "/api/resume/parse",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    content: text
                })
            }
        )
        if (!res.ok) {
            console.error("简历解析失败")
            return;
        }
        const data = await res.json();
        console.log("解析结果:", data)
        console.log("解析返回:", data);
        const resume = data.data
        onParsed(resume);
        onAnalysisStart();
        const analyzeRes = await fetch(
            "/api/resume/analyze",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    resume
                })
            }
        )
        if(!analyzeRes.ok){
            console.log("简历分析失败");
            return ;
        }

        const analyzeData=await analyzeRes.json();
        console.log("AI简历分析",analyzeData);

        onAnalysis(analyzeData.data);
        await fetch("/api/messages",{
            method:"POST",
            headers:{
            "Content-Type":"application/json"
            },
            body:JSON.stringify({
                conversationId,
                role:"assistant",
                content:analyzeData.data
            })
        }

        )
        onAnalysisEnd();

    }



    return (

        <label style={{ display: "block", cursor: "pointer" }}>
            <input type="file" accept=".md" hidden
                onChange={uploadFile} />
            <div>
                📎 上传简历
            </div>
        </label>
    )
}