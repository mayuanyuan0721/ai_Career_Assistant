"use client"

interface Props{
    onParsed:(data:any)=>void
}


export default function ResumeUpload({
    onParsed
}:Props){



async function uploadFile(
    e:React.ChangeEvent<HTMLInputElement>
){


    const file=e.target.files?.[0];

    if(!file){
        return;
    }


    // 读取 markdown 文件
    const text=await file.text();



    // 调用解析接口
    const res=await fetch(
        "/api/resume/parse",
        {
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                content:text
            })
        }
    )



    if(!res.ok){

        console.error(
            "简历解析失败"
        )

        return;
    }



    const data=await res.json();



    console.log(
        "解析结果:",
        data
    )


console.log(
 "解析返回:",
 data
);



    // 关键：
    // 把解析结果交给 ResumePanel
    onParsed(
        data.data
    );

}



return (

<label
style={{
display:"block",
cursor:"pointer"
}}
>


<input

type="file"

accept=".md"

hidden

onChange={uploadFile}

/>



<div>

📎 上传简历

</div>



</label>


)


}