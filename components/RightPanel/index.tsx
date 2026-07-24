import ResumeOptimizePanel from "./ResumeOptimizePanel"
import JobMatchPanel  from "./JobMatchPanel"
import InterviewPanel  from "./InterviewPanel"


interface Props {
    mode:Mode;
    resume:any;
    analyzing:boolean;
    onResumeChange:(data:any)=>void;
    onAnalysis:(data:string)=>void;
    onAnalyzingChange:(value:boolean)=>void;
    conversationId:string
}


export default function RightPanel({mode,resume,analyzing,onResumeChange,onAnalysis,onAnalyzingChange,conversationId}:Props){

    switch(mode){
        case "resume_optimize":
            return (
                <ResumeOptimizePanel 
                analyzing={analyzing} 
                resume={resume} 
                onAnalysis={onAnalysis} 
                onAnalyzingChange={onAnalyzingChange}  
                onResumeChange={onResumeChange}
                conversationId={conversationId}/>
            )
        case "job_match":
           return(
                <JobMatchPanel/>
           )
        case "interview":
            return(
                <InterviewPanel/>
            )
    }
}