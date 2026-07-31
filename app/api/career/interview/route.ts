import { createClient } from "@/lib/supabase/server";
import { buildInterviewPrompt, formatInterviewForPrompt } from "@/lib/prompts/resume";
import { deepseek } from "@/lib/deepseek/ai";
import { generateText } from "ai";
import { getInterviewQuestions } from "@/lib/career-data/loader";

// GET - 获取面试问题列表（按技能筛选）
export async function GET(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        return Response.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const skills = searchParams.get("skills")?.split(",").slice(0, 3) || undefined;
    const limit = parseInt(searchParams.get("limit") || "5");

    // 根据用户技能选择最相关的分类
    let category = "react"; // default
    if (skills && skills.length > 0) {
        const skillMap: Record<string, string> = {
            react: "react", vue: "vue", angular: "angular",
            javascript: "javascript", css: "css", node: "engineering"
        };
        for (const s of skills) {
            const cat = skillMap[s.toLowerCase()];
            if (cat) { category = cat; break; }
        }
    }

    const questions = getInterviewQuestions({ category, limit, level: "all" });
    return Response.json({ questions, category });
}

// POST - AI 面试官进行面试对话
export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        return Response.json({ error: "未登录" }, { status: 401 });
    }

    const body = await req.json();
    const { resume, message, conversationId } = body;

    if (!message) {
        return Response.json({ error: "缺少消息内容" }, { status: 400 });
    }

    try {
        // 先检查当前会话是否有面试记录，没有则生成第一题
        const { data: existingMessages } = await supabase
            .from("messages")
            .select("content")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true })
            .limit(10);

        let systemPrompt = "";
        
        if (!existingMessages || existingMessages.length === 0) {
            // 第一题：根据简历生成问题
            const skills: string[] = resume?.skills || [];
            const category = ["react", "vue", "angular", "typescript", "nodejs"].find(k => 
                skills.some(s => s.toLowerCase().includes(k))
            ) || "react";
            
            const questions = getInterviewQuestions({ category, limit: 3 });
            const firstQn = questions[0]?.question || "请介绍一下你最近做的项目？";
            
            systemPrompt = `你是一名资深技术面试官，正在进行模拟面试。
            
# 面试规则
1. 首先介绍自己，然后提出第一个问题
2. 每次只问一个问题，等用户回答后再继续
3. 对用户的问题进行评分（1-10 分）并给出改进建议
4. 保持友好专业的氛围，鼓励用户

# 题库参考
${formatInterviewForPrompt([
    ...questions.slice(0, 2),
    { category: "general", level: "junior", question: "请介绍一下你最近做的项目？", answer: "" }
])}`;

            // 保存面试开场白作为第一条消息
            const introMessage = `👋 你好！我是你的 AI 面试官。我将根据你的简历和你申请的技术岗位提问一些技术问题。\n\n**问题 1：${firstQn}**\n\n请开始你的回答...`;
            
            await supabase.from("messages").insert({
                conversation_id: conversationId,
                role: "assistant",
                content: introMessage
            });
        } else {
            // 后续问题
            const relevantQuestions = getInterviewQuestions({ category: "react", limit: 10 });
            systemPrompt = `你是一名资深技术面试官，正在进行一对一的模拟面试。\n\n# 面试流程\n1. 对用户的回答进行评分（1-10 分）\n2. 给出具体的改进建议，指出优点和不足\n3. 提出下一个相关问题\n4. 保持专业友好的态度\n\n# 当前用户状态\n- 技能：${resume?.skills?.join(", ") || "未知"}\n- 目标岗位：前端开发工程师\n\n# 之前的面试对话（仅用于上下文，不要重复问题）\n请将以下视为历史记录，但只基于最后一轮回复：
${existingMessages.map(m => m.content).join("\n\n")}\n\n# 题库参考（可选用）
${formatInterviewForPrompt(relevantQuestions)}\n\n# 指令
请先给用户本次回答评分（1-10 分）和改进建议，然后提出下一个新的问题。`;
        }

        console.log("[Interview] System prompt:", systemPrompt.substring(0, 100));

        const result = await generateText({
            model: deepseek("deepseek-v4-flash"),
            system: systemPrompt,
            prompt: message
        });

        const response = result.text;

        // 保存 AI 的回答到数据库
        await supabase.from("messages").insert({
            conversation_id: conversationId,
            role: "assistant",
            content: response
        });

        return Response.json({ success: true, response });
    } catch (err: any) {
        console.error("[Interview] Error:", err);
        return Response.json({ error: err.message || "面试失败" }, { status: 500 });
    }
}
