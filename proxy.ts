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

    // IMPORTANT: getUser() triggers the token refresh when it is close to
    // expiry; the refreshed cookies are written back via setAll above.
    // Do NOT add redirect logic here — the app allows visiting /chat while
    // logged out (login modal is shown client-side).
    await supabase.auth.getUser();

    return response;
}

export const config = {
    matcher: [
        // Run on all routes except static assets
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)"
    ]
};

