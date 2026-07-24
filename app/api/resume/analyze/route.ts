import {deepseek} from "@/lib/deepseek/ai"
import {generateText} from "ai"
import {resumeAnalyzePrompt } from "@/lib/prompts/resume"


export async function POST(req:Request) {

    const body=await req.json();
     const resume = body.resume;
    const result=await generateText({
        model:deepseek("deepseek-chat"),
        prompt:resumeAnalyzePrompt+JSON.stringify(resume)
    });
    return Response.json({
        data:result.text
    })
}