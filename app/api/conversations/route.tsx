import { createClient } from "@/lib/supabase/server"


export async function DELETE(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id")

    if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!id) {
        return Response.json({ error: "Missing id" }, { status: 400 })
    }

    console.log("[DELETE] user_id:", user.id);
    console.log("[DELETE] conversation_id:", id);

    // First verify the conversation belongs to this user
    const { data: conversation, error: findError } = await supabase
        .from("conversations")
        .select("id, user_id, title")
        .eq("id", id)
        .single();

    console.log("[DELETE] Found conversation:", conversation);
    console.log("[DELETE] Find error:", findError);

    if (findError || !conversation) {
        console.log("[DELETE] Conversation not found or no access");
        return Response.json({ error: "Conversation not found" }, { status: 404 })
    }

    if (conversation.user_id !== user.id) {
        console.log("[DELETE] user_id mismatch:", conversation.user_id, "vs", user.id);
        return Response.json({ error: "No permission" }, { status: 403 })
    }

    // Delete messages first
    const { error: msgError } = await supabase
        .from("messages")
        .delete()
        .eq("conversation_id", id);

    if (msgError) {
        console.log("[DELETE] Messages delete error:", msgError);
        return Response.json({ error: msgError.message }, { status: 500 })
    }

    // Delete conversation - use .select() to check how many rows were actually deleted
    const { data: deletedRows, error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", id)
        .select("id");

    console.log("[DELETE] Delete result:", deletedRows);
    console.log("[DELETE] Delete error:", error);

    if (error) {
        console.log("[DELETE] Conversation delete error:", error);
        return Response.json({ error: error.message }, { status: 500 })
    }

    if (!deletedRows || deletedRows.length === 0) {
        console.log("[DELETE] WARNING: No rows were deleted! Possible RLS policy issue.");
        console.log("[DELETE] Please check your Supabase RLS policies for the 'conversations' table.");
        return Response.json({
            error: "Delete appeared successful but no data was removed. Check RLS policies in Supabase dashboard."
        }, { status: 500 })
    }

    return Response.json({ success: true, deleted: deletedRows.length })
}

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
        .from("conversations")
        .select("id,title,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ conversations: data });
}
