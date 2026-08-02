// lib/store.ts - Global conversation state management with Zustand (Optimized)
import { create } from 'zustand'
import { Conversation, ConversationType } from '@/types/chat'

export interface UIMessagePart {
    type: string
    text?: string
    [key: string]: unknown
}

export interface UIMessage {
    id: string
    role: "user" | "assistant" | "system"
    parts: UIMessagePart[]
}

export interface AppStoreState {
    conversationId: string
    conversations: Conversation[]
    messagesMap: Record<string, UIMessage[]>
    user: any
    isAuthChecked: boolean
    
    init: (data: { 
        initialConversationId: string 
        conversations?: Conversation[] 
        initialMessages?: UIMessage[]
        user?: any
    }) => void
    
    selectConversation: (id: string) => void
    addMessages: (conversationId: string, messages: UIMessage[]) => void
    setAuth: (user: any) => void
    checkAuth: () => Promise<void>
    fetchConversations: () => Promise<Conversation[]>
    loadMessages: (conversationId: string) => Promise<UIMessage[]>
    hasMessages: (conversationId: string) => boolean
    getMessages: (conversationId: string) => UIMessage[]
    addConversation: (conversation: Conversation) => void
    updateConversation: (id: string, updates: Partial<Conversation>) => void
    getConversationById: (id: string) => Conversation | undefined
    getConversationsByType: (type: ConversationType) => Conversation[]
}

export const useAppStore = create<AppStoreState>()((set, get) => ({
    conversationId: '',
    conversations: [],
    messagesMap: {},
    user: null,
    isAuthChecked: false,
    
    init: ({ initialConversationId, conversations = [], initialMessages = [], user = null }) => {
        console.log('[Store] Initializing with conversationId:', initialConversationId)
        const messagesMap: Record<string, UIMessage[]> = {}
        if (initialMessages.length > 0) {
            messagesMap[initialConversationId] = initialMessages
        }
        
        set({
            conversationId: initialConversationId,
            conversations,
            messagesMap,
            user,
            isAuthChecked: !!user
        })
    },
    
    selectConversation: (id: string) => {
        console.log('[Store] selectConversation:', id)
        set({ conversationId: id })
    },
    
    addMessages: (conversationId: string, messages: UIMessage[]) => {
        set({ 
            messagesMap: { 
                ...get().messagesMap, 
                [conversationId]: messages 
            } 
        })
    },
    
    setAuth: (user: any) => {
        set({ user, isAuthChecked: true })
    },
    
    checkAuth: async () => {
        console.log('[Store] checkAuth called')
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 8000) // ⚡ 增加到 8s
            const res = await fetch('/api/auth/user', { signal: controller.signal })
            clearTimeout(timeoutId)
            
            if (res.ok) {
                const data = await res.json().catch(() => ({}))
                if (data.user) get().setAuth(data.user)
            }
        } catch (err) {
            console.debug('[Store] Auth check skipped:', err instanceof Error ? err.message : String(err))
        }
    },
    
    fetchConversations: async () => {
        console.log('[Store] fetchConversations called')
        
        // 尝试最多 2 次
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 8000) // ⚡ 增加到 8s
                const res = await fetch('/api/conversations', { signal: controller.signal })
                clearTimeout(timeoutId)
                
                if (!res.ok) throw new Error('Failed')
                const data = await res.json().catch(() => ({ conversations: [] }))
                const conversations = data.conversations || []
                console.log('[Store] Fetched conversations:', conversations.length)
                set({ conversations })
                console.log('[Store] Updated conversations in store:', get().conversations.length)
                return conversations
            } catch (err) {
                console.warn(`[Store] Fetch conversations attempt ${attempt} failed:`, err instanceof Error ? err.message : String(err))
                if (attempt === 2) {
                    // 最后一次失败，返回空数组
                    return []
                }
                // 等待 500ms 后重试
                await new Promise(resolve => setTimeout(resolve, 500))
            }
        }
        return []
    },
    
    loadMessages: async (conversationId: string) => {
        console.log('[Store] loadMessages for:', conversationId)
        if (get().hasMessages(conversationId)) {
            console.log('[Store] Messages already cached for:', conversationId)
            return get().messagesMap[conversationId] || []
        }
        
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000) // ⚡ 增加到 10s
            const res = await fetch(`/api/messages?conversationId=${conversationId}`, { signal: controller.signal })
            clearTimeout(timeoutId)
            
            if (!res.ok) throw new Error('Failed')
            const data = await res.json().catch(() => ({ messages: [] }))
            
            const messages: UIMessage[] = (data.messages || []).map((msg: any) => ({
                id: `db-${msg.id}`,
                role: msg.role,
                parts: [{ type: 'text', text: msg.content }]
            }))
            
            get().addMessages(conversationId, messages)
            return messages
        } catch (err) {
            console.error('[Store] Load messages failed:', err)
            return []
        }
    },
    
    hasMessages: (conversationId: string) => {
        return !!get().messagesMap[conversationId]
    },
    
    getMessages: (conversationId: string) => {
        return get().messagesMap[conversationId] || []
    },
    
    addConversation: (conversation: Conversation) => {
        set({ 
            conversations: [...get().conversations, conversation]
        })
    },
    
    updateConversation: (id: string, updates: Partial<Conversation>) => {
        set({
            conversations: get().conversations.map(conv =>
                conv.id === id ? { ...conv, ...updates } : conv
            )
        })
    },
    
    getConversationById: (id: string) => {
        return get().conversations.find(conv => conv.id === id)
    },
    
    getConversationsByType: (type: ConversationType) => {
        return get().conversations.filter(conv => conv.type === type)
    }
}))
