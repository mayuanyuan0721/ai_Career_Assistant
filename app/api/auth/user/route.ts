import { createClient } from "@/lib/supabase/server"
import { checkSupabaseHealth } from "@/lib/supabase/health"
import withTimeout from "@/lib/timeout"

export async function GET() {
    // 先检查 Supabase 是否可达（缓存命中时 <1ms）
    const isHealthy = await checkSupabaseHealth()
    if (!isHealthy) {
        return Response.json({ user: null }, { status: 401 })
    }

    try {
        const supabase = await createClient()
        
        const authResult = await withTimeout(
            supabase.auth.getUser(),
            3000,
            { data: { user: null }, error: null } as any
        )
        
        const { data: { user } } = authResult

        if (!user) {
            return Response.json({ user: null }, { status: 401 })
        }

        return Response.json({ user })
    } catch {
        return Response.json({ user: null }, { status: 401 })
    }
}
