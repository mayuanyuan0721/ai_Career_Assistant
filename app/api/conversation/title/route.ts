import { NextRequest } from "next/server";
import { generateText } from "ai";
import { deepseek } from "@/lib/deepseek/ai";
import { createClient } from "@/lib/supabase/server";


export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { conversationId, content } = await req.json();

        if (!conversationId || !content) {
            return Response.json({ error: "Missing params" }, { status: 400 })
        }

        console.log("[TITLE] Generating title for:", conversationId);

        const prompt = `Please generate a concise chat title based on the following content.
Requirements:
1. No more than 10 Chinese characters
2. No quotes
3. No period at the end
4. Output the title directly

Content:
${content}`;

        const result = await generateText({
            model: deepseek("deepseek-v4-flash"),
            prompt
        });

        const title = result.text.trim();
        console.log("[TITLE] Generated:", title);

        const { data: updatedRows, error } = await supabase
            .from("conversations")
            .update({ title })
            .eq("id", conversationId)
            .eq("user_id", user.id)
            .select("id, title");

        console.log("[TITLE] Update result:", updatedRows);
        console.log("[TITLE] Update error:", error);

        if (error) {
            console.error("[TITLE] Update failed:", error);
            return Response.json({ error: error.message }, { status: 500 })
        }

        if (!updatedRows || updatedRows.length === 0) {
            console.error("[TITLE] WARNING: 0 rows updated! RLS policy might be blocking UPDATE.");
            console.error("[TITLE] Please add UPDATE RLS policy for conversations table.");
            return Response.json({ error: "Title not saved - RLS blocking" }, { status: 500 })
        }

        return Response.json({ title });
    } catch (err: any) {
        console.error("[TITLE] Error:", err?.message || err);
        // Don't fail the whole flow if title generation fails
        return Response.json({
            error: "Title generation failed, but chat was saved",
            title: null
        }, { status: 500 })
    }
}
