import {NextRequest} from "next/server"
import {generateText} from "ai"
import {deepseek} from "@/lib/deepseek/ai"
import {resumeParsePrompt} from "@/lib/prompts/resume"
import { createClient } from "@/lib/supabase/server"
import { error } from "console"
import { json } from "stream/consumers"

export async function POST(req:NextRequest){
    const body =await req.json();
    const {content}=body;
    console.log("收到简历",content);
    
    const result= await generateText({
        model:deepseek("deepseek-chat"),
        system:resumeParsePrompt,
        prompt: content
    })

     const jsonData=JSON.parse(result.text);


    return Response.json({
        success:true,
        data:jsonData,
        content
    })
        
}