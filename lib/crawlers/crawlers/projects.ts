/**
 * GitHub优秀项目采集模块
 * 通过GitHub Search API采集前端优秀项目
 */
import { config } from "../config/crawler.config";
import { Project, CrawlStats } from "../types";
import { fetchWithRetry } from "../utils/http";
import { cleanText, hashContent, deduplicateByHash, withMeta } from "../utils/formatter";
import { readJsonFile, writeJsonFile } from "../utils/storage";
import { logger } from "../utils/logger";

type ProjectCategory = keyof typeof config.githubKeywords;

interface GitHubRepo {
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  html_url: string;
  topics: string[];
  language: string | null;
}

interface GitHubSearchResponse {
  items: GitHubRepo[];
}

/** 从GitHub API搜索项目 */
async function searchGithubRepos(keyword: string, count: number): Promise<GitHubRepo[]> {
  logger.info(`[GitHub] 搜索: ${keyword}`);
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (config.githubToken) {
    headers["Authorization"] = `token ${config.githubToken}`;
  }

  try {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(keyword)}+language:javascript+language:typescript&sort=stars&order=desc&per_page=${count}`;
    const resp = await fetchWithRetry(url, { headers });
    const data = resp.data as GitHubSearchResponse;
    return data.items || [];
  } catch (err) {
    logger.error(`[GitHub] 搜索失败 "${keyword}": ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

/** 猜测项目技术栈 */
function inferStack(repo: GitHubRepo, category: ProjectCategory): string[] {
  const stack: string[] = [];
  const name = (repo.name + (repo.description || "")).toLowerCase();

  if (name.includes("react") || category === "react") stack.push("React");
  if (name.includes("vue") || category === "vue") stack.push("Vue");
  if (name.includes("next") || category === "nextjs") stack.push("Next.js");
  if (name.includes("typescript") || repo.language === "TypeScript") stack.push("TypeScript");
  if (name.includes("vite")) stack.push("Vite");
  if (name.includes("tailwind")) stack.push("Tailwind CSS");
  if (name.includes("ai") || name.includes("gpt") || name.includes("llm")) stack.push("AI/LLM");
  if (repo.language && !stack.includes(repo.language)) stack.push(repo.language);

  return stack.length ? stack : ["JavaScript"];
}

/** 规范化项目数�?*/
function normalizeProject(repo: GitHubRepo, category: ProjectCategory): Project | null {
  if (!repo.description || repo.description.length < 10) {
    logger.warn(`跳过项目 ${repo.name}: README为空`);
    return null;
  }
  if (repo.stargazers_count < 100) {
    logger.warn(`跳过项目 ${repo.name}: stars(${repo.stargazers_count}) < 100`);
    return null;
  }

  const project: Project = withMeta(
    {
      name: repo.name,
      stack: inferStack(repo, category),
      description: cleanText(repo.description),
      features: repo.topics.slice(0, 8),
      stars: repo.stargazers_count,
      url: repo.html_url,
    },
    "github.com"
  );
  project.hash = hashContent(repo.full_name);
  return project;
}

/** 主入口：采集GitHub项目 */
export async function crawlProjects(): Promise<CrawlStats> {
  const stats: CrawlStats = { added: 0, skipped: 0, errors: 0 };
  logger.info("===== 开始采集GitHub项目 =====");

  const existing = readJsonFile<Project>(config.output.projects);
  const existingHashes = new Set(existing.map((p) => p.hash).filter(Boolean));
  const newProjects: Project[] = [];

  const categoryTargets: Record<ProjectCategory, number> = {
    react: config.targets.projects.react,
    vue: config.targets.projects.vue,
    nextjs: config.targets.projects.nextjs,
    ai: config.targets.projects.ai,
    engineering: config.targets.projects.engineering,
  };

  for (const category of Object.keys(config.githubKeywords) as ProjectCategory[]) {
    const target = categoryTargets[category];
    const keywords = config.githubKeywords[category];
    const perKeyword = Math.ceil(target / keywords.length);

    for (const keyword of keywords) {
      try {
        const repos = await searchGithubRepos(keyword, perKeyword);
        for (const repo of repos) {
          const project = normalizeProject(repo, category);
          if (!project) { stats.skipped++; continue; }
          if (existingHashes.has(project.hash)) { stats.skipped++; continue; }
          newProjects.push(project);
          existingHashes.add(project.hash);
        }
      } catch (err) {
        stats.errors++;
        logger.error(`采集分类 ${category} 关键�?"${keyword}" 失败`);
      }
    }
  }

  const merged = deduplicateByHash([...existing, ...newProjects]);
  writeJsonFile(config.output.projects, merged);
  stats.added = newProjects.length;

  logger.info(`项目采集完成 - 新增:${stats.added} 跳过:${stats.skipped} 错误:${stats.errors}`);
  return stats;
}
