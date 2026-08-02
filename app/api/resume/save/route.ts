import { createClient } from "@/lib/supabase/server";

// 保存解析后的简历数据和分析报告
export async function POST(req: Request) {
    const supabase = await createClient();
    const { conversationId, resumeData, report, filename } = await req.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return Response.json({ error: "未登录" }, { status: 401 });
    }

    if (!conversationId) {
        return Response.json({ error: "缺少会话ID" }, { status: 400 });
    }

    // 先尝试更新已有记录
    const { data: updateData, error: updateError } = await supabase
        .from("resumes")
        .update({ parsed_data: resumeData, report: report })
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id)
        .select();

    if (!updateError && updateData && updateData.length > 0) {
        return Response.json({ success: true, data: updateData[0] });
    }

    const { data: insertData, error: insertError } = await supabase
        .from("resumes")
        .insert({
            user_id: user.id,
            conversation_id: conversationId,
            filename: filename || "resume",
            content: "",
            parsed_data: resumeData,
            report: report
        })
        .select();

    if (insertError) {
        console.error("[Resume Save] Insert error:", insertError);
        return Response.json({ error: insertError.message }, { status: 500 });
    }

    return Response.json({ success: true, data: insertData?.[0] });
}
