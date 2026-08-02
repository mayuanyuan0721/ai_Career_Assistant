import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refresh the Supabase session on every request so that API routes
// and server components always see a valid access token.
// NOTE: this file MUST live at the project root (next to app/),
// otherwise Next.js will not run it.
export async function proxy(req: NextRequest) {
    let response = NextResponse.next({ request: req });

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
    
    return response;
}

export const config = {
    matcher: [
        // Run on all routes except static assets
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|json)$).*)"
    ]
};
