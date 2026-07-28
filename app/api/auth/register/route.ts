import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
    const { email, password } = await req.json();

    // Validate before hitting Supabase so users get clear error messages
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        return Response.json({ error: "邮箱格式不正确" }, { status: 400 })
    }
    if (!password || password.length < 6) {
        return Response.json({ error: "密码至少需要 6 位" }, { status: 400 })
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });

    if (error) {
        console.error("[REGISTER] signUp error:", error.status, error.message);
        return Response.json({
            error: error.message
        },
        {
            status: 400
        })
    };

    // When "Confirm email" is enabled in Supabase, signUp succeeds
    // but returns no session until the user clicks the email link
    return Response.json({
        user: data.user,
        needsEmailConfirm: !data.session
    })
}
