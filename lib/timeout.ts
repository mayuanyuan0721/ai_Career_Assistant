// Timeout helper with configurable defaults
// Accepts PromiseLike to support Supabase's PostgrestBuilder
async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number = 10000, fallback: T): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
        )
    ]).catch(() => fallback);
}

export default withTimeout;
