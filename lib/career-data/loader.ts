/**
 * Career Data Loader
 * Reads crawled JSON data from data/career-data/ with TTL caching.
 * Cache expires every 60s so fresh crawler output is picked up automatically.
 */
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data", "career-data");
const CACHE_TTL_MS = 60_000; // 60 seconds

// ─── Cache layer ────────────────────────────────────────────────────────────
interface CacheEntry<T> {
  data: T;
  mtime: number;
}

const cache = new Map<string, CacheEntry<any>>();

function readJsonCached<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) return [];

  const stat = fs.statSync(filePath);
  const cached = cache.get(filePath);

  if (cached && cached.mtime === stat.mtimeMs) {
    return cached.data as T[];
  }

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw) as T[];
    cache.set(filePath, { data, mtime: stat.mtimeMs });
    return data;
  } catch {
    return [];
  }
}

// ─── Data file paths ────────────────────────────────────────────────────────
const FILES = {
  jobs: path.join(DATA_DIR, "jobs", "frontend_jobs.json"),
  interview: path.join(DATA_DIR, "interview", "questions.json"),
  projects: path.join(DATA_DIR, "projects", "projects.json"),
  articles: path.join(DATA_DIR, "articles", "frontend_articles.json"),
  resumeExamples: path.join(DATA_DIR, "resume", "resume_examples.json"),
};

// ─── Types ──────────────────────────────────────────────────────────────────
export interface Job {
  title: string;
  level: string;
  experience: string;
  salary: string;
  skills: string[];
  responsibility: string;
  description: string;
  source: string;
}

export interface InterviewQuestion {
  category: string;
  level: string;
  question: string;
  answer: string;
  source: string;
}

export interface Project {
  name: string;
  stack: string[];
  description: string;
  features: string[];
  stars: number;
  url: string;
}

export interface ResumeExample {
  id: string;
  target_job: string;
  target_level: string;
  summary: string;
  skills: string[];
  projects: Array<{
    name: string;
    description: string;
    highlights: string[];
    tech_stack: string[];
  }>;
}

// ─── Query functions ────────────────────────────────────────────────────────

export function getJobs(options?: {
  level?: string;
  skills?: string[];
  limit?: number;
}): Job[] {
  let data = readJsonCached<Job>(FILES.jobs);

  if (options?.level) {
    data = data.filter((j) => j.level === options.level);
  }
  if (options?.skills?.length) {
    const skillSet = new Set(options.skills.map((s) => s.toLowerCase()));
    data = data.filter((j) =>
      j.skills.some((s) => skillSet.has(s.toLowerCase()))
    );
  }

  return data.slice(0, options?.limit ?? 20);
}

export function getInterviewQuestions(options?: {
  category?: string;
  level?: string;
  limit?: number;
}): InterviewQuestion[] {
  let data = readJsonCached<InterviewQuestion>(FILES.interview);

  if (options?.category) {
    data = data.filter((q) => q.category === options.category);
  }
  if (options?.level) {
    data = data.filter((q) => q.level === options.level);
  }

  return data.slice(0, options?.limit ?? 20);
}

export function getProjects(options?: {
  stack?: string[];
  limit?: number;
}): Project[] {
  let data = readJsonCached<Project>(FILES.projects);

  if (options?.stack?.length) {
    const stackSet = new Set(options.stack.map((s) => s.toLowerCase()));
    data = data.filter((p) =>
      p.stack.some((s) => stackSet.has(s.toLowerCase()))
    );
  }

  return data.slice(0, options?.limit ?? 20);
}

export function getResumeExamples(options?: {
  targetLevel?: string;
  limit?: number;
}): ResumeExample[] {
  let data = readJsonCached<ResumeExample>(FILES.resumeExamples);

  if (options?.targetLevel) {
    data = data.filter((e) => e.target_level === options.targetLevel);
  }

  return data.slice(0, options?.limit ?? 5);
}

// ─── Prompt formatting ─────────────────────────────────────────────────────

export function formatJobsForPrompt(jobs: Job[], maxChars = 1500): string {
  if (!jobs.length) return "(No matching job data available)";

  const lines = jobs.map(
    (j) =>
      `- ${j.title} [${j.level}] ${j.salary} | Skills: ${j.skills.join(", ")}`
  );
  const text = lines.join("\n");
  return text.length > maxChars ? text.slice(0, maxChars) + "..." : text;
}

export function formatInterviewForPrompt(
  questions: InterviewQuestion[],
  maxChars = 2000
): string {
  if (!questions.length) return "(No matching interview data available)";

  const lines = questions.map(
    (q, i) => `${i + 1}. [${q.category}/${q.level}] ${q.question}`
  );
  const text = lines.join("\n");
  return text.length > maxChars ? text.slice(0, maxChars) + "..." : text;
}

export function formatExamplesForPrompt(
  examples: ResumeExample[],
  maxChars = 2000
): string {
  if (!examples.length) return "(No matching resume examples available)";

  const blocks = examples.map(
    (e) =>
      `## ${e.target_job} (${e.target_level})\nSummary: ${e.summary}\nSkills: ${e.skills.join(", ")}\nProjects:\n${e.projects.map((p) => `  - ${p.name}: ${p.description}`).join("\n")}`
  );
  const text = blocks.join("\n\n");
  return text.length > maxChars ? text.slice(0, maxChars) + "..." : text;
}
