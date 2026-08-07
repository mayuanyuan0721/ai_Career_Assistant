import { createClient } from "@/lib/supabase/server"
import { checkSupabaseHealth } from "@/lib/supabase/health"
import withTimeout from "@/lib/timeout"

// 硬编码兜底数据 - 当 Supabase 不可用或 industries 表不存在时使用
const FALLBACK_INDUSTRIES = [
    { id: 'fallback-1', name: '前端开发', slug: 'frontend', icon: '🎨', description: 'Web前端开发工程师，负责网站界面和交互', is_active: true },
    { id: 'fallback-2', name: '后端开发', slug: 'backend', icon: '⚙️', description: '服务端开发工程师，负责业务逻辑和系统架构', is_active: true },
    { id: 'fallback-3', name: 'UI/UX设计', slug: 'design', icon: '🎯', description: 'UI/UX设计师，负责产品视觉和用户体验', is_active: true },
    { id: 'fallback-4', name: '产品经理', slug: 'product', icon: '📋', description: '产品经理，负责产品规划和需求分析', is_active: true },
    { id: 'fallback-5', name: '数据分析', slug: 'data', icon: '📊', description: '数据分析师，负责数据挖掘和分析', is_active: true },
    { id: 'fallback-6', name: '移动开发', slug: 'mobile', icon: '📱', description: 'iOS/Android开发工程师，负责移动应用开发', is_active: true },
    { id: 'fallback-7', name: '测试工程师', slug: 'testing', icon: '🧪', description: '测试工程师，负责质量保证和自动化测试', is_active: true },
    { id: 'fallback-8', name: '运维工程师', slug: 'devops', icon: '🔧', description: '运维工程师，负责服务器和基础设施管理', is_active: true },
]

// GET - 获取所有行业列表
export async function GET() {
    // 先尝试从 Supabase 获取
    const isHealthy = await checkSupabaseHealth()
    if (isHealthy) {
        try {
            const supabase = await createClient()
            const { data, error } = await withTimeout(
                supabase
                    .from("industries")
                    .select("*")
                    .eq("is_active", true)
                    .order("name"),
                3000,
                { data: null, error: new Error('Query timeout') } as any
            )

            if (!error && data && data.length > 0) {
                return Response.json({ industries: data })
            }

            // 查询失败或无数据，使用兜底
            if (error) {
                console.warn("[API Industries] Supabase query failed, using fallback:", error.message)
            }
        } catch (err) {
            console.warn("[API Industries] Supabase error, using fallback:", err instanceof Error ? err.message : String(err))
        }
    }

    // 兜底：返回硬编码数据
    return Response.json({ industries: FALLBACK_INDUSTRIES })
}
