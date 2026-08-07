import { createClient } from "@/lib/supabase/server";
import { deepseek } from "@/lib/deepseek/ai";
import { generateText } from "ai";
import { getInterviewQuestions } from "@/lib/career-data/loader";
import { SKILL_INTERVIEW_CATEGORY } from "@/lib/career-config";
import { buildInterviewIntroPrompt, buildFollowUpPrompt } from "@/lib/prompts/interview-enhanced";

// POST - AI 面试官进行面试对话（混合模式：题库 + AI 增强）
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  const body = await req.json();
  const { resume, message, conversationId, targetRole = "前端开发工程师" } = body;

  if (!conversationId || typeof conversationId !== "string") {
    return Response.json({ error: "缺少会话 ID" }, { status: 400 });
  }
  if (!message || typeof message !== "string") {
    return Response.json({ error: "缺少消息内容" }, { status: 400 });
  }
  if (message.length > 8000) {
    return Response.json({ error: "消息过长（最多 8000 字）" }, { status: 500 });
  }

  // Verify the conversation belongs to the current user
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, user_id")
    .eq("id", conversationId)
    .single();

  if (!conversation) {
    return Response.json({ error: "会话不存在" }, { status: 404 });
  }
  if (conversation.user_id !== user.id) {
    return Response.json({ error: "无权访问该会话" }, { status: 403 });
  }

  try {
    // 保存用户消息到数据库
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: message
    });

    // 检查当前会话的历史消息
    const { data: existingMessages } = await supabase
      .from("messages")
      .select("content, role")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    // 获取题库（混合模式：有题库用题库，没有就用 AI）
    let bankQuestions: Array<{ question: string; category: string; level: string; answer?: string }> = [];
    
    // 根据目标岗位匹配题库分类
    const skills: string[] = resume?.skills || [];
    let category = "react"; // 默认
    
    // 尝试从技能推断题库分类
    for (const s of skills) {
      const cat = SKILL_INTERVIEW_CATEGORY[s.toLowerCase()];
      if (cat) {
        category = cat;
        break;
      }
    }
    
    // 也可以从目标岗位推断
    const roleCategoryMap: Record<string, string> = {
      "前端": "react",
      "React": "react",
      "Vue": "vue",
      "后端": "backend",
      "Java": "backend",
      "Python": "python",
    };
    
    for (const [key, cat] of Object.entries(roleCategoryMap)) {
      if (targetRole.includes(key)) {
        category = cat;
        break;
      }
    }
    
    // 从题库获取相关问题
    try {
      const questions = getInterviewQuestions({ category, limit: 10 });
      bankQuestions = questions.map(q => ({
        question: q.question,
        category: q.category,
        level: q.level,
        answer: q.answer
      }));
    } catch (e) {
      console.warn("[Interview] Failed to load question bank:", e);
    }

    const isFirstQuestion = !existingMessages || existingMessages.length <= 1;
    let systemPrompt: string;

    if (isFirstQuestion) {
      // 第一题：生成开场白
      systemPrompt = buildInterviewIntroPrompt(resume, targetRole, bankQuestions);

      const result = await generateText({
        model: deepseek("deepseek-v4-flash"),
        system: systemPrompt,
        prompt: `请开始面试。候选人目标岗位是「${targetRole}」。`
      });

      const response = result.text;

      // 保存 AI 开场白
      const introKey = `${conversationId}-intro`;
      const { error: introErr } = await supabase.from("messages").insert({
        idempotency_key: introKey,
        conversation_id: conversationId,
        role: "assistant",
        content: response
      });
      if (introErr && introErr.code !== "23505") throw introErr;

      return Response.json({ success: true, response });
    } else {
      // 后续问答：评分 + 反馈 + 下一题
      const conversationHistory = existingMessages
        .map(m => `[${m.role === "user" ? "候选人" : "面试官"}]: ${m.content}`)
        .join("\n\n");

      systemPrompt = buildFollowUpPrompt(resume, targetRole, conversationHistory, bankQuestions);

      const result = await generateText({
        model: deepseek("deepseek-v4-flash"),
        system: systemPrompt,
        prompt: message
      });

      const response = result.text;

      // 保存 AI 回复
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: response
      });

      return Response.json({ success: true, response });
    }
  } catch (err: any) {
    console.error("[Interview] Error:", err);
    return Response.json({ error: err.message || "面试失败" }, { status: 500 });
  }
}
