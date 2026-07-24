"use client"

import styles from "@/css/resumePanel.module.css"
import ResumeUpload from "@/components/Resume/ResumeUpload"


interface Props {
    resume: any;
    onResumeChange: (data: any) => void;
    onAnalysis:(data:string)=>void;
    analyzing:boolean;
    onAnalyzingChange:(value:boolean)=>void;
    conversationId:string;
}


export default function ResumeOptimizePanel({ resume, onResumeChange ,onAnalysis,analyzing,onAnalyzingChange,conversationId}: Props) {

    console.log("ResumePanel收到:", resume);
    console.log(
"上传时conversationId:",
conversationId
)
    return (
        <div className={styles.panel}>
            <h2>
                我的简历
            </h2>
            <p className={styles.subTitle}>
                AI求职助手
            </p>
            {
                !resume ?
                    <div className={styles.empty}>
                        <h3>
                            上传你的简历
                        </h3>
                        <p>
                            支持 Markdown 格式
                        </p>
                        {
                        conversationId &&
                        <ResumeUpload
                         conversationId={conversationId}
                         onAnalysis={onAnalysis}
                         onParsed={onResumeChange}
                         onAnalysisStart={()=>{onAnalyzingChange(true)}}
                         onAnalysisEnd={()=>{onAnalyzingChange(false)}}
                         />
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
        ⏳ AI正在分析简历...
    </span>

    :

    <span>
        ✅ 分析完成
    </span>
                              }
                            </div>
                        </div>
                        <div className={styles.block}>
                            <h3>
                                👤 基本信息
                            </h3>
                            <p>
                                {
                                    resume.basic.name || "未填写"
                                }
                            </p>
                        </div>
                        <div className={styles.block}>
                            <h3>
                                🛠 技能
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
                                📁 项目经历
                            </h3>
                            {
                                resume.projects.length === 0 ?
                                    <p>
                                        暂无项目
                                    </p>
                                    :
                                    resume.projects.map((project: string) => (
                                        <p key={project}>
                                            {project}
                                        </p>
                                    ))
                            }
                        </div>
                        <button
                            className={styles.uploadBtn}
                        >
                            重新上传
                        </button>
                    </div>
            }
        </div>
    )
}