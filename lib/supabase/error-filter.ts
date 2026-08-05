// Supabase 错误抑制工具
// 用于减少烦人的 AuthRetryableFetchError 日志

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// 需要抑制的错误模式
const SUPPRESSED_PATTERNS = [
    "AuthRetryableFetchError",
    "Unexpected token '<'",
    "is not valid JSON",
    "ConnectTimeoutError",
];

// 安装错误过滤器
export function installSupabaseErrorFilter() {
    if (typeof window !== "undefined") return; // 仅在服务端生效
    
    console.error = (...args: any[]) => {
        const message = args.map(arg => 
            typeof arg === "string" ? arg : arg?.message || String(arg)
        ).join(" ");
        
        // 检查是否匹配抑制模式
        const shouldSuppress = SUPPRESSED_PATTERNS.some(pattern => 
            message.includes(pattern)
        );
        
        if (!shouldSuppress) {
            originalConsoleError.apply(console, args);
        }
    };
    
    console.warn = (...args: any[]) => {
        const message = args.map(arg => 
            typeof arg === "string" ? arg : arg?.message || String(arg)
        ).join(" ");
        
        const shouldSuppress = SUPPRESSED_PATTERNS.some(pattern => 
            message.includes(pattern)
        );
        
        if (!shouldSuppress) {
            originalConsoleWarn.apply(console, args);
        }
    };
}

// 卸载过滤器
export function uninstallSupabaseErrorFilter() {
    if (typeof window !== "undefined") return;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
}
