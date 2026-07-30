import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import ClientChatShell from "@/components/client-chat/ClientAppShell"

export default async function ChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: conversation } = await supabase.from("conversations").select("id, title, user_id").eq("id", id).single()
    if (conversation && conversation.user_id !== user?.id) return notFound()

    const { data: messageRows } = await supabase.from("messages").select("id, role, content").eq("conversation_id", id).order("created_at", { ascending: true })
    const initialMessages = (messageRows ?? []).map((msg) => ({
        id: `db-${msg.id}`, role: msg.role, parts: [{ type: "text" as const, text: msg.content as string }],
    }))

    return <ClientChatShell user={user || null} initialMessages={initialMessages} initialConversationId={id} />
}

