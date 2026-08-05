import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(req: NextRequest) {
    let response = NextResponse.next({ request: req });

    try {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return req.cookies.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value }) =>
                            req.cookies.set(name, value)
                        );
                        response = NextResponse.next({ request: req });
                        cookiesToSet.forEach(({ name, value, options }) =>
                            response.cookies.set(name, value, options)
                        );
                    }
                }
            }
        );

        // ⚡ 优化：不要每次都 await getUser()，让后端 API 按需刷新 token
        // 只传递 cookie，不进行验证
        
        console.log("[Proxy] Request processed successfully");
    } catch (error) {
        // ⚠️ Supabase 连接失败时，仍然允许请求继续
        console.warn("[Proxy] Supabase connection failed, continuing without auth:", 
            error instanceof Error ? error.message : String(error));
    }
    
    return response;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ]
};
