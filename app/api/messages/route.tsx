import { createClient } from "@/lib/supabase/server"
import { checkSupabaseHealth } from "@/lib/supabase/health"
import { NextRequest } from "next/server"
import withTimeout from "@/lib/timeout"


export async function GET(req: NextRequest) {
    const isHealthy = await checkSupabaseHealth()
    if (!isHealthy) {
        return Response.json({ messages: [] }, { status: 200 })
    }

    const supabase = await createClient()
    const authResult = await withTimeout(
        supabase.auth.getUser(),
        3000,
        { data: { user: null }, error: null } as any
    )
    const { data: { user } } = authResult

    if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conversationId = req.nextUrl.searchParams.get('conversationId')
    if (!conversationId) {
        return Response.json({ error: "Missing conversationId" }, { status: 400 })
    }

    const { data: conversation } = await withTimeout(
        supabase
            .from("conversations")
            .select("id")
            .eq("id", conversationId)
            .eq("user_id", user.id)
            .single(),
        3000,
        { data: null, error: new Error('Query timeout') } as any
    )

    if (!conversation) {
        return Response.json({ error: "Conversation not found" }, { status: 404 })
    }

    const { data, error } = await withTimeout(
        supabase
            .from("messages")
            .select('id, role, content, created_at')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true }),
        5000,
        { data: [], error: new Error('Query timeout') } as any
    )

    if (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ messages: data })
}


export async function POST(req: Request) {
    const isHealthy = await checkSupabaseHealth()
    if (!isHealthy) {
        return Response.json({ error: "Service unavailable" }, { status: 503 })
    }

    const supabase = await createClient()
    const authResult = await withTimeout(
        supabase.auth.getUser(),
        3000,
        { data: { user: null }, error: null } as any
    )
    const { data: { user } } = authResult

    if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { conversationId, role, content } = body

    if (!conversationId || !role || !content) {
        return Response.json({ error: "Missing fields" }, { status: 400 })
    }

    if (role !== "user" && role !== "assistant") {
        return Response.json({ error: "Invalid role" }, { status: 400 })
    }
    if (typeof content !== "string" || content.length > 100000) {
        return Response.json({ error: "Invalid content" }, { status: 400 })
    }

    const { data: conversation } = await withTimeout(
        supabase
            .from("conversations")
            .select("id")
            .eq("id", conversationId)
            .eq("user_id", user.id)
            .single(),
        3000,
        { data: null, error: new Error('Query timeout') } as any
    )

    if (!conversation) {
        return Response.json({ error: "Conversation not found" }, { status: 404 })
    }

    const { data, error } = await withTimeout(
        supabase
            .from("messages")
            .insert({
                conversation_id: conversationId,
                role,
                content
            })
            .select()
            .single(),
        5000,
        { data: null, error: new Error('Insert timeout') } as any
    )

    if (error) {
        console.error("[MESSAGES POST] Insert error:", error)
        return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ data })
}
