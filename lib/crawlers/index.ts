/**
 * CLI entry point
 * Usage: ts-node src/index.ts --task [jobs|skills|skills-model|interview|projects|articles|resume|all]
 */
import { crawlJobs } from "./crawlers/jobs";
import { crawlSkills } from "./crawlers/skills";
import { crawlSkillsModel } from "./crawlers/skills_model";
import { crawlInterview } from "./crawlers/interview";
import { crawlProjects } from "./crawlers/projects";
import { crawlArticles } from "./crawlers/articles";
import { crawlResumeExamples } from "./crawlers/resume_examples";
import { CrawlStats } from "./types";
import { logger } from "./utils/logger";

const args = process.argv.slice(2);
const taskIndex = args.indexOf("--task");
const task = taskIndex !== -1 ? args[taskIndex + 1] : "all";

const taskMap: Record<string, () => Promise<CrawlStats>> = {
  jobs: crawlJobs,
  skills: crawlSkills,
  "skills-model": crawlSkillsModel,
  interview: crawlInterview,
  projects: crawlProjects,
  articles: crawlArticles,
  resume: crawlResumeExamples,
};

async function main() {
  logger.info(`Task: ${task}`);

  if (task === "all") {
    const results: Record<string, CrawlStats> = {};
    for (const [name, fn] of Object.entries(taskMap)) {
      try {
        results[name] = await fn();
      } catch (err) {
        logger.error(`Task ${name} failed: ${err instanceof Error ? err.message : String(err)}`);
        results[name] = { added: 0, skipped: 0, errors: 1 };
      }
    }
    logger.info("===== All tasks done =====");
    for (const [name, stats] of Object.entries(results)) {
      logger.info(`  ${name}: added=${stats.added} skipped=${stats.skipped} errors=${stats.errors}`);
    }
  } else if (task in taskMap) {
    try {
      const stats = await taskMap[task]();
      logger.info(`Done: added=${stats.added} skipped=${stats.skipped} errors=${stats.errors}`);
    } catch (err) {
      logger.error(`Task ${task} failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  } else {
    console.error(`Unknown task: ${task}`);
    console.error(`Available: ${Object.keys(taskMap).join(", ")}, all`);
    process.exit(1);
  }
}

main().catch((err) => {
  logger.error(`Unhandled error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
