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
        return Response.json({ error: "Missing conversationId" })
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
        console.log("[MESSAGES POST] No user found");
        return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json();
    console.log("[MESSAGES POST] Saving:", body.conversationId, body.role);
    const { conversationId, role, content } = body;

    if (!conversationId || !role || !content) {
        return Response.json({ error: "Missing fields" }, { status: 400 })
    }

    // Directly insert - the FK constraint will ensure conversation exists
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
