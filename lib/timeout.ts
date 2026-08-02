// Timeout helper with configurable defaults
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 10000, fallback: T): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
        )
    ]).catch(() => fallback);
}

export default withTimeout;
