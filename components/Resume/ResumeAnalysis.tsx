"use client"
import { ResumeReport } from "@/types/resume"
import styles from "@/css/resumeAnalysis.module.css"

interface Props {
  report: ResumeReport;
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "良好" : score >= 60 ? "一般" : "需改进";
  return (
    <div className={styles.scoreCircle} style={{ borderColor: color }}>
      <span className={styles.scoreNum} style={{ color }}>{score}</span>
      <span className={styles.scoreLabel}>{label}</span>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? "#22c55e" : value >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className={styles.scoreBar}>
      <span className={styles.barLabel}>{label}</span>
      <div className={styles.barTrack}>
        <div className={styles.barFill} style={{ width: value + "%", background: color }} />
      </div>
      <span className={styles.barValue}>{value}</span>
    </div>
  );
}

export default function ResumeAnalysis({ report }: Props) {
  if (report._raw) {
    return <div className={styles.rawReport}>{report.summary}</div>;
  }

  return (
    <div className={styles.report}>
      {/* Header with score */}
      <div className={styles.header}>
        <ScoreCircle score={report.score.total} />
        <div className={styles.headerText}>
          <h3>简历分析报告</h3>
          <p>{report.summary}</p>
        </div>
      </div>

      {/* Score breakdown */}
      <div className={styles.scores}>
        <ScoreBar label="内容质量" value={report.score.content} />
        <ScoreBar label="结构规范" value={report.score.structure} />
        <ScoreBar label="关键词" value={report.score.keywords} />
      </div>

      {/* Sections with before/after */}
      {report.sections.length > 0 && (
        <div className={styles.sections}>
          <h4>逐项优化建议</h4>
          {report.sections.map((sec, i) => (
            <details key={i} className={styles.sectionCard}>
              <summary className={styles.sectionSummary}>
                <span className={styles.sectionType}>
                  {sec.type === "project" ? "📁" : sec.type === "skills" ? "🛠" : "💼"}
                </span>
                <span className={styles.sectionName}>{sec.name || sec.type}</span>
                <span className={styles.sectionScore} style={{
                  color: sec.score >= 70 ? "#22c55e" : "#f59e0b"
                }}>{sec.score}分</span>
              </summary>
              <div className={styles.sectionBody}>
                <div className={styles.compare}>
                  <div className={styles.original}>
                    <span className={styles.tag}>原文</span>
                    <p>{sec.original}</p>
                  </div>
                  <div className={styles.optimized}>
                    <span className={styles.tagGood}>优化后</span>
                    <p>{sec.optimized}</p>
                  </div>
                </div>
                {sec.changes.length > 0 && (
                  <ul className={styles.changes}>
                    {sec.changes.map((c, j) => <li key={j}>{c}</li>)}
                  </ul>
                )}
                {sec.suggested_add && sec.suggested_add.length > 0 && (
                  <div className={styles.suggested}>
                    <span>建议新增：</span>
                    {sec.suggested_add.map((s, j) => <span key={j} className={styles.suggestTag}>{s}</span>)}
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      )}

      {/* Keyword gaps */}
      {report.keyword_gaps.length > 0 && (
        <div className={styles.gaps}>
          <h4>⚠ 缺失关键词</h4>
          <div className={styles.gapTags}>
            {report.keyword_gaps.map((k, i) => <span key={i}>{k}</span>)}
          </div>
        </div>
      )}

      {/* Market insights */}
      {report.market_insights && (
        <div className={styles.insights}>
          <h4>📊 市场洞察</h4>
          <p>{report.market_insights}</p>
        </div>
      )}

      {/* Next steps */}
      {report.next_steps.length > 0 && (
        <div className={styles.steps}>
          <h4>🎯 下一步建议</h4>
          <ol>
            {report.next_steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </div>
      )}
    </div>
  );
}
