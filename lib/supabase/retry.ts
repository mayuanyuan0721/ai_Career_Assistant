// Supabase 重试辅助函数
export async function withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (err) {
            lastError = err as Error;
            console.warn(
                `[Supabase Retry] Attempt ${attempt}/${maxRetries} failed:`,
                err instanceof Error ? err.message : String(err)
            );
            
            if (attempt < maxRetries) {
                const waitTime = delayMs * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }
    
    throw lastError;
}
