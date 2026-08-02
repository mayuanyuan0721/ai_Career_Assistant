import { NextRequest } from "next/server";
import { deepseek } from "@/lib/deepseek/ai";
import { generateText } from "ai";
import { sectionOptimizePrompt } from "@/lib/prompts/resume";
import { getJobs, getResumeExamples, formatJobsForPrompt, formatExamplesForPrompt } from "@/lib/career-data/loader";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const { section, sectionName, original, targetRole, skills } = await req.json();

    if (!original) {
      return Response.json({ error: "缺少原始内容" }, { status: 400 });
    }

    // Inject market data
    let context = "";
    try {
      const userSkills: string[] = skills || [];
      const jobs = getJobs({ skills: userSkills, limit: 3 });
      if (jobs.length > 0) {
        context += "\n\n# 市场参考岗位\n" + formatJobsForPrompt(jobs);
      }
      const examples = getResumeExamples({ limit: 1 });
      if (examples.length > 0) {
        context += "\n\n# 优秀写法参考\n" + formatExamplesForPrompt(examples);
      }
    } catch (e) {
      console.warn("[OPTIMIZE] Market data failed:", e);
    }

    const userPrompt = `
目标岗位：${targetRole || "前端开发工程师"}
优化部分：${section} - ${sectionName || ""}

原始内容：
${original}
`;

    const result = await generateText({
      model: deepseek("deepseek-v4-flash"),
      prompt: sectionOptimizePrompt + context + "\n\n" + userPrompt,
    });

    let data;
    try {
      let text = result.text.trim();
      if (text.startsWith("```")) {
        text = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
      }
      data = JSON.parse(text);
    } catch (e) {
      data = {
        optimized: result.text,
        changes: [],
        interview_questions: [],
        tech_highlights: [],
      };
    }

    return Response.json({ data });
  } catch (error: any) {
    console.error("[OPTIMIZE] Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
