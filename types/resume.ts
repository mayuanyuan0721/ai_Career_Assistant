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
  expression_level?: "weak" | "strong" | "mixed";
  expression_issues?: string[];
  score: number;
}

export interface ResumeReport {
  score: ScoreBreakdown;
  summary: string;
  sections: ReportSection[];
  keyword_gaps: string[];
  market_insights: string;
  next_steps: string[];
  expression_tips?: ExpressionTip[];
  improvement_suggestions?: ImprovementSuggestion[];
  _raw?: boolean;
}

export interface ExpressionTip {
  weak: string;
  strong: string;
  reason: string;
}

export interface ImprovementSuggestion {
  category: "已有能力" | "建议改造" | "可写入简历";
  content: string;
  priority: "high" | "medium" | "low";
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
