import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

// /chat - Server Component
// Creates a new conversation ID and redirects to /chat/[id]
export default async function ChatPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Generate a new conversation ID
    const newId = crypto.randomUUID()

    // If user is logged in, pre-create the conversation in DB
    if (user) {
        await supabase.from("conversations").insert({
            id: newId,
            title: "\u65b0\u5bf9\u8bdd",
            user_id: user.id,
        })
    }

    redirect(`/chat/${newId}`)
}
