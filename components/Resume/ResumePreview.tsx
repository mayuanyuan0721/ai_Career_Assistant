"use client"
import { useState } from "react"
import styles from "@/css/resumePreview.module.css"

interface Project { name?: string; description?: string; techStack?: string[]; role?: string; startDate?: string; endDate?: string; url?: string; highlights?: string[]; [key: string]: any; }
interface ResumeData {
  basic: { name?: string; email?: string; phone?: string; github?: string; blog?: string; [k:string]:any };
  skills: string[]; projects: Project[]; education: any[];
  [key: string]: any;
}
interface OptimizedSection { [key: string]: { optimized: string; accepted: boolean }; }
interface Props { resume: ResumeData; optimizedSections?: OptimizedSection; onClose: () => void; }

function categorizeSkills(skills: string[]): Record<string,string[]> {
  const kw: Record<string,string[]> = {
    "基础": ["HTML5","HTML","CSS3","CSS","JavaScript","ES6","TypeScript","TS"],
    "前端": ["React","Vue3","Vue","Next.js","Next","Nuxt","Angular","Svelte"],
    "客户端": ["Electron","Tauri","Flutter","React Native"],
    "后端": ["Node.js","Express","Koa","Nest","Spring Boot","Spring","Rust","C++","Java","Python","Go","Django"],
    "生态": ["React Router","Vue Router","Redux","Pinia","Zustand","Element UI","Ant Design","ECharts","Tailwind","Axios"],
    "AI": ["LLM","Agent","RAG","MCP","Skill","Codex","Claude","OpenAI","LangChain"],
    "工程化": ["Webpack","Vite","Rollup","ESLint","Turbopack","Babel","Jest","Cypress"],
    "性能优化": ["SSR","SSG","FCP","LCP","缓存","拆分","懒加载","预加载"],
    "其他": ["Git","Docker","Linux","Nginx","CI/CD","AWS","Vercel","Supabase","MySQL","PostgreSQL","MongoDB","Redis"],
  };
  const cats: Record<string,string[]> = {};
  const used = new Set<string>();
  for (const [cat, ks] of Object.entries(kw)) {
    const m = skills.filter(s => ks.some(k => s.toLowerCase().includes(k.toLowerCase())));
    if (m.length > 0) { cats[cat] = m; m.forEach(s => used.add(s)); }
  }
  const other = skills.filter(s => !used.has(s));
  if (other.length > 0) cats["其他"] = [...(cats["其他"]||[]), ...other];
  return cats;
}

function splitBullets(text: string): string[] {
  if (!text) return [];
  const lines = text.split(/\n/).map(l => l.replace(/^[-•●]s*/, "").trim()).filter(Boolean);
  return lines;
}

export default function ResumePreview({ resume, optimizedSections, onClose }: Props) {
  const [exporting, setExporting] = useState(false);
  const skillGroups = categorizeSkills(resume.skills || []);

  function getDesc(p: Project, i: number): string {
    const key = `project_${i}`;
    if (optimizedSections?.[key]?.accepted) return optimizedSections[key].optimized;
    return p.description || "";
  }

  function handlePrint() {
    setExporting(true);
    setTimeout(() => { window.print(); setExporting(false); }, 100);
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.toolbar}>
        <button className={styles.closeBtn} onClick={onClose}>✕ 关闭预览</button>
        <button className={styles.printBtn} onClick={handlePrint} disabled={exporting}>
          {exporting ? "导出中..." : "📄 导出 PDF"}
        </button>
      </div>

      <div className={styles.page}>

        {/* ── Header ── */}
        <div className={styles.header}>
          <h1 className={styles.name}>{resume.basic?.name || "姓名"}</h1>
          <div className={styles.contact}>
            {resume.basic?.email && <span>{resume.basic.email}</span>}
            {resume.basic?.email && resume.basic?.phone && <span className={styles.dot}>|</span>}
            {resume.basic?.phone && <span>{resume.basic.phone}</span>}
          </div>
        </div>

        {/* ── Education ── */}
        {resume.education?.length > 0 && (
          <>
            <div className={styles.sectionBar}>教育经历</div>
            <div className={styles.sectionBody}>
              {resume.education.map((e: any, i: number) => (
                <div key={i} className={styles.eduItem}>
                  <div className={styles.eduRow}>
                    <span className={styles.eduSchool}>{typeof e === "string" ? e : (e.school || "学校")}{e.tag ? ` ${e.tag}` : ""}</span>
                    {(e.startDate || e.endDate) && <span className={styles.eduDate}>{e.startDate || ""} – {e.endDate || "至今"}</span>}
                  </div>
                  {(e.degree || e.major) && <div className={styles.eduDegree}>{e.degree}{e.major ? ` | ${e.major}` : ""}</div>}
                  {e.courses && <div className={styles.eduCourses}>主修课程：{e.courses}</div>}
                  {e.awards && (
                    <ul className={styles.bulletList}>
                      {(Array.isArray(e.awards) ? e.awards : e.awards.split("\n")).map((a: string, j: number) => (
                        <li key={j}>{a}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Technical Skills ── */}
        <div className={styles.sectionBar}>专业技能</div>
        <div className={styles.sectionBody}>
          {Object.entries(skillGroups).map(([cat, skills]) => (
            <div key={cat} className={styles.skillRow}>
              <span className={styles.skillCat}>{cat}：</span>
              <span className={styles.skillList}>{skills.join("、")}</span>
            </div>
          ))}
        </div>

        {/* ── Project Experience ── */}
        <div className={styles.sectionBar}>项目经历</div>
        <div className={styles.sectionBody}>
          {resume.projects?.map((p: Project, i: number) => {
            const bullets = splitBullets(getDesc(p, i));
            return (
              <div key={i} className={styles.projItem}>
                <div className={styles.projRow}>
                  <span className={styles.projName}>{p.name || `项目${i+1}`}</span>
                  {p.role && <span className={styles.projRole}>{p.role}</span>}
                  {(p.startDate || p.endDate) && <span className={styles.projDate}>{p.startDate || ""} – {p.endDate || "至今"}</span>}
                </div>
                {p.url && <div className={styles.projUrl}>{p.url}</div>}
                {p.techStack && p.techStack.length > 0 && (
                  <div className={styles.projTech}>{p.techStack.join(" + ")}</div>
                )}
                {bullets.length > 0 && (
                  <ul className={styles.bulletList}>
                    {bullets.map((b: string, j: number) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}