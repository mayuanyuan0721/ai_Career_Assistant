import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const task = req.nextUrl.searchParams.get("task") || "all";
  const validTasks = ["jobs", "skills", "skills-model", "interview", "projects", "articles", "resume", "all"];

  if (!validTasks.includes(task)) {
    return Response.json({ error: "Unknown task: " + task }, { status: 400 });
  }

  try {
    const { stdout, stderr } = await execFileAsync(
      "npx",
      ["ts-node", "lib/crawlers/index.ts", "--task", task],
      {
        cwd: process.cwd(),
        timeout: 300000, // 5 minutes
        maxBuffer: 1024 * 1024,
      }
    );

    return Response.json({
      success: true,
      task,
      stdout: stdout.slice(-2000),
      stderr: stderr.slice(-1000) || undefined,
    });
  } catch (err: any) {
    console.error("[CRAWLER] Error:", err?.message || err);
    return Response.json({
      error: "Crawler failed",
      detail: err?.message,
      stderr: err?.stderr?.slice(-500),
    }, { status: 500 });
  }
}
