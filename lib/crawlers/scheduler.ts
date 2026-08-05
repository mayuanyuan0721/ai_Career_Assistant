// 定时任务管理器
import { crawlJobs } from "./crawlers/jobs";
import { crawlSkills } from "./crawlers/skills";
import { crawlInterview } from "./crawlers/interview";
import { crawlProjects } from "./crawlers/projects";
import { crawlArticles } from "./crawlers/articles";
import { crawlResumeExamples } from "./crawlers/resume_examples";

// 默认配置：每 3 天更新一次
const DEFAULT_INTERVAL_DAYS = 3;

// 上次更新时间的存储 key（仅在浏览器环境可用）
const LAST_UPDATE_KEY = "career_data_last_update";

// 获取上次更新时间（仅客户端）
function getLastUpdate(): Date | null {
    if (typeof window === "undefined") return null; // 服务端返回 null
    const stored = localStorage.getItem(LAST_UPDATE_KEY);
    if (!stored) return null;
    return new Date(stored);
}

// 设置上次更新时间（仅客户端）
function setLastUpdate(date: Date) {
    if (typeof window === "undefined") return; // 服务端不执行
    localStorage.setItem(LAST_UPDATE_KEY, date.toISOString());
}

// 检查是否需要更新
function shouldUpdate(intervalDays: number = DEFAULT_INTERVAL_DAYS): boolean {
    const lastUpdate = getLastUpdate();
    if (!lastUpdate) return true; // 从未更新过
    
    const now = new Date();
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    console.log(`[Scheduler] Last update: ${lastUpdate.toLocaleString()}, ${diffDays.toFixed(1)} days ago`);
    
    return diffDays >= intervalDays;
}

// 执行更新
async function performUpdate(tasks: string[] = ["all"]): Promise<boolean> {
    console.log("[Scheduler] Starting data update...");
    
    try {
        const taskMap: Record<string, () => Promise<any>> = {
            jobs: crawlJobs,
            skills: crawlSkills,
            interview: crawlInterview,
            projects: crawlProjects,
            articles: crawlArticles,
            resume: crawlResumeExamples,
        };
        
        let successCount = 0;
        let failCount = 0;
        
        for (const task of tasks) {
            if (task === "all") {
                // 更新所有任务
                for (const [name, fn] of Object.entries(taskMap)) {
                    try {
                        console.log(`[Scheduler] Updating ${name}...`);
                        await fn();
                        successCount++;
                    } catch (err) {
                        console.error(`[Scheduler] Failed to update ${name}:`, err);
                        failCount++;
                    }
                }
                break;
            } else {
                const fn = taskMap[task];
                if (fn) {
                    try {
                        console.log(`[Scheduler] Updating ${task}...`);
                        await fn();
                        successCount++;
                    } catch (err) {
                        console.error(`[Scheduler] Failed to update ${task}:`, err);
                        failCount++;
                    }
                }
            }
        }
        
        setLastUpdate(new Date());
        console.log(`[Scheduler] Update completed: ${successCount} succeeded, ${failCount} failed`);
        
        return failCount === 0;
    } catch (err) {
        console.error("[Scheduler] Update failed:", err);
        return false;
    }
}

// 初始化定时任务（在应用启动时调用）
export async function initScheduler(intervalDays: number = DEFAULT_INTERVAL_DAYS) {
    console.log(`[Scheduler] Initializing with interval: ${intervalDays} days`);
    
    if (shouldUpdate(intervalDays)) {
        console.log("[Scheduler] Data is outdated, updating now...");
        await performUpdate(["all"]);
    } else {
        console.log("[Scheduler] Data is up to date");
    }
}

// 手动触发更新
export async function manualUpdate(tasks: string[] = ["all"]) {
    return await performUpdate(tasks);
}

// 获取上次更新时间
export function getLastUpdateTime(): Date | null {
    return getLastUpdate();
}

// 强制立即更新（忽略时间间隔）
export async function forceUpdate(tasks: string[] = ["all"]) {
    console.log("[Scheduler] Force update triggered");
    return await performUpdate(tasks);
}
