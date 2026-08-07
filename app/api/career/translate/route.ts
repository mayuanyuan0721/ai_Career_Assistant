import { NextRequest } from "next/server";
import { deepseek } from "@/lib/deepseek/ai";
import { generateText } from "ai";
import { buildCareerTranslatorPrompt } from "@/lib/prompts/career-tailor";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const { resume, targetIndustry, targetRole } = await req.json();

    if (!resume) {
      return Response.json({ error: "缺少简历内容" }, { status: 400 });
    }
    if (!targetIndustry || !targetRole) {
      return Response.json({ error: "缺少目标行业或岗位" }, { status: 400 });
    }

    const resumeJson = typeof resume === "string"
      ? resume
      : JSON.stringify(resume);

    const prompt = buildCareerTranslatorPrompt(
      resumeJson,
      targetIndustry,
      targetRole,
    );

    const result = await generateText({
      model: deepseek("deepseek-v4-flash"),
      prompt,
    });

    let data;
    try {
      let text = result.text.trim();
      if (text.startsWith("```")) {
        text = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
      }
      data = JSON.parse(text);
    } catch {
      data = {
        current_background: {},
        target: { field: targetIndustry, role: targetRole },
        _raw: true,
        summary: result.text,
      };
    }

    return Response.json({ data });
  } catch (error: any) {
    console.error("[CAREER-TRANSLATOR] Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
