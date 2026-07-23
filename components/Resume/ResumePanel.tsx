"use client"

import styles from "@/css/resumePanel.module.css"
import ResumeUpload from "./ResumeUpload"


interface Props{

resume:any;

onResumeChange:(data:any)=>void;

}


export default function ResumePanel({
resume,
onResumeChange
}:Props){

console.log(
"ResumePanel收到:",
resume
);
return (

<div className={styles.panel}>


<h2>
📄 我的简历
</h2>


<p className={styles.subTitle}>
AI求职助手
</p>



{
!resume ?


<div className={styles.empty}>


<div className={styles.icon}>
📎
</div>


<h3>
上传你的简历
</h3>


<p>
支持 Markdown 格式
</p>


<ResumeUpload
onParsed={onResumeChange}
/>


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


<span>
✅ 解析完成
</span>


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
resume.skills.map(
(skill:string)=>(

<span key={skill}>
{skill}
</span>

)

)
}


</div>


</div>




<div className={styles.block}>


<h3>
📁 项目经历
</h3>


{

resume.projects.length===0?

<p>
暂无项目
</p>

:

resume.projects.map(
(project:string)=>(

<p key={project}>
{project}
</p>

)

)

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