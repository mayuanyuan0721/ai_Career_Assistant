"use client"

import {Mode} from "@/types/chat"
import styles from "@/css/page.module.css"
interface Props{
    mode:Mode;
    setMode:(str:string)=>void;
}

export default function ModeSelector({mode,setMode}:Props){
    const modes=[{
        label:"📝 简历优化",
        value:"resume_optimize"
    }, {
        label:"🎯 岗位匹配",
        value:"job_match"
    },
    {
        label:"🎤 模拟面试",
        value:"interview"
    }

]

return (
    <div>
        {
             modes.map(item=>(
        <button  onClick={()=>{setMode(item.value as Mode)}} key={item.value as Mode} style={{marginRight:"10px",
            fontWeight:mode===item.value?"bold":"normal"}}>
            {item.label}
        </button>
             ))

        }

    </div>
   
)
}