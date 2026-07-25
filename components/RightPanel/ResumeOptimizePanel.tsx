"use client"

import styles from "@/css/resumePanel.module.css"
import ResumeUpload from "@/components/Resume/ResumeUpload"


interface Props {
    resume: any;
    onResumeChange: (data: any) => void;
    onAnalysis: (data: string) => void;
    analyzing: boolean;
    onAnalyzingChange: (value: boolean) => void;
    conversationId: string;
    onTitleUpdate: () => void;
}


export default function ResumeOptimizePanel({ resume, onResumeChange, onAnalysis, analyzing, onAnalyzingChange, conversationId, onTitleUpdate }: Props) {

    console.log("ResumePanel received:", resume);
    console.log("Upload conversationId:", conversationId)
    return (
        <div className={styles.panel}>
            <h2>
                My Resume
            </h2>
            <p className={styles.subTitle}>
                AI Career Assistant
            </p>
            {
                !resume ?
                    <div className={styles.empty}>
                        <h3>
                            Upload your resume
                        </h3>
                        <p>
                            Supports Markdown format
                        </p>
                        {
                            conversationId &&
                            <ResumeUpload
                                conversationId={conversationId}
                                onAnalysis={onAnalysis}
                                onParsed={onResumeChange}
                                onAnalysisStart={() => { onAnalyzingChange(true) }}
                                onAnalysisEnd={() => { onAnalyzingChange(false) }}
                                onTitleUpdate={onTitleUpdate} />
                        }
                    </div>
                    :
                    <div>
                        <div className={styles.fileCard}>
                            <div className={styles.fileIcon}>
                                📄
                            </div>
                            <div>
                                <h3>
                                    resume.md
                                </h3>
                                {
                                    analyzing ?
                                        <span>
                                            ⏳ AI analyzing resume...
                                        </span>
                                        :
                                        <span>
                                            ✅ Analysis complete
                                        </span>
                                }
                            </div>
                        </div>
                        <div className={styles.block}>
                            <h3>
                                👤 Basic Info
                            </h3>
                            <p>
                                {
                                    resume.basic.name || "Not filled"
                                }
                            </p>
                        </div>
                        <div className={styles.block}>
                            <h3>
                                🛠 Skills
                            </h3>
                            <div className={styles.tags}>
                                {
                                    resume.skills.map((skill: string) => (<span key={skill}>{skill}
                                    </span>
                                    ))
                                }
                            </div>
                        </div>
                        <div className={styles.block}>
                            <h3>
                                📁 Projects
                            </h3>
                            {
                                resume.projects.length === 0 ?
                                    <p>
                                        No projects yet
                                    </p>
                                    :
                                    resume.projects.map((project: string) => (
                                        <p key={project}>
                                            {project}
                                        </p>
                                    ))
                            }
                        </div>
                        <ResumeUpload
                            conversationId={conversationId}
                            onAnalysis={onAnalysis}
                            onParsed={onResumeChange}
                            onAnalysisStart={() => { onAnalyzingChange(true) }}
                            onAnalysisEnd={() => { onAnalyzingChange(false) }}
                            onTitleUpdate={onTitleUpdate} />
                    </div>
            }
        </div>
    )
}
