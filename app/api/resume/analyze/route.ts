import { NextRequest } from "next/server";
import { deepseek } from "@/lib/deepseek/ai";
import { generateText } from "ai";
import { buildAnalyzePrompt } from "@/lib/prompts/resume";
import { getJobs, getResumeExamples, formatJobsForPrompt, formatExamplesForPrompt } from "@/lib/career-data/loader";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const resume = body.resume;
    const userSkills: string[] = body.skills || resume?.skills || [];

    // Inject market data
    let jobsStr: string | undefined;
    let examplesStr: string | undefined;
    try {
      const jobs = getJobs({ skills: userSkills, limit: 5 });
      jobsStr = formatJobsForPrompt(jobs);
      const examples = getResumeExamples({ limit: 2 });
      examplesStr = formatExamplesForPrompt(examples);

    } catch (e) {
      console.warn("[ANALYZE] Market data injection failed (non-critical):", e);
    }

    const prompt = buildAnalyzePrompt(jobsStr, examplesStr);

    const result = await generateText({
      model: deepseek("deepseek-v4-flash"),
      prompt: prompt + JSON.stringify(resume),
    });

    // Parse AI response as JSON
    let report;
    try {
      let text = result.text.trim();
      // Remove markdown code blocks if present
      if (text.startsWith("```")) {
        text = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
      }
      report = JSON.parse(text);
    } catch (parseErr) {
      console.warn("[ANALYZE] JSON parse failed, returning raw text");
      report = {
        score: { total: 0, content: 0, structure: 0, keywords: 0 },
        summary: result.text,
        sections: [],
        keyword_gaps: [],
        market_insights: "",
        next_steps: [],
        _raw: true,
      };
    }

    return Response.json({ data: report });
  } catch (error: any) {
    console.error("[ANALYZE] Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
