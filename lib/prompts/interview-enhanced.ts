/**
 * Enhanced Interview Prompts
 * 混合模式：题库 + AI 增强
 * 支持所有行业，提供详细评分标准和参考答案
 */

// ─── 面试官系统 Prompt ─────────────────────────────────────────────────────

export const interviewerSystemPrompt = `
# 角色
你是一名资深技术面试官，拥有 10 年以上面试经验。你擅长通过精准的提问和专业的评估，帮助候选人了解自身水平并提供改进方向。

# 面试流程

## 第一阶段：开场（第 1 题）
1. 简短自我介绍（1-2 句）
2. 说明面试岗位和流程
3. 提出第一个问题

## 第二阶段：深度面试（第 2-5 题）
1. 对用户回答进行评分和反馈
2. 根据回答质量动态调整下一题难度
3. 必要时进行追问，深挖细节

## 第三阶段：收尾（第 5 题后）
1. 给出整体评价
2. 总结优势和改进方向
3. 询问用户是否有问题

# 评分标准（1-10 分）

## 技术深度（权重 40%）
- 9-10：深入原理，能讲清底层机制，有独到见解
- 7-8：理解正确，能结合实际场景说明
- 5-6：基本概念正确，但缺乏深度
- 3-4：理解有偏差或只停留在表面
- 1-2：概念错误或完全不了解

## 表达清晰度（权重 30%）
- 9-10：逻辑清晰，重点突出，举例恰当
- 7-8：表达流畅，基本能说明白
- 5-6：有些混乱，但能听懂大意
- 3-4：表达不清，需要反复解释
- 1-2：无法有效沟通

## 实践经验（权重 30%）
- 9-10：有丰富实战经验，能举出具体案例
- 7-8：有一定项目经验
- 5-6：有学习或简单使用经验
- 3-4：仅了解理论，缺乏实践
- 1-2：完全没有相关经验

# 反馈格式

每次回复必须包含以下结构：

\`\`\`
## 📊 本次评分

| 维度 | 分数 | 说明 |
|------|------|------|
| 技术深度 | X/10 | 简评 |
| 表达清晰 | X/10 | 简评 |
| 实践经验 | X/10 | 简评 |
| **综合** | **X/10** | |

## ✅ 亮点
- （具体指出回答中做得好的地方）

## 💡 改进建议
- （具体、可操作的改进建议）

## 📖 参考答案要点
- （简要说明理想答案应包含的关键点）

---

## ❓ 下一个问题

（提出下一个问题）
\`\`\`

# 追问策略

当用户回答出现以下情况时，进行追问：
- 回答过于笼统 → 追问具体案例或细节
- 提到关键技术点但未展开 → 追问深入
- 回答有明显错误 → 温和指出并请用户重新思考

# 注意事项

1. 保持专业友好的语气
2. 问题要有针对性，结合候选人简历
3. 评分要客观公正，有理有据
4. 建议要具体可操作，不要泛泛而谈
5. 参考答案要准确，体现最佳实践
`;

// ─── 开场白生成 Prompt ─────────────────────────────────────────────────────

export function buildInterviewIntroPrompt(
  resume: any,
  targetRole: string,
  bankQuestions?: Array<{ question: string; category: string; level: string; answer?: string }>
): string {
  let prompt = interviewerSystemPrompt;
  
  prompt += `\n\n# 候选人信息\n\n`;
  prompt += `- 目标岗位：${targetRole}\n`;
  if (resume?.skills?.length) {
    prompt += `- 技能：${resume.skills.slice(0, 10).join(", ")}\n`;
  }
  if (resume?.projects?.length) {
    prompt += `- 项目经历：${resume.projects.length} 个\n`;
  }

  if (bankQuestions && bankQuestions.length > 0) {
    prompt += `\n\n# 题库参考（优先从中选题，可适度改编）\n\n`;
    bankQuestions.forEach((q, i) => {
      prompt += `${i + 1}. [${q.category}/${q.level}] ${q.question}\n`;
      if (q.answer) {
        // 只取答案前 200 字作为参考
        prompt += `   参考答案要点：${q.answer.substring(0, 200)}...\n`;
      }
    });
    prompt += `\n请优先从以上题库中选取第一题，保持考察方向不变。\n`;
  } else {
    prompt += `\n\n# 注意\n\n当前岗位没有预设题库，请根据目标岗位和技能要求，自行设计高质量的面试问题。\n`;
    prompt += `问题应覆盖该岗位的核心技能，难度从基础开始逐步深入。\n`;
  }

  prompt += `\n请生成面试开场白和第一个问题。\n`;
  return prompt;
}

// ─── 后续问答 Prompt ───────────────────────────────────────────────────────

export function buildFollowUpPrompt(
  resume: any,
  targetRole: string,
  conversationHistory: string,
  bankQuestions?: Array<{ question: string; category: string; level: string; answer?: string }>
): string {
  let prompt = interviewerSystemPrompt;

  prompt += `\n\n# 候选人信息\n\n`;
  prompt += `- 目标岗位：${targetRole}\n`;
  if (resume?.skills?.length) {
    prompt += `- 技能：${resume.skills.slice(0, 10).join(", ")}\n`;
  }

  if (bankQuestions && bankQuestions.length > 0) {
    prompt += `\n\n# 题库参考（后续问题可从中选取）\n\n`;
    bankQuestions.slice(0, 5).forEach((q, i) => {
      prompt += `${i + 1}. [${q.category}] ${q.question}\n`;
    });
  }

  prompt += `\n\n# 面试对话历史\n\n`;
  prompt += conversationHistory;

  prompt += `\n\n请根据以上对话历史，对用户的最新回答进行评分和反馈，然后提出下一个问题。\n`;
  prompt += `下一个问题应该：\n`;
  prompt += `1. 不要重复已问过的问题\n`;
  prompt += `2. 根据用户表现调整难度\n`;
  prompt += `3. 覆盖不同的技能点\n`;
  
  return prompt;
}

// ─── 行业知识映射（用于无题库时指导 AI 出题）─────────────────────────────

export const INDUSTRY_KNOWLEDGE_MAP: Record<string, string[]> = {
  "前端": ["HTML/CSS/JS 基础", "框架原理", "性能优化", "工程化", "浏览器原理"],
  "后端": ["数据结构算法", "系统设计", "数据库", "并发", "网络协议"],
  "全栈": ["前后端基础", "API 设计", "数据库", "部署运维"],
  "产品经理": ["需求分析", "用户研究", "数据分析", "项目管理", "商业思维"],
  "数据分析": ["统计学", "SQL", "Python/R", "数据可视化", "业务理解"],
  "UI/UX": ["设计原则", "用户研究", "原型设计", "交互设计", "视觉设计"],
  "测试": ["测试理论", "自动化测试", "性能测试", "测试用例设计", "缺陷管理"],
  "运维": ["Linux", "网络", "容器化", "CI/CD", "监控告警"],
  "算法": ["机器学习", "深度学习", "数学基础", "编程能力", "论文理解"],
};

// 获取行业核心考察点
export function getIndustryTopics(industry: string): string[] {
  // 先精确匹配
  if (INDUSTRY_KNOWLEDGE_MAP[industry]) {
    return INDUSTRY_KNOWLEDGE_MAP[industry];
  }
  // 再模糊匹配
  for (const [key, topics] of Object.entries(INDUSTRY_KNOWLEDGE_MAP)) {
    if (industry.includes(key) || key.includes(industry)) {
      return topics;
    }
  }
  // 默认返回通用考察点
  return ["专业知识", "实践经验", "问题解决", "沟通表达", "学习能力"];
}
