import { generateText } from "ai";
import { deepseek } from "@/lib/deepseek/ai";

// Maximum tokens to send to the model (leaves room for response).
// DeepSeek-v4-flash has 64K context; we use ~50% to be safe.
export const MAX_CONTEXT_TOKENS = 30000;

// Rough token estimation.
// For mixed Chinese/English text, ~1.5 chars per token is a reasonable average.
// This is much cheaper than calling tiktoken and accurate enough for our purposes.
export function estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 1.5);
}

export function estimateMessagesTokens(messages: { role: string; content: string }[]): number {
    // Each message has ~4 tokens of overhead (role, separators)
    return messages.reduce((sum, msg) => sum + estimateTokens(msg.content) + 4, 0);
}

/**
 * Truncate messages to fit within the token limit.
 * Strategy: keep the most recent messages, discard the oldest.
 * Always keeps at least the last 2 messages (1 user + 1 assistant) to maintain coherence.
 */
export function truncateMessages(
    messages: { role: string; content: string }[],
    maxTokens: number = MAX_CONTEXT_TOKENS
): { role: string; content: string }[] {
    const totalTokens = estimateMessagesTokens(messages);

    // If already within limit, return as-is
    if (totalTokens <= maxTokens) {
        return messages;
    }

    // Work backwards, keeping the most recent messages
    const kept: { role: string; content: string }[] = [];
    let tokensUsed = 0;

    for (let i = messages.length - 1; i >= 0; i--) {
        const msgTokens = estimateTokens(messages[i].content) + 4;
        if (tokensUsed + msgTokens > maxTokens && kept.length >= 2) {
            break;
        }
        kept.unshift(messages[i]);
        tokensUsed += msgTokens;
    }

    return kept;
}

/**
 * Summarize older messages using AI to preserve context without using too many tokens.
 * Returns a summary string that can be prepended to the context.
 */
export async function summarizeMessages(
    messages: { role: string; content: string }[]
): Promise<string> {
    if (messages.length === 0) return "";

    const conversationText = messages
        .map((m) => `${m.role === "user" ? "\u7528\u6237" : "AI"}: ${m.content}`)
        .join("\n\n");

    try {
        const { text } = await generateText({
            model: deepseek("deepseek-v4-flash"),
            prompt: `\u8bf7\u5c06\u4ee5\u4e0b\u5bf9\u8bdd\u5185\u5bb9\u538b\u7f29\u6210\u7b80\u6d01\u7684\u6458\u8981\uff0c\u4fdd\u7559\u5173\u952e\u4fe1\u606f\uff08\u7528\u6237\u9700\u6c42\u3001AI \u7ed9\u51fa\u7684\u5efa\u8bae\u3001\u8fbe\u6210\u7684\u7ed3\u8bba\uff09\u3002
\u8981\u6c42\uff1a
1. \u7528\u4e2d\u6587\u8f93\u51fa
2. \u4e0d\u8d85\u8fc7 300 \u5b57
3. \u4fdd\u7559\u91cd\u8981\u7ec6\u8282\uff0c\u53bb\u6389\u5bd2\u6684\u548c\u91cd\u590d\u5185\u5bb9
4. \u76f4\u63a5\u8f93\u51fa\u6458\u8981\uff0c\u4e0d\u8981\u52a0\u524d\u7f00

\u5bf9\u8bdd\u5185\u5bb9\uff1a
${conversationText}`
        });
        return text.trim();
    } catch (err) {
        console.error("[CONTEXT] Summarization failed:", err);
        // Fail gracefully: return a placeholder so the conversation can continue
        return "[\u65e9\u671f\u5bf9\u8bdd\u6458\u8981\u751f\u6210\u5931\u8d25]";
    }
}

/**
 * Smart context preparation: if messages exceed the token limit,
 * summarize the older portion and keep the recent messages intact.
 *
 * Returns: { messages, summary }
 *   - messages: the truncated recent messages
 *   - summary: a summary of older messages (empty string if no truncation needed)
 */
export async function prepareContext(
    messages: { role: string; content: string }[],
    maxTokens: number = MAX_CONTEXT_TOKENS
): Promise<{ messages: { role: string; content: string }[]; summary: string }> {
    const totalTokens = estimateMessagesTokens(messages);

    // Within limit: no truncation needed
    if (totalTokens <= maxTokens) {
        return { messages, summary: "" };
    }

    // Find the split point: keep roughly the last 40% of tokens
    const keepTokensBudget = Math.floor(maxTokens * 0.6);
    const kept: { role: string; content: string }[] = [];
    let keptTokens = 0;

    for (let i = messages.length - 1; i >= 0; i--) {
        const msgTokens = estimateTokens(messages[i].content) + 4;
        if (keptTokens + msgTokens > keepTokensBudget && kept.length >= 4) {
            break;
        }
        kept.unshift(messages[i]);
        keptTokens += msgTokens;
    }

    // Everything before the kept portion gets summarized
    const olderMessages = messages.slice(0, messages.length - kept.length);
    const summary = await summarizeMessages(olderMessages);

    return { messages: kept, summary };
}
