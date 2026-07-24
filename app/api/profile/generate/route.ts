import {deepseek} from "@/lib/deepseek/ai"
import { generateText } from "ai";
import {resumeOptimizePrompt} from "@/lib/prompts/resume"

export async function POST(req: Request) {
    const body = await req.json();
    const resume = body.resume;
    const prompt = `你是一名资深前端面试官。
    请分析下面这份简历。
    重点关注：
    1. 技术栈是否合理
    2. 项目经历是否有亮点
    3. 项目描述是否符合STAR原则
    4. 是否体现技术深度
    5. 给出具体修改建议
    输出：
   ## 简历总体评价
   ## 存在的问题
   ## 修改建议
        简历:${JSON.stringify(resume)}`;


    const result = await generateText({
        model: deepseek("deepseek-chat"), prompt
    })

    const clean=result.text.replace(
         /```json/g,
        ""
    )
    .replace(
          /```/g,
        ""
    )
    .trim();

    const profile=JSON.parse(clean);
    console.log("用户画像",profile);
    return Response.json({
        data:profile
    })
    

}