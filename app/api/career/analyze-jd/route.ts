import { NextRequest } from "next/server";
import { deepseek } from "@/lib/deepseek/ai";
import { generateText } from "ai";
import { buildJobAnalysisPrompt } from "@/lib/prompts/job-analysis";
import { getJobs, formatJobsForPrompt } from "@/lib/career-data/loader";
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

    // 获取市场参考数据
    let marketJobsStr: string | undefined;
    try {
      const userSkills: string[] = resume?.skills || [];
      const jobs = getJobs({ skills: userSkills, limit: 5 });
      if (jobs.length > 0) {
        marketJobsStr = formatJobsForPrompt(jobs);
      }
    } catch (e) {
      console.warn("[JD-ANALYZE] Market data failed (non-critical):", e);
    }

    // 构建简历摘要
    let resumeStr: string | undefined;
    if (resume) {
      resumeStr = typeof resume === "string" ? resume : JSON.stringify(resume);
    }

    const prompt = buildJobAnalysisPrompt(jd, marketJobsStr, resumeStr);

    const result = await generateText({
      model: deepseek("deepseek-v4-flash"),
      prompt,
    });

    let report;
    try {
      let text = result.text.trim();
      if (text.startsWith("```")) {
        text = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
      }
      report = JSON.parse(text);
    } catch {
      report = {
        job_info: { title: "未知", company: "未知" },
        match_score: { total: 0, level: "Unknown", recommendation: "解析失败" },
        _raw: true,
        summary: result.text,
      };
    }

    return Response.json({ data: report });
  } catch (error: any) {
    console.error("[JD-ANALYZE] Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
