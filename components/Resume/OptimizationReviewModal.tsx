"use client"

import { useState } from "react"
import styles from "@/css/optimizationReview.module.css"

interface Project {
  name: string
  role?: string
  startDate?: string
  endDate?: string
  techStack?: string[]
  description?: string
}

interface Props {
  resume: any  // 完整的简历数据
  optimizedContent: string  // AI 的完整回复
  extractedDescription: string  // 提取出的要替换的具体内容
  targetProjectIndex?: number  // 要替换的项目索引
  onAccept: (content: string) => void
  onReject: () => void
  onClose: () => void
}

export default function OptimizationReviewModal({
  resume,
  optimizedContent,
  extractedDescription,
  targetProjectIndex,
  onAccept,
  onReject,
  onClose
}: Props) {
  console.log('[OptimizationReviewModal] Render with:', {
    hasResume: !!resume,
    projectsCount: resume?.projects?.length || 0,
    targetProjectIndex,
    extractedDescriptionLength: extractedDescription?.length || 0
  })
  
  const handleAccept = () => {
    onAccept(extractedDescription)
  }

  const handleReject = () => {
    onReject()
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>优化建议确认</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {/* Content - Two columns */}
        <div className={styles.content}>
          {/* Left: Full Resume */}
          <div className={styles.leftPanel}>
            <h3 className={styles.sectionTitle}>原始简历</h3>
            <div className={styles.resumeContainer}>
              {resume?.projects?.map((project: Project, index: number) => {
                const isTarget = index === targetProjectIndex
                return (
                  <div 
                    key={index} 
                    className={`${styles.projectCard} ${isTarget ? styles.projectCardTarget : ''}`}
                  >
                    <div className={styles.projectHeader}>
                      <span className={styles.projectName}>{project.name || `项目${index + 1}`}</span>
                      {project.role && <span className={styles.projectRole}>{project.role}</span>}
                    </div>
                    {(project.startDate || project.endDate) && (
                      <div className={styles.projectDate}>
                        {project.startDate || ""} - {project.endDate || "至今"}
                      </div>
                    )}
                    {project.techStack && project.techStack.length > 0 && (
                      <div className={styles.projectTech}>
                        技术栈：{project.techStack.join("、")}
                      </div>
                    )}
                    <div className={styles.projectDesc}>
                      {isTarget ? (
                        <>
                          <div className={styles.highlightLabel}>即将替换以下内容：</div>
                          <div className={styles.highlightedDesc}>
                            {project.description || "（暂无描述）"}
                          </div>
                        </>
                      ) : (
                        project.description || "（暂无描述）"
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: AI Suggestion */}
          <div className={styles.rightPanel}>
            <h3 className={styles.sectionTitle}>AI 优化建议</h3>
            <div className={styles.suggestionContainer}>
              {extractedDescription}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.btnAccept}
            onClick={handleAccept}
          >
            接受修改
          </button>
          <button
            className={styles.btnReject}
            onClick={handleReject}
          >
            跳过
          </button>
        </div>
      </div>
    </div>
  )
}
