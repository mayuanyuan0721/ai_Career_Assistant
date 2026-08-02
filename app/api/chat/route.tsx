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
import { prepareContext, estimateMessagesTokens } from "@/lib/context-manager"
import { getUserMemories, extractAndSaveMemories } from "@/lib/memory-manager"
import { withRetry } from "@/lib/supabase/retry"

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
        return apiError("\u672a\u767b\u5f55", 401);
    }

    try {
        const { message, conversationId, mode, resume } = await request.json();

        console.log("[CHAT] conversationId:", conversationId);
        console.log("[CHAT] mode:", mode);

        if (!conversationId || !message?.parts) {
            return apiError("\u8bf7\u6c42\u53c2\u6570\u4e0d\u5b8c\u6574", 400);
        }

        // Reject unknown modes early
        if (!VALID_MODES.includes(mode ?? "")) {
            return apiError("\u672a\u77e5\u7684\u5bf9\u8bdd\u6a21\u5f0f", 400);
        }

        // Per-user rate limit (fail open if the count query itself errors)
        const windowStart = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
        const { data: userConversations, error: conversationsErr } = await supabase
            .from("conversations")
            .select("id")
            .eq("user_id", user.id);

        let count: number | null = 0;
        let countErr = conversationsErr;

        if (!conversationsErr && userConversations.length > 0) {
            const result = await supabase
                .from("messages")
                .select("id", { count: "exact", head: true })
                .in("conversation_id", userConversations.map((conversation) => conversation.id))
                .gte("created_at", windowStart);

            count = result.count;
            countErr = result.error;
        }

        if (!countErr && count !== null && count >= DAILY_MESSAGE_LIMIT) {
            return apiError("\u4eca\u65e5\u6d88\u606f\u5df2\u8fbe\u4e0a\u9650\uff0c\u8bf7\u660e\u5929\u518d\u8bd5", 429);
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
            return apiError("\u6d88\u606f\u5185\u5bb9\u4e0d\u80fd\u4e3a\u7a7a", 400);
        }
        if (userText.length > MAX_MESSAGE_LENGTH) {
            return apiError(`\u6d88\u606f\u8fc7\u957f\uff08\u6700\u591a ${MAX_MESSAGE_LENGTH} \u5b57\uff09`, 400);
        }

        // Ensure conversation exists AND belongs to the current user
        const { data: conversation } = await supabase
            .from("conversations")
            .select("id,title,user_id")
            .eq("id", conversationId)
            .single();

        if (conversation && conversation.user_id !== user.id) {
            return apiError("\u65e0\u6743\u8bbf\u95ee\u8be5\u4f1a\u8bdd", 403);
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

        const allMessages = [
            ...(historyRows ?? []).map((row) => ({
                role: row.role as "user" | "assistant",
                content: row.content as string
            })),
            { role: "user" as const, content: userText }
        ];

        // Context length management: if messages exceed token limit,
        // summarize older messages and keep only recent ones
        const totalTokens = estimateMessagesTokens(allMessages);
        let modelMessages: { role: "user" | "assistant"; content: string }[];
        let contextSummary = "";

        if (totalTokens > 30000) {
            console.log(`[CHAT] Context overflow: ${totalTokens} tokens, preparing summary...`);
            const prepared = await prepareContext(allMessages);
            modelMessages = prepared.messages as { role: "user" | "assistant"; content: string }[];
            contextSummary = prepared.summary;
            console.log(`[CHAT] After truncation: ${estimateMessagesTokens(modelMessages)} tokens, ${modelMessages.length} messages kept`);
        } else {
            modelMessages = allMessages;
        }

        // Cross-session memory: inject user memories into system prompt
        const userMemories = await getUserMemories(supabase, user.id);
        const finalSystemPrompt = systemPrompt + userMemories +
            (contextSummary ? `\n\n[\u65e9\u671f\u5bf9\u8bdd\u6458\u8981]\n${contextSummary}` : "");

        // Save user message (server-side only, exactly once)
        console.log("[CHAT] Saving user message to DB:", {
            conversation_id: conversationId,
            role: "user",
            content_length: userText.length,
            content_preview: userText.substring(0, 50)
        });
        
        try {
            const insertData = await withRetry(async () => {
                const { data, error } = await supabase
                    .from("messages")
                    .insert({
                        conversation_id: conversationId,
                        role: "user",
                        content: userText
                    })
                    .select();
                    
                if (error) throw error;
                return data;
            }, 3, 1000); // 最多重试 3 次，每次间隔 1s
            
            console.log("[CHAT] User message saved successfully:", insertData);
        } catch (saveErr) {
            console.error("[CHAT] Save user message failed after retries:", saveErr);
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
                    instructions: finalSystemPrompt,
                    messages: modelMessages,

                    onFinish: async ({ text }) => {
                        console.log("[CHAT] onFinish: saving assistant message", {
                            conversation_id: conversationId,
                            role: "assistant",
                            content_length: text.length,
                            content_preview: text.substring(0, 50)
                        });

                        try {
                            const insertData = await withRetry(async () => {
                                const { data, error } = await supabase
                                    .from("messages")
                                    .insert({
                                        conversation_id: conversationId,
                                        role: "assistant",
                                        content: text
                                    })
                                    .select();
                                    
                                if (error) throw error;
                                return data;
                            }, 3, 1000);
                            
                            console.log("[CHAT] Assistant message saved successfully:", insertData);
                        } catch (saveErr) {
                            console.error("[CHAT] Save assistant message failed after retries:", saveErr);
                        }

                        // Cross-session memory: extract key facts from this turn
                        // Non-blocking: fire-and-forget, failures are logged but ignored
                        extractAndSaveMemories(supabase, user.id, userText, text).catch(() => {});
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
        return apiError("\u670d\u52a1\u6682\u65f6\u4e0d\u53ef\u7528\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5", 500);
    }
}
