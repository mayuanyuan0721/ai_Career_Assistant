import { createClient } from "@/lib/supabase/server"

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Return 401 when there is no session so the frontend can tell
    // "logged out" apart from a successful-but-empty response.
    // Body still carries `user: null` for backward compatibility.
    if (!user) {
        return Response.json({ user: null }, { status: 401 });
    }

    return Response.json({ user });
}
