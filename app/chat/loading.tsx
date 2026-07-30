// /chat/loading.tsx - Shimmer skeleton shown during page transition
export default function ChatLoading() {
    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar Skeleton */}
            <div className="w-[260px] border-r flex flex-col">
                <div className="p-4 space-y-3">
                    <div className="h-8 w-20 bg-muted animate-pulse rounded" />
                    <div className="h-10 w-full bg-muted animate-pulse rounded" />
                </div>
                <div className="flex-1 p-2 space-y-1">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-10 px-3 py-2 bg-muted animate-pulse rounded" />
                    ))}
                </div>
            </div>

            {/* Chat Area Skeleton */}
            <div className="flex-1 flex flex-col">
                <header className="border-b p-4">
                    <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                </header>
                <main className="flex-1 p-4 space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                            <div className="max-w-[70%] h-20 bg-muted animate-pulse rounded-lg" />
                        </div>
                    ))}
                </main>
                <footer className="border-t p-4">
                    <div className="h-14 w-full bg-muted animate-pulse rounded" />
                </footer>
            </div>

            {/* Right Panel Skeleton */}
            <div className="w-[340px] border-l">
                <div className="h-full p-4 space-y-4">
                    <div className="h-64 bg-muted animate-pulse rounded" />
                    <div className="h-64 bg-muted animate-pulse rounded" />
                </div>
            </div>
        </div>
    )
}
