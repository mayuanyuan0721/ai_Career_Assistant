"use client"

import { useState, useEffect } from "react"
import { Calendar, RefreshCw, CheckCircle, XCircle, Loader2, Zap } from "lucide-react"

interface UpdateStatus {
    lastUpdate: string | null
    lastUpdateFormatted: string
}

export default function DataUpdateSettings() {
    const [intervalDays, setIntervalDays] = useState<number>(3)
    const [status, setStatus] = useState<UpdateStatus | null>(null)
    const [updating, setUpdating] = useState(false)
    const [updateResult, setUpdateResult] = useState<{ success: boolean; message: string } | null>(null)
    
    // 真实数据爬取状态
    const [crawling, setCrawling] = useState(false)
    const [crawlResult, setCrawlResult] = useState<{ success: boolean; message: string } | null>(null)
    const [crawlPlatform, setCrawlPlatform] = useState("lagou")
    const [crawlKeywords, setCrawlKeywords] = useState("前端开发工程师,React开发工程师,Vue开发工程师")
    const [crawlCities, setCrawlCities] = useState("北京,上海,深圳,杭州")

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

    // 触发真实数据爬取
    const triggerCrawl = async () => {
        setCrawling(true)
        setCrawlResult(null)

        try {
            const res = await fetch("/api/career/crawl-jobs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    platform: crawlPlatform,
                    keywords: crawlKeywords.split(",").map(k => k.trim()).filter(Boolean),
                    cities: crawlCities.split(",").map(c => c.trim()).filter(Boolean),
                    limitPerKeyword: 30,
                })
            })

            const data = await res.json()
            setCrawlResult({
                success: data.success,
                message: data.message,
            })
        } catch (err) {
            setCrawlResult({
                success: false,
                message: "爬取失败：" + (err as Error).message,
            })
        } finally {
            setCrawling(false)
        }
    }

    // 获取支持的平台
    const getSupportedPlatforms = async () => {
        try {
            const res = await fetch("/api/career/crawl-jobs")
            const data = await res.json()
            return data.supportedPlatforms || []
        } catch (err) {
            console.error("Failed to load platforms:", err)
            return []
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

            {/* 真实数据爬取 */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-600" />
                    真实招聘数据爬取
                </h2>
                <p className="text-sm text-muted-foreground">
                    从真实招聘平台获取最新岗位数据（需要先登录）
                </p>

                {/* 登录步骤 */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                        🔐 第一步：登录招聘平台
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        在终端运行以下命令登录（会打开浏览器，手动登录后按回车）：
                    </p>
                    <div className="bg-black text-green-400 p-3 rounded font-mono text-xs">
                        npm run login:boss  # 登录 Boss直聘<br />
                        npm run login:lagou  # 登录拉勾网<br />
                        npm run login:liepin  # 登录猎聘
                    </div>
                    <p className="text-xs text-muted-foreground">
                        💡 登录状态会保存在 auth-state.json 文件中
                    </p>
                </div>

                {/* 平台选择 */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">招聘平台</label>
                    <select
                        value={crawlPlatform}
                        onChange={(e) => setCrawlPlatform(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                    >
                        <option value="boss">Boss直聘</option>
                        <option value="lagou">拉勾网</option>
                        <option value="liepin">猎聘</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                        💡 使用 Puppeteer 无头浏览器爬取真实招聘网站数据（需要先登录）
                    </p>
                </div>

                {/* 关键词配置 */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">搜索关键词（逗号分隔）</label>
                    <input
                        type="text"
                        value={crawlKeywords}
                        onChange={(e) => setCrawlKeywords(e.target.value)}
                        placeholder="前端开发工程师,React开发工程师,Vue开发工程师"
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                </div>

                {/* 城市配置 */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">目标城市（逗号分隔）</label>
                    <input
                        type="text"
                        value={crawlCities}
                        onChange={(e) => setCrawlCities(e.target.value)}
                        placeholder="北京,上海,深圳,杭州"
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                </div>

                {/* 爬取按钮 */}
                <button
                    onClick={triggerCrawl}
                    disabled={crawling}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                >
                    {crawling ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            爬取中...
                        </>
                    ) : (
                        <>
                            <Zap className="h-5 w-5" />
                            开始爬取真实数据
                        </>
                    )}
                </button>

                {/* 爬取结果 */}
                {crawlResult && (
                    <div className={`p-3 rounded-lg flex items-center gap-2 ${
                        crawlResult.success 
                            ? "bg-green-50 text-green-800 border border-green-200" 
                            : "bg-red-50 text-red-800 border border-red-200"
                    }`}>
                        {crawlResult.success ? (
                            <CheckCircle className="h-5 w-5" />
                        ) : (
                            <XCircle className="h-5 w-5" />
                        )}
                        <span className="text-sm">{crawlResult.message}</span>
                    </div>
                )}

                {/* 提示 */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs space-y-1">
                    <p className="font-medium">✅ 说明：</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>使用 Puppeteer 无头浏览器直接爬取招聘网站</li>
                        <li>无需申请任何 API Key，但需要先登录</li>
                        <li>爬取的是真实招聘网站的实时数据</li>
                        <li>建议设置合理的爬取间隔，避免请求过快</li>
                        <li>数据会自动导入数据库</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
