import { createClient } from "@/lib/supabase/server";
import { deepseek } from "@/lib/deepseek/ai";
import { profilePrompt } from "@/lib/prompts/resume";
import { generateText } from "ai"

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { resume } = await req.json();

        console.log("[PROFILE] Generating profile for user:", user.id);

        const result = await generateText({
            model: deepseek("deepseek-v4-flash"),
            prompt: profilePrompt + JSON.stringify(resume)
        });

        // Clean AI response - remove markdown code blocks if present
        const cleanText = result.text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        let profile;
        try {
            profile = JSON.parse(cleanText);
        } catch (parseErr) {
            console.error("[PROFILE] JSON parse failed, raw text:", result.text);
            return Response.json({ error: "AI returned invalid JSON" }, { status: 500 });
        }

        console.log("[PROFILE] Parsed profile:", profile);

        // Upsert - use only 'id' as primary key (id = user.id), no separate user_id column
        const { error } = await supabase
            .from("profiles")
            .upsert({
                id: user.id,
                profile: profile
            });

        if (error) {
            console.error("[PROFILE] Upsert error:", error);
            return Response.json({ error: error.message }, { status: 500 })
        }

        console.log("[PROFILE] Saved successfully");
        return Response.json({ profile });
    } catch (err: any) {
        console.error("[PROFILE] Unexpected error:", err?.message || err);
        return Response.json({ error: "Profile generation failed" }, { status: 500 })
    }
}
