// Supabase 连接健康检查 - 带缓存，避免每次请求都等待超时
// 核心思路：如果 Supabase 最近不可用，直接快速失败，不等待 5s+ 超时

type HealthStatus = {
    isHealthy: boolean
    lastCheck: number
}

let cachedHealth: HealthStatus = { isHealthy: true, lastCheck: 0 }
const HEALTH_TTL = 30_000 // 30秒内复用检查结果
const HEALTH_TIMEOUT = 3000 // 健康检查超时 3s

export async function checkSupabaseHealth(): Promise<boolean> {
    const now = Date.now()

    // 缓存有效期内直接返回
    if (now - cachedHealth.lastCheck < HEALTH_TTL) {
        return cachedHealth.isHealthy
    }

    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT)

        // 用 Supabase REST API 根路径做轻量探活
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
            {
                headers: {
                    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                },
                signal: controller.signal,
            }
        )
        clearTimeout(timeoutId)

        // 任何 HTTP 响应（包括 404）都说明 Supabase 服务可达
        // 404 可能只是根路径没有对应表，但服务本身是在线的
        const isHealthy = true
        cachedHealth = { isHealthy, lastCheck: now }
        return isHealthy
    } catch {
        // fetch 完全失败（网络不可达/DNS 失败/超时）才标记为不健康
        cachedHealth = { isHealthy: false, lastCheck: now }
        console.warn('[Supabase Health] Connection failed, will fast-fail for 30s')
        return false
    }
}

// 重置健康状态（用于测试或手动刷新）
export function resetHealthCache() {
    cachedHealth = { isHealthy: true, lastCheck: 0 }
}
