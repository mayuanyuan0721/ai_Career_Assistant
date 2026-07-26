import ResumeOptimizePanel from "./ResumeOptimizePanel"
import JobMatchPanel from "./JobMatchPanel"
import InterviewPanel from "./InterviewPanel"
import { Mode } from "@/types/chat"
import { ResumeReport, OptimizedSection } from "@/types/resume"


interface Props {
    mode: Mode;
    resume: any;
    report: ResumeReport | null;
    optimizedSections: OptimizedSection;
    analyzing: boolean;
    onResumeChange: (data: any) => void;
    onReport: (report: ResumeReport | null) => void;
    onAnalyzingChange: (value: boolean) => void;
    onSectionOptimized: (key: string, optimized: string) => void;
    onShowPreview: () => void;
    conversationId: string;
    onTitleUpdate: () => void;
}


export default function RightPanel({ mode, resume, report, optimizedSections, analyzing,
    onResumeChange, onReport, onAnalyzingChange, onSectionOptimized, onShowPreview,
    conversationId, onTitleUpdate }: Props) {

    switch (mode) {
        case "resume_optimize":
            return (
                <ResumeOptimizePanel
                    analyzing={analyzing}
                    resume={resume}
                    report={report}
                    optimizedSections={optimizedSections}
                    onReport={onReport}
                    onAnalyzingChange={onAnalyzingChange}
                    onResumeChange={onResumeChange}
                    onSectionOptimized={onSectionOptimized}
                    onShowPreview={onShowPreview}
                    conversationId={conversationId}
                    onTitleUpdate={onTitleUpdate} />
            )
        case "job_match":
            return <JobMatchPanel />
        case "interview":
            return <InterviewPanel />
    }
}
