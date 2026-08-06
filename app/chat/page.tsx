import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

// /chat - Server Component
// Creates a new conversation ID and redirects to /chat/[id]
export default async function ChatPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Generate a new conversation ID
    const newId = crypto.randomUUID()

    // 已登录用户预创建会话，未登录用户仅生成临时 ID（客户端会弹出登录弹窗）
    if (user) {
        await supabase.from("conversations").insert({
            id: newId,
            title: "\u65b0\u5bf9\u8bdd",
            user_id: user.id,
        })
    }

    redirect(`/chat/${newId}`)
}
