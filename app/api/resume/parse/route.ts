import {NextRequest} from "next/server"
import {generateText} from "ai"
import {deepseek} from "@/lib/deepseek/ai"
import {resumeParsePrompt} from "@/lib/prompts/resume"


export async function POST(req:NextRequest){

    try {

        const body = await req.json();

        const {
            content
        } = body;


        console.log(
            "收到简历:",
            content
        );


        const result = await generateText({

            model:deepseek("deepseek-v4-flash"),

            instructions:resumeParsePrompt,

            prompt:content

        });


        console.log(
            "AI返回结果:",
            result.text
        );


        const jsonData = JSON.parse(result.text);


        return Response.json({

            success:true,

            data:jsonData,

            content

        })


    }catch(error:any){

        console.log(
            "解析接口错误:",
            error
        );


        return Response.json(
            {
                error:error.message
            },
            {
                status:500
            }
        )

    }

}