import { NextRequest } from "next/server"
import { generateText } from "ai"
import { deepseek } from "@/lib/deepseek/ai"
import { resumeParsePrompt } from "@/lib/prompts/resume"
import { createClient } from "@/lib/supabase/server"
import withTimeout from "@/lib/timeout"

export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const authResult = await withTimeout(
        supabase.auth.getUser(),
        5000,
        { data: { user: null }, error: null } as any
    )
    const { data: { user } } = authResult
    if (!user) {
        return Response.json({ error: "未登录" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { content } = body

        if (!content || typeof content !== "string" || content.trim().length < 10) {
            return Response.json({ error: "简历内容不能为空" }, { status: 400 })
        }

        const result = await generateText({
            model: deepseek("deepseek-v4-flash"),
            instructions: resumeParsePrompt,
            prompt: content
        })

        // Strip markdown code fences if AI wrapped the JSON
        let text = result.text.trim()
        if (text.startsWith("```")) {
            text = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim()
        }

        let jsonData: unknown
        try {
            jsonData = JSON.parse(text)
        } catch {
            // Return a minimal fallback so the client can still proceed
            return Response.json({ error: "AI 返回格式异常，请重试" }, { status: 502 })
        }

        return Response.json({ success: true, data: jsonData, content })

    } catch (error: any) {
        console.error("[PARSE] Error:", error)
        return Response.json({ error: error.message }, { status: 500 })
    }
}
