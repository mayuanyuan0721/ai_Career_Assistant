import { createClient } from "@/lib/supabase/server"

// Timeout helper
async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, fallback: T): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
        )
    ]).catch(() => fallback)
}

export async function DELETE(req: Request) {
    const supabase = await createClient()
    
    const authResult = await withTimeout(
        supabase.auth.getUser(),
        5000,
        { data: { user: null }, error: null } as any
    )
    
    const { data: { user } } = authResult
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!id) {
        return Response.json({ error: "Missing id" }, { status: 400 })
    }

    const { data: conversation, error: findError } = await withTimeout(
        supabase.from("conversations").select("id, user_id, title").eq("id", id).single(),
        5000,
        { data: null, error: new Error('Query timeout') } as any
    )

    if (findError || !conversation) {
        return Response.json({ error: "Conversation not found" }, { status: 404 })
    }

    if (conversation.user_id !== user.id) {
        return Response.json({ error: "No permission" }, { status: 403 })
    }

    const { error: msgError } = await withTimeout(
        supabase.from("messages").delete().eq("conversation_id", id),
        5000,
        { error: new Error('Delete timeout') } as any
    )

    if (msgError) {
        return Response.json({ error: msgError.message }, { status: 500 })
    }

    const { data: deletedRows, error } = await withTimeout(
        supabase.from("conversations").delete().eq("id", id).select("id"),
        5000,
        { data: null, error: new Error('Delete timeout') } as any
    )

    if (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }

    if (!deletedRows || deletedRows.length === 0) {
        return Response.json({
            error: "Delete appeared successful but no data was removed. Check RLS policies in Supabase dashboard."
        }, { status: 500 })
    }

    return Response.json({ success: true, deleted: deletedRows.length })
}

export async function GET() {
    const supabase = await createClient()
    
    const authResult = await withTimeout(
        supabase.auth.getUser(),
        5000,
        { data: { user: null }, error: null } as any
    )
    
    const { data: { user } } = authResult
    
    if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Include type field in query
    const { data, error } = await withTimeout(
        supabase
            .from("conversations")
            .select("id, title, type, interview_data, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true }),
        5000,
        { data: [], error: new Error('Query timeout') } as any
    )

    if (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ conversations: data })
}

export async function POST(req: Request) {
    const supabase = await createClient()
    
    const authResult = await withTimeout(
        supabase.auth.getUser(),
        5000,
        { data: { user: null }, error: null } as any
    )
    
    const { data: { user } } = authResult
    
    if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, type = 'chat', interview_data = {} } = body

    const { data, error } = await withTimeout(
        supabase
            .from("conversations")
            .insert({
                user_id: user.id,
                title,
                type,
                interview_data
            })
            .select()
            .single(),
        5000,
        { data: null, error: new Error('Insert timeout') } as any
    )

    if (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ conversation: data })
}

