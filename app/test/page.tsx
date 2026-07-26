"use client";
import ResumeUpload from "@/components/Resume/ResumeUpload";

export default function ResumeTestPage() {
  return (
    <div>
      <h1>简历解析测试</h1>
      <ResumeUpload
        onParsed={(data) => console.log("Parsed:", data)}
        onAnalysis={(data) => console.log("Analysis:", data)}
        onAnalysisEnd={() => console.log("Analysis end")}
        onAnalysisStart={() => console.log("Analysis start")}
        conversationId=""
        onTitleUpdate={() => console.log("Title update")}
      />
    </div>
  );
}
