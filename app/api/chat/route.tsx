import { NextRequest } from 'next/server';
import {
    createUIMessageStream,
    createUIMessageStreamResponse,
    generateText,
    streamText,
    toUIMessageStream,
} from 'ai';
import { createClient } from "@/lib/supabase/server"
import { resumeOptimizePrompt, buildResumeOptimizePrompt, buildJobMatchPrompt, buildInterviewPrompt } from "@/lib/prompts/resume"
import { deepseek } from "@/lib/deepseek/ai"
import { getJobs, getInterviewQuestions, getResumeExamples, formatJobsForPrompt, formatInterviewForPrompt, formatExamplesForPrompt } from "@/lib/career-data/loader"
import { apiError } from "@/lib/api/http"

// Simple per-user rate limit: max messages within a rolling 24h window.
// Backed by the messages table, so it survives restarts with no extra infra.
const DAILY_MESSAGE_LIMIT = 200;
const RATE_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_MESSAGE_LENGTH = 8000;
const VALID_MODES = ["resume_optimize", "job_match", "interview", ""];


export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return apiError("未登录", 401);
    }

    try {
        const { message, conversationId, mode, resume } = await request.json();

        console.log("[CHAT] conversationId:", conversationId);
        console.log("[CHAT] mode:", mode);

        if (!conversationId || !message?.parts) {
            return apiError("请求参数不完整", 400);
        }

        // Reject unknown modes early
        if (!VALID_MODES.includes(mode ?? "")) {
            return apiError("未知的对话模式", 400);
        }

        // Per-user rate limit (fail open if the count query itself errors)
        const windowStart = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
        const { count, error: countErr } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversations.user_id", user.id)
            .gte("created_at", windowStart);

        if (!countErr && count !== null && count >= DAILY_MESSAGE_LIMIT) {
            return apiError("今日消息已达上限，请明天再试", 429);
        }

        // Extract user skills from resume for data filtering
        const userSkills: string[] = resume?.skills || [];

        let systemPrompt = "";
        try {
            switch (mode) {
                case "resume_optimize": {
                    const jobs = getJobs({ skills: userSkills, limit: 5 });
                    const examples = getResumeExamples({ limit: 2 });
                    systemPrompt = buildResumeOptimizePrompt(
                        formatJobsForPrompt(jobs),
                        formatExamplesForPrompt(examples)
                    );
                    console.log("[CHAT] Resume mode: injected", jobs.length, "jobs,", examples.length, "examples");
                    break;
                }
                case "job_match": {
                    const jobs = getJobs({ skills: userSkills, limit: 8 });
                    systemPrompt = buildJobMatchPrompt(formatJobsForPrompt(jobs));
                    console.log("[CHAT] Job match mode: injected", jobs.length, "jobs");
                    break;
                }
                case "interview": {
                    // Determine category from user skills
                    const categoryMap: Record<string, string> = {
                        react: "react", vue: "vue", typescript: "typescript",
                        javascript: "javascript", css: "css", node: "engineering"
                    };
                    const category = userSkills
                        .map((s: string) => categoryMap[s.toLowerCase()])
                        .filter(Boolean)[0] || "react";
                    const questions = getInterviewQuestions({ category, limit: 10 });
                    systemPrompt = buildInterviewPrompt(formatInterviewForPrompt(questions));
                    console.log("[CHAT] Interview mode: injected", questions.length, "questions (category:", category + ")");
                    break;
                }
                default:
                    systemPrompt = "";
            }
        } catch (dataErr) {
            console.warn("[CHAT] Career data injection failed (non-critical):", dataErr);
            // Fallback to basic prompts
            switch (mode) {
                case "resume_optimize": systemPrompt = resumeOptimizePrompt; break;
                default: systemPrompt = "";
            }
        }

        const userText = message.parts.filter(
            (p: any) => p.type === 'text'
        ).map(
            (p: any) => p.text
        ).join("").trim();

        // Validate message content
        if (!userText) {
            return apiError("消息内容不能为空", 400);
        }
        if (userText.length > MAX_MESSAGE_LENGTH) {
            return apiError(`消息过长（最多 ${MAX_MESSAGE_LENGTH} 字）`, 400);
        }

        // Ensure conversation exists AND belongs to the current user
        const { data: conversation } = await supabase
            .from("conversations")
            .select("id,title,user_id")
            .eq("id", conversationId)
            .single();

        if (conversation && conversation.user_id !== user.id) {
            return apiError("无权访问该会话", 403);
        }

        if (!conversation) {
            console.log("[CHAT] Creating new conversation:", conversationId);
            await supabase
                .from("conversations")
                .insert({
                    id: conversationId,
                    title: "New Chat",
                    user_id: user.id
                });
        }

        // Rebuild context from DB (single source of truth), then append the new message
        const { data: historyRows } = await supabase
            .from("messages")
            .select("role, content")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true });

        const modelMessages = [
            ...(historyRows ?? []).map((row) => ({
                role: row.role as "user" | "assistant",
                content: row.content as string
            })),
            { role: "user" as const, content: userText }
        ];

        // Save user message (server-side only, exactly once)
        const { error: msgError } = await supabase
            .from("messages")
            .insert({
                conversation_id: conversationId,
                role: "user",
                content: userText
            });
        if (msgError) {
            console.error("[CHAT] Save user message failed:", msgError);
        }

        // Kick off title generation IN PARALLEL with the chat response,
        // instead of waiting until the whole reply finishes
        const shouldGenerateTitle =
            !conversation ||
            conversation.title === "New Chat" ||
            conversation.title === "\u65b0\u5bf9\u8bdd";

        const titlePromise = shouldGenerateTitle
            ? generateText({
                model: deepseek("deepseek-v4-flash"),
                prompt: `Please generate a concise chat title based on the following content.
Requirements:
1. No more than 10 Chinese characters
2. No quotes
3. No period at the end
4. Output the title directly
Content:
${userText}`
            })
            : null;

        const stream = createUIMessageStream({
            execute: async ({ writer: dataStream }) => {
                const result = streamText({
                    model: deepseek('deepseek-v4-flash'),
                    instructions: systemPrompt,
                    messages: modelMessages,

                    onFinish: async ({ text }) => {
                        console.log("[CHAT] onFinish: saving assistant message");

                        const { error: saveErr } = await supabase
                            .from("messages")
                            .insert({
                                conversation_id: conversationId,
                                role: "assistant",
                                content: text
                            });
                        if (saveErr) {
                            console.error("[CHAT] Save assistant message failed:", saveErr);
                        }
                    }
                });

                dataStream.merge(toUIMessageStream({ stream: result.stream }));

                // Push the title to the client as soon as it is ready,
                // then persist it (with user_id check)
                if (titlePromise) {
                    try {
                        const titleResult = await titlePromise;
                        const newTitle = titleResult.text.trim();
                        console.log("[CHAT] Generated title:", newTitle);

                        dataStream.write({
                            type: "data-chat-title",
                            data: newTitle,
                            transient: true
                        });

                        const { error: updateErr } = await supabase
                            .from("conversations")
                            .update({ title: newTitle })
                            .eq("id", conversationId)
                            .eq("user_id", user.id);

                        if (updateErr) {
                            console.error("[CHAT] Update title failed:", updateErr);
                        }
                    } catch (titleErr) {
                        console.error("[CHAT] Title generation error:", titleErr);
                    }
                }
            }
        });

        return createUIMessageStreamResponse({ stream });
    } catch (err) {
        console.error("[CHAT] Error:", err);
        return apiError("服务暂时不可用，请稍后重试", 500);
    }
}
