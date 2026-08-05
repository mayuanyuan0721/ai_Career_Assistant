import { NextRequest } from "next/server";
import { initScheduler, manualUpdate, getLastUpdateTime, forceUpdate } from "@/lib/crawlers/scheduler";

// GET - 获取上次更新时间
export async function GET() {
    const lastUpdate = getLastUpdateTime();
    
    return Response.json({
        lastUpdate: lastUpdate ? lastUpdate.toISOString() : null,
        lastUpdateFormatted: lastUpdate ? lastUpdate.toLocaleString("zh-CN") : "从未更新"
    });
}

// POST - 触发更新
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { force = false, tasks = ["all"] } = body;
        
        console.log("[API] Update requested:", { force, tasks });
        
        let success: boolean;
        if (force) {
            success = await forceUpdate(tasks);
        } else {
            success = await manualUpdate(tasks);
        }
        
        return Response.json({
            success,
            message: success ? "更新成功" : "更新失败，请查看日志"
        });
    } catch (err) {
        console.error("[API] Update error:", err);
        return Response.json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error"
        }, { status: 500 });
    }
}
