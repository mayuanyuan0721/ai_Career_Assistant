import { createClient } from "@/lib/supabase/server";

// 根据 conversationId 加载简历解析数据和分析报告
export async function GET(req: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return Response.json({ error: "未登录" }, { status: 401 });
    }

    if (!conversationId) {
        return Response.json({ error: "缺少会话ID" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("resumes")
        .select("id, parsed_data, report, filename")
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    if (error || !data) {
        return Response.json({ data: null });
    }

    return Response.json({
        data: {
            resumeId: data.id,
            filename: data.filename,
            resumeData: data.parsed_data,
            report: data.report
        }
    });
}
