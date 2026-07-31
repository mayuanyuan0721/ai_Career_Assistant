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
    const { data: updateData, error: updateError, count } = await supabase
        .from("resumes")
        .update({ parsed_data: resumeData, report: report })
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id)
        .select();

    // 如果更新成功且有行被更新
    if (!updateError && updateData && updateData.length > 0) {
        console.log("[Resume Save] Updated existing record");
        return Response.json({ success: true, data: updateData[0] });
    }

    // 没有可更新的记录，插入新记录
    console.log("[Resume Save] No existing record found, inserting new one");
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

    console.log("[Resume Save] Inserted new record");
    return Response.json({ success: true, data: insertData?.[0] });
}
