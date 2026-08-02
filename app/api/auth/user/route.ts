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

