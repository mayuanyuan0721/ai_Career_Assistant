import { createClient } from "@/lib/supabase/server"
import withTimeout from "@/lib/timeout"

export async function GET() {
    const supabase = await createClient()
    
    // Add timeout to auth check
    const authResult = await withTimeout(
        supabase.auth.getUser(),
        5000,
        { data: { user: null }, error: null } as any
    )
    
    const { data: { user } } = authResult

    if (!user) {
        return Response.json({ user: null }, { status: 401 })
    }

    return Response.json({ user })
}

