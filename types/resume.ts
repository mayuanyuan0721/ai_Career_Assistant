export interface ScoreBreakdown {
  total: number;
  content: number;
  structure: number;
  keywords: number;
}

export interface ReportSection {
  type: "project" | "skills" | "experience" | "education";
  name?: string;
  original: string;
  optimized: string;
  changes: string[];
  suggested_add?: string[];
  score: number;
}

export interface ResumeReport {
  score: ScoreBreakdown;
  summary: string;
  sections: ReportSection[];
  keyword_gaps: string[];
  market_insights: string;
  next_steps: string[];
  _raw?: boolean;
}

export interface OptimizedSection {
  [key: string]: {
    optimized: string;
    accepted: boolean;
  };
}

export interface SectionOptResult {
  optimized: string;
  changes: { what: string; why: string }[];
  interview_questions: string[];
  tech_highlights: string[];
}
