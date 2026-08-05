"use client"

import { useState, useEffect } from "react"
import { Calendar, RefreshCw, CheckCircle, XCircle, Loader2 } from "lucide-react"

interface UpdateStatus {
    lastUpdate: string | null
    lastUpdateFormatted: string
}

export default function DataUpdateSettings() {
    const [intervalDays, setIntervalDays] = useState<number>(3)
    const [status, setStatus] = useState<UpdateStatus | null>(null)
    const [updating, setUpdating] = useState(false)
    const [updateResult, setUpdateResult] = useState<{ success: boolean; message: string } | null>(null)

    // 加载配置和状态
    useEffect(() => {
        // 获取上次更新时间
        fetch("/api/career/update")
            .then(res => res.json())
            .then(data => setStatus(data))
            .catch(err => console.error("Failed to load status:", err))

        // 加载保存的更新间隔
        const saved = localStorage.getItem("career_data_update_interval")
        if (saved) {
            setIntervalDays(parseInt(saved))
        }
    }, [])

    // 保存更新间隔配置
    const saveInterval = () => {
        localStorage.setItem("career_data_update_interval", intervalDays.toString())
        alert(`已保存：每 ${intervalDays} 天自动更新一次`)
    }

    // 手动触发更新
    const triggerUpdate = async (force: boolean = false) => {
        setUpdating(true)
        setUpdateResult(null)

        try {
            const res = await fetch("/api/career/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ force })
            })

            const data = await res.json()
            setUpdateResult({
                success: data.success,
                message: data.message
            })

            // 刷新状态
            const statusRes = await fetch("/api/career/update")
            const statusData = await statusRes.json()
            setStatus(statusData)
        } catch (err) {
            setUpdateResult({
                success: false,
                message: "更新失败：" + (err as Error).message
            })
        } finally {
            setUpdating(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold mb-2">📊 数据更新设置</h1>
                <p className="text-muted-foreground">配置职业数据的自动更新频率</p>
            </div>

            {/* 当前状态 */}
            <div className="bg-card border rounded-lg p-4 space-y-2">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    更新状态
                </h2>
                <div className="text-sm space-y-1">
                    <p>
                        <span className="font-medium">上次更新：</span>
                        {status?.lastUpdateFormatted || "加载中..."}
                    </p>
                    {status?.lastUpdate && (
                        <p className="text-xs text-muted-foreground">
                            ({new Date(status.lastUpdate).toLocaleString()})
                        </p>
                    )}
                </div>
            </div>

            {/* 更新间隔配置 */}
            <div className="bg-card border rounded-lg p-4 space-y-4">
                <h2 className="text-lg font-semibold">⏰ 自动更新间隔</h2>
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium">每</label>
                    <input
                        type="number"
                        min="1"
                        max="30"
                        value={intervalDays}
                        onChange={(e) => setIntervalDays(parseInt(e.target.value) || 3)}
                        className="w-20 px-3 py-1 border rounded"
                    />
                    <label className="text-sm font-medium">天更新一次</label>
                </div>
                <button
                    onClick={saveInterval}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                >
                    保存配置
                </button>
                <p className="text-xs text-muted-foreground">
                    💡 提示：应用启动时会检查是否需要更新。如果距离上次更新超过设定的天数，会自动更新数据。
                </p>
            </div>

            {/* 手动更新 */}
            <div className="bg-card border rounded-lg p-4 space-y-4">
                <h2 className="text-lg font-semibold">🔄 手动更新</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => triggerUpdate(false)}
                        disabled={updating}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                    >
                        {updating ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                更新中...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="h-4 w-4" />
                                立即更新
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => triggerUpdate(true)}
                        disabled={updating}
                        className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
                    >
                        {updating ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                强制更新中...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="h-4 w-4" />
                                强制更新（忽略时间间隔）
                            </>
                        )}
                    </button>
                </div>

                {/* 更新结果 */}
                {updateResult && (
                    <div className={`p-3 rounded-lg flex items-center gap-2 ${
                        updateResult.success 
                            ? "bg-green-50 text-green-800 border border-green-200" 
                            : "bg-red-50 text-red-800 border border-red-200"
                    }`}>
                        {updateResult.success ? (
                            <CheckCircle className="h-5 w-5" />
                        ) : (
                            <XCircle className="h-5 w-5" />
                        )}
                        <span>{updateResult.message}</span>
                    </div>
                )}
            </div>

            {/* 说明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm space-y-2">
                <h3 className="font-semibold">📌 使用说明</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>自动更新会在应用启动时检查并执行</li>
                    <li>手动更新会立即爬取最新的职业数据</li>
                    <li>强制更新会忽略时间间隔，立即执行</li>
                    <li>更新的数据包括：岗位信息、技能要求、面试题库等</li>
                    <li>数据存储在本地 JSON 文件中，无需数据库</li>
                </ul>
            </div>
        </div>
    )
}
