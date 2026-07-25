import { NextRequest } from 'next/server';
import { streamText, generateText } from 'ai';
import { createClient } from "@/lib/supabase/server"
import { resumeOptimizePrompt, jobMatchPrompt, interviewPrompt } from "@/lib/prompts/resume"
import { deepseek } from "@/lib/deepseek/ai"


export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!user) {
        return new Response("Unauthorized", { status: 401 })
    }

    try {
        const { messages, conversationId, mode, resume } = await request.json();

        console.log("[CHAT] conversationId:", conversationId);
        console.log("[CHAT] mode:", mode);

        const modelMessages = messages.map((msg: any) => ({
            role: msg.role,
            content:
                msg.parts
                    ?.filter((p: any) => p.type === "text")
                    .map((p: any) => p.text)
                    .join("") || ""
        }));

        const lastMessage = messages[messages.length - 1];
        let systemPrompt = "";
        switch (mode) {
            case "resume_optimize":
                systemPrompt = resumeOptimizePrompt;
                break;
            case "job_match":
                systemPrompt = jobMatchPrompt;
                break;
            case "interview":
                systemPrompt = interviewPrompt;
                break;
            default:
                systemPrompt = "";
        }

        const userText = lastMessage.parts.filter(
            (p: any) => p.type === 'text'
        ).map(
            (p: any) => p.text
        ).join("")

        // Ensure conversation exists
        const { data: conversation } = await supabase
            .from("conversations")
            .select("id,title")
            .eq("id", conversationId)
            .single();

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

        // Save user message
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

        const result = streamText({
            model: deepseek('deepseek-v4-flash'),
            instructions: systemPrompt,
            messages: modelMessages,

            onFinish: async ({ text }) => {
                console.log("[CHAT] onFinish: saving assistant message");

                // Save assistant message
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

                if (!conversationId) {
                    return;
                }

                // Check current title
                const { data: conv, error: convErr } = await supabase
                    .from("conversations")
                    .select("title, user_id")
                    .eq("id", conversationId)
                    .single();

                console.log("[CHAT] onFinish: current conversation:", conv);
                console.log("[CHAT] onFinish: query error:", convErr);

                if (convErr || !conv) {
                    console.log("[CHAT] onFinish: cannot find conversation");
                    return;
                }

                // Only generate title for new conversations
                if (conv.title === "New Chat" || conv.title === "新对话") {
                    console.log("[CHAT] onFinish: generating new title...");

                    const titlePrompt = `Please generate a concise chat title based on the following content.
Requirements:
1. No more than 10 Chinese characters
2. No quotes
3. No period at the end
4. Output the title directly
Content:
${userText}`;

                    try {
                        const titleResult = await generateText({
                            model: deepseek("deepseek-v4-flash"),
                            prompt: titlePrompt
                        });

                        const newTitle = titleResult.text.trim();
                        console.log("[CHAT] onFinish: generated title:", newTitle);

                        // Update title WITH user_id check
                        const { error: updateErr } = await supabase
                            .from("conversations")
                            .update({ title: newTitle })
                            .eq("id", conversationId)
                            .eq("user_id", user.id);

                        if (updateErr) {
                            console.error("[CHAT] onFinish: update title failed:", updateErr);
                        } else {
                            console.log("[CHAT] onFinish: title updated successfully");
                        }
                    } catch (titleErr) {
                        console.error("[CHAT] onFinish: title generation error:", titleErr);
                    }
                }
            }
        });

        return result.toUIMessageStreamResponse();
    } catch (err) {
        console.error("[CHAT] Error:", err);
        return new Response("Stream error", { status: 500 });
    }
}
