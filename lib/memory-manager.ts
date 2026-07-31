import { generateText } from "ai";
import { deepseek } from "@/lib/deepseek/ai";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Extract key facts about the user from a conversation and store them as memories.
 * Memories persist across sessions, allowing the AI to "remember" the user.
 *
 * Called after each conversation turn (non-blocking, failures are logged but ignored).
 */
export async function extractAndSaveMemories(
    supabase: SupabaseClient,
    userId: string,
    userMessage: string,
    assistantMessage: string
): Promise<void> {
    try {
        // Combine user + assistant messages for extraction
        const conversationText = `\u7528\u6237: ${userMessage}\nAI: ${assistantMessage}`;

        const { text } = await generateText({
            model: deepseek("deepseek-v4-flash"),
            prompt: `\u4ece\u4ee5\u4e0b\u5bf9\u8bdd\u4e2d\u63d0\u53d6\u5173\u4e8e\u7528\u6237\u7684\u5173\u952e\u4fe1\u606f\u3002\u53ea\u63d0\u53d6\u660e\u786e\u63d0\u5230\u7684\u4e8b\u5b9e\uff0c\u4e0d\u8981\u731c\u6d4b\u3002

\u63d0\u53d6\u7c7b\u522b\uff08\u53ea\u8f93\u51fa\u6709\u503c\u7684\uff09\uff1a
- skills: \u7528\u6237\u638c\u63e1\u6280\u80fd\uff08\u5982 React, TypeScript, Python \u7b49\uff09
- target_role: \u7528\u6237\u7684\u76ee\u6807\u804c\u4f4d\uff08\u5982\u524d\u7aef\u5de5\u7a0b\u5e08\u3001\u5168\u6808\u5f00\u53d1\u7b49\uff09
- experience_level: \u7528\u6237\u7684\u7ecf\u9a8c\u6c34\u5e73\uff08\u521d\u7ea7/\u4e2d\u7ea7/\u9ad8\u7ea7\uff09
- goals: \u7528\u6237\u7684\u76ee\u6807\uff08\u5982\u627e\u5de5\u4f5c\u3001\u8f6c\u884c\u3001\u63d0\u5347\u6280\u80fd\u7b49\uff09
- preferences: \u7528\u6237\u7684\u504f\u597d\uff08\u5982\u559c\u6b22\u7684\u6280\u672f\u6808\u3001\u5de5\u4f5c\u65b9\u5f0f\u7b49\uff09
- background: \u7528\u6237\u7684\u80cc\u666f\u4fe1\u606f\uff08\u5982\u5b66\u5386\u3001\u5de5\u4f5c\u5e74\u9650\u7b49\uff09

\u8f93\u51fa\u683c\u5f0f\uff08JSON \u6570\u7ec4\uff0c\u6bcf\u9879\u5305\u542b key \u548c value\uff09\uff1a
[{"key": "skills", "value": "React, TypeScript"}, {"key": "target_role", "value": "\u524d\u7aef\u5de5\u7a0b\u5e08"}]

\u5982\u679c\u6ca1\u6709\u503c\u5f97\u8bb0\u5f55\u7684\u65b0\u4fe1\u606f\uff0c\u8f93\u51fa\u7a7a\u6570\u7ec4 []\u3002

\u5bf9\u8bdd\uff1a
${conversationText}`
        });

        // Parse the JSON response
        let memories: { key: string; value: string }[];
        try {
            // Try to extract JSON from the response (might have markdown code blocks)
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            memories = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        } catch (parseErr) {
            console.warn("[MEMORY] Failed to parse extraction result:", parseErr);
            return;
        }

        if (!memories.length) return;

        // Upsert each memory (update if key exists, insert if new)
        for (const mem of memories) {
            const { error } = await supabase
                .from("user_memories")
                .upsert(
                    {
                        user_id: userId,
                        key: mem.key,
                        value: mem.value,
                    },
                    { onConflict: "user_id,key" }
                );

            if (error) {
                console.warn(`[MEMORY] Failed to save ${mem.key}:`, error.message);
            }
        }

        console.log(`[MEMORY] Saved ${memories.length} memories for user ${userId}`);
    } catch (err) {
        // Non-critical: log and continue
        console.error("[MEMORY] Extraction failed:", err);
    }
}

/**
 * Retrieve all memories for a user and format them as a string
 * suitable for injection into the system prompt.
 */
export async function getUserMemories(
    supabase: SupabaseClient,
    userId: string
): Promise<string> {
    try {
        const { data, error } = await supabase
            .from("user_memories")
            .select("key, value")
            .eq("user_id", userId)
            .order("updated_at", { ascending: false });

        if (error) {
            console.warn("[MEMORY] Failed to fetch memories:", error.message);
            return "";
        }

        if (!data || data.length === 0) return "";

        // Format as a readable block
        const lines = data.map((m) => `- ${formatKey(m.key)}: ${m.value}`);
        return `\n\n[\u7528\u6237\u753b\u50cf - \u6765\u81ea\u5386\u53f2\u5bf9\u8bdd\u7684\u8bb0\u5fc6]\n${lines.join("\n")}`;
    } catch (err) {
        console.error("[MEMORY] Fetch failed:", err);
        return "";
    }
}

/**
 * Convert internal key names to user-friendly labels.
 */
function formatKey(key: string): string {
    const labels: Record<string, string> = {
        skills: "\u638c\u63e1\u6280\u80fd",
        target_role: "\u76ee\u6807\u804c\u4f4d",
        experience_level: "\u7ecf\u9a8c\u6c34\u5e73",
        goals: "\u5f53\u524d\u76ee\u6807",
        preferences: "\u4e2a\u4eba\u504f\u597d",
        background: "\u80cc\u666f\u4fe1\u606f",
    };
    return labels[key] || key;
}
