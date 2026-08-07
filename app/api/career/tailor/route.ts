import { NextRequest } from "next/server";
import { deepseek } from "@/lib/deepseek/ai";
import { generateText } from "ai";
import { buildResumeTailorPrompt } from "@/lib/prompts/job-analysis";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const { jd, resume } = await req.json();

    if (!jd || typeof jd !== "string") {
      return Response.json({ error: "缺少 JD 内容" }, { status: 400 });
    }
    if (!resume) {
      return Response.json({ error: "缺少简历内容" }, { status: 400 });
    }

    const resumeSummary = typeof resume === "string"
      ? resume
      : JSON.stringify(resume);

    const prompt = buildResumeTailorPrompt(jd, resumeSummary);

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
        tailoring_plan: { target_position: "未知", match_score: 0 },
        _raw: true,
        summary: result.text,
      };
    }

    return Response.json({ data });
  } catch (error: any) {
    console.error("[RESUME-TAILOR] Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
