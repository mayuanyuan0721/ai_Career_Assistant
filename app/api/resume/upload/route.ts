import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    const supabase = await createClient();
    const { content, filename, conversationId } = await req.json();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return Response.json({ error: "未登录" }, { status: 401 });
    }

    // 先尝试带 conversation_id 插入
    const insertData: any = { user_id: user.id, filename, content };
    if (conversationId) {
        insertData.conversation_id = conversationId;
    }

    let { data, error } = await supabase
        .from("resumes")
        .insert(insertData)
        .select()
        .single();

    // 如果 conversation_id 列不存在，回退到不带 conversation_id 的插入
    if (error && conversationId && (error.code === "42703" || error.message?.includes("conversation_id"))) {
        console.warn("[Resume Upload] conversation_id column not found, falling back to insert without it");
        const { user_id, filename: fn, content: ct } = insertData;
        const result = await supabase
            .from("resumes")
            .insert({ user_id, filename: fn, content: ct })
            .select()
            .single();
        data = result.data;
        error = result.error;
    }

    if (error) {
        console.error("[Resume Upload] Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ resumeId: data.id });
}
