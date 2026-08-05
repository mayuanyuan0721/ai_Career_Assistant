import { createClient } from "@/lib/supabase/server";

// GET - 获取所有行业列表
export async function GET() {
    const supabase = await createClient();
    
    const { data: industries, error } = await supabase
        .from("industries")
        .select("*")
        .eq("is_active", true)
        .order("name");
    
    if (error) {
        console.error("[API Industries] Error:", error);
        return Response.json({ industries: [] }, { status: 500 });
    }
    
    return Response.json({ industries: industries || [] });
}
