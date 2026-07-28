import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    let email = "";
    let password = "";
    try {
        ({ email, password } = await req.json());
    } catch {
        return Response.json({ error: "请求格式不正确" }, { status: 400 });
    }

    // Validate before hitting Supabase so users get clear error messages
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        return Response.json({ error: "邮箱格式不正确" }, { status: 400 });
    }
    if (!password) {
        return Response.json({ error: "请输入密码" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error("[LOGIN] signIn error:", error.status, error.message);
        return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ user: data.user });
}
