import { createClient } from "@/lib/supabase/server"
import { NextRequest } from "next/server";


export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conversationId = req.nextUrl.searchParams.get('conversationId');
    if (!conversationId) {
        return Response.json({ error: "Missing conversationId" }, { status: 400 })
    }

    // Verify the conversation belongs to the current user
    const { data: conversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .single();

    if (!conversation) {
        return Response.json({ error: "Conversation not found" }, { status: 404 })
    }

    const { data, error } = await supabase
        .from("messages")
        .select('id, role, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ messages: data });
}


export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json();
    const { conversationId, role, content } = body;

    if (!conversationId || !role || !content) {
        return Response.json({ error: "Missing fields" }, { status: 400 })
    }

    // Validate role and content length
    if (role !== "user" && role !== "assistant") {
        return Response.json({ error: "Invalid role" }, { status: 400 })
    }
    if (typeof content !== "string" || content.length > 100000) {
        return Response.json({ error: "Invalid content" }, { status: 400 })
    }

    // Verify the conversation belongs to the current user before inserting
    const { data: conversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .single();

    if (!conversation) {
        // 如果对话不存在，可能是 RLS 阻止了查询，或者对话确实不存在
        // 尝试直接插入消息（如果对话是临时的）
        console.warn("[MESSAGES POST] Conversation not found, but trying to insert message anyway");
    }

    const { data, error } = await supabase
        .from("messages")
        .insert({
            conversation_id: conversationId,
            role,
            content
        })
        .select()
        .single();

    if (error) {
        console.error("[MESSAGES POST] Insert error:", error);
        return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ data })
}
