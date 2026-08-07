import { NextRequest } from "next/server";
import { deepseek } from "@/lib/deepseek/ai";
import { generateText } from "ai";
import { buildInterviewPrepPrompt } from "@/lib/prompts/interview";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const { resume, jd, industry } = await req.json();

    if (!resume) {
      return Response.json({ error: "缺少简历内容" }, { status: 400 });
    }

    const resumeJson = typeof resume === "string"
      ? resume
      : JSON.stringify(resume);

    const prompt = buildInterviewPrepPrompt(
      resumeJson,
      jd || undefined,
      industry || undefined,
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
        role_analysis: { target_position: industry || "技术岗位" },
        _raw: true,
        summary: result.text,
      };
    }

    return Response.json({ data });
  } catch (error: any) {
    console.error("[INTERVIEW-PREP] Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
