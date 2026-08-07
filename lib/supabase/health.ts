// Supabase 连接健康检查 - 带缓存，避免每次请求都等待超时
// 核心思路：如果 Supabase 最近不可用，直接快速失败，不等待 5s+ 超时

type HealthStatus = {
    isHealthy: boolean
    lastCheck: number
}

let cachedHealth: HealthStatus = { isHealthy: true, lastCheck: 0 }
const HEALTH_TTL = 30_000 // 健康结果缓存 30 秒
const UNHEALTHY_TTL = 10_000 // 不健康结果只缓存 10 秒，避免一次抖动导致长时间快速失败
const HEALTH_TIMEOUT = 3000 // 健康检查超时 3s

async function probeOnce(): Promise<boolean> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT)
    try {
        // 用 Supabase REST API 根路径做轻量探活
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
            {
                headers: {
                    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                },
                signal: controller.signal,
                cache: 'no-store',
            }
        )
        // 任何 HTTP 响应（包括 401/404）都说明 Supabase 服务可达
        void res
        return true
    } catch (err) {
        console.warn('[Supabase Health] Probe failed:', err instanceof Error ? err.message : err)
        return false
    } finally {
        clearTimeout(timeoutId)
    }
}

export async function checkSupabaseHealth(): Promise<boolean> {
    const now = Date.now()

    // 缓存有效期内直接返回
    const ttl = cachedHealth.isHealthy ? HEALTH_TTL : UNHEALTHY_TTL
    if (now - cachedHealth.lastCheck < ttl) {
        return cachedHealth.isHealthy
    }

    // 失败时重试一次，避免瞬时网络抖动导致 30 秒内全部请求 503
    let isHealthy = await probeOnce()
    if (!isHealthy) {
        isHealthy = await probeOnce()
    }

    cachedHealth = { isHealthy, lastCheck: Date.now() }
    if (!isHealthy) {
        console.warn(`[Supabase Health] Connection failed, will fast-fail for ${UNHEALTHY_TTL / 1000}s`)
    }
    return isHealthy
}

// 重置健康状态（用于测试或手动刷新）
export function resetHealthCache() {
    cachedHealth = { isHealthy: true, lastCheck: 0 }
}
