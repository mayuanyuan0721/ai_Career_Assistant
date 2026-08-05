import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

// GET - 获取指定行业的岗位列表
export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    
    const industrySlug = searchParams.get("industry");
    const level = searchParams.get("level");
    const limit = parseInt(searchParams.get("limit") || "30");
    
    if (!industrySlug) {
        return Response.json({ error: "Missing industry parameter" }, { status: 400 });
    }
    
    // 先获取行业 ID
    const { data: industry } = await supabase
        .from("industries")
        .select("id")
        .eq("slug", industrySlug)
        .single();
    
    if (!industry) {
        return Response.json({ error: "Industry not found" }, { status: 404 });
    }
    
    // 查询岗位
    let query = supabase
        .from("jobs")
        .select("*")
        .eq("industry_id", industry.id)
        .eq("is_active", true)
        .limit(limit);
    
    if (level) {
        query = query.eq("level", level);
    }
    
    const { data: jobs, error } = await query.order("posted_at", { ascending: false });
    
    if (error) {
        console.error("[API Jobs] Error:", error);
        return Response.json({ jobs: [] }, { status: 500 });
    }
    
    return Response.json({ jobs: jobs || [] });
}
