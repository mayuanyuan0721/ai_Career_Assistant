import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// 创建 Supabase 客户端工厂
// 注意：不在这里设置全局 fetch 超时，由各调用方按需设置 AbortController
export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(
                            ({ name, value, options }) => {
                                cookieStore.set(
                                    name,
                                    value,
                                    options
                                );
                            }
                        );
                    } catch (error) {
                        // 静默失败，避免阻塞请求
                        // 这个错误通常发生在 Server Components 中，可以忽略
                    }
                },
            },
        }
    );
}

// 创建一个不会抛出错误的客户端（用于非关键路径）
export async function createSafeClient() {
    try {
        return await createClient();
    } catch (error) {
        console.warn("[Supabase] Failed to create client, returning mock client");
        
        // 返回一个模拟客户端，避免崩溃
        return {
            auth: {
                getUser: async () => ({ data: { user: null }, error: null }),
                getSession: async () => ({ data: { session: null }, error: null }),
            },
            from: () => ({
                select: () => ({ data: [], error: null }),
                insert: () => ({ data: [], error: null }),
                update: () => ({ data: [], error: null }),
                delete: () => ({ data: [], error: null }),
            }),
        } as any;
    }
}