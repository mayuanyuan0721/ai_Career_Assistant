"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface Props {
    open: boolean
    onClose: () => void
}

export default function AuthModal({ open, onClose }: Props) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [mode, setMode] = useState<"login" | "register">("login")
    const router = useRouter()
    const { checkAuth, fetchConversations } = useAppStore()

    const handleLogin = async () => {
        setLoading(true)
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        })
        if (!res.ok) {
            alert("\u767b\u5f55\u5931\u8d25\uff0c\u8bf7\u8f93\u5165\u6b63\u786e\u7684\u90ae\u7bb1\u548c\u5bc6\u7801")
        } else {
            onClose()
            // 登录成功后，强制刷新页面以重新初始化 store
            router.refresh()
            
            // 等待一小段时间确保 refresh 完成，然后重新加载数据
            setTimeout(async () => {
                await checkAuth()
                await fetchConversations()
            }, 100)
        }
        setLoading(false)
    }

    async function register() {
        setLoading(true)
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            })
            const data = await res.json()

            if (!res.ok) {
                alert("\u6ce8\u518c\u5931\u8d25\uff1a" + (data.error || "\u672a\u77e5\u9519\u8bef"))
                return
            }

            if (data.needsEmailConfirm) {
                alert("\u6ce8\u518c\u6210\u529f\uff01\u8bf7\u524d\u5f80\u90ae\u7bb1\u70b9\u51fb\u786e\u8ba4\u94fe\u63a5\u540e\u518d\u767b\u5f55")
            } else {
                alert("\u6ce8\u518c\u6210\u529f\uff0c\u8bf7\u767b\u5f55")
            }
            changeMode("login")
        } catch {
            alert("\u6ce8\u518c\u8bf7\u6c42\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u7f51\u7edc\u540e\u91cd\u8bd5")
        } finally {
            setLoading(false)
        }
    }

    const changeMode = (newMode: "login" | "register") => {
        setMode(newMode)
        setEmail("")
        setPassword("")
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>{mode === "login" ? "\u767b\u5f55" : "\u6ce8\u518c"}</DialogTitle>
                    <DialogDescription>
                        {mode === "login"
                            ? "\u8f93\u5165\u8d26\u53f7\u5bc6\u7801\u767b\u5f55\u4f60\u7684\u8d26\u6237"
                            : "\u521b\u5efa\u4e00\u4e2a\u65b0\u8d26\u6237"}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <input
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        placeholder={"\u90ae\u7bb1"}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        placeholder={"\u5bc6\u7801"}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <DialogFooter className="flex-col sm:flex-col gap-2">
                    <Button
                        onClick={mode === "login" ? handleLogin : register}
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? "\u5904\u7406\u4e2d..." : (mode === "login" ? "\u767b\u5f55" : "\u6ce8\u518c")}
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                        {mode === "login" ? (
                            <>{"\u6ca1\u6709\u8d26\u53f7\uff1f"}{" "}
                                <button className="text-primary underline-offset-4 hover:underline" onClick={() => changeMode("register")}>
                                    {"\u6ce8\u518c"}
                                </button>
                            </>
                        ) : (
                            <>{"\u5df2\u6709\u8d26\u53f7\uff1f"}{" "}
                                <button className="text-primary underline-offset-4 hover:underline" onClick={() => changeMode("login")}>
                                    {"\u767b\u5f55"}
                                </button>
                            </>
                        )}
                    </p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
