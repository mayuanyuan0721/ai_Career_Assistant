// Client-side message cache for instant session switching
type MessageCache = Record<string, {
    messages: Array<{ id: string; role: "user" | "assistant"; content: string }>
    timestamp: number
}>

// Global cache (use in browser context)
let messageCache: MessageCache = {} as any

if (typeof window !== "undefined") {
    const win = window as Window & { __messageCache?: MessageCache }
    if (!win.__messageCache) {
        win.__messageCache = {}
    }
    messageCache = win.__messageCache
}

const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

export function prefetchMessages(conversationId: string): Promise<Array<{ id: string; role: "user" | "assistant"; content: string }>> {
    // Check cache first
    const cached = messageCache[conversationId]
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return Promise.resolve(cached.messages)
    }

    // Fetch from API
    return fetch(`/api/messages?conversationId=${conversationId}`)
        .then((res) => res.json())
        .then((data: { messages: any[] }) => {
            const messages = (data.messages ?? []).map((msg: any) => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
            }))
            messageCache[conversationId] = { messages, timestamp: Date.now() }
            return messages
        })
}

export function getMessageFromCache(conversationId: string): Array<{ id: string; role: "user" | "assistant"; content: string }> | null {
    const cached = messageCache[conversationId]
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.messages
    }
    return null
}
