/**
 * Scheduler - runs all crawl tasks on a cron schedule
 * Default: every day at 02:00 AM
 */
import cron from "node-cron";
import { config } from "./config/crawler.config";
import { crawlJobs } from "./crawlers/jobs";
import { crawlSkills } from "./crawlers/skills";
import { crawlInterview } from "./crawlers/interview";
import { crawlProjects } from "./crawlers/projects";
import { crawlArticles } from "./crawlers/articles";
import { CrawlStats } from "./types";
import { logger } from "./utils/logger";

async function runAll(): Promise<void> {
  logger.info("==============================");
  logger.info("Scheduled crawl started");
  logger.info(`Time: ${new Date().toISOString()}`);
  logger.info("==============================");

  const summary: Record<string, CrawlStats> = {};

  const tasks: Array<{ name: string; fn: () => Promise<CrawlStats> }> = [
    { name: "jobs", fn: crawlJobs },
    { name: "skills", fn: crawlSkills },
    { name: "interview", fn: crawlInterview },
    { name: "projects", fn: crawlProjects },
    { name: "articles", fn: crawlArticles },
  ];

  for (const { name, fn } of tasks) {
    try {
      summary[name] = await fn();
    } catch (err) {
      logger.error(`Task ${name} threw: ${err instanceof Error ? err.message : String(err)}`);
      summary[name] = { added: 0, skipped: 0, errors: 1 };
    }
  }

  logger.info("==============================");
  logger.info("Crawl summary:");
  for (const [task, stats] of Object.entries(summary)) {
    logger.info(`  ${task}: added=${stats.added} skipped=${stats.skipped} errors=${stats.errors}`);
  }
  logger.info("==============================");
}

const schedule = config.schedule;
if (!cron.validate(schedule)) {
  logger.error(`Invalid cron expression: ${schedule}`);
  process.exit(1);
}

logger.info(`Scheduler started, cron: ${schedule}`);
cron.schedule(schedule, async () => {
  try {
    await runAll();
  } catch (err) {
    logger.error(`Top-level error: ${err instanceof Error ? err.message : String(err)}`);
  }
});
