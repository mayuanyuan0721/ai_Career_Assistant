// 行业到岗位名称的公共映射
export const INDUSTRY_JOB_TITLE: Record<string, string> = {
    frontend: "前端开发工程师",
    backend: "后端开发工程师",
    design: "UI/UX设计师",
    product: "产品经理",
    data: "数据分析师",
    mobile: "移动开发工程师",
    testing: "测试工程师",
    devops: "运维工程师",
};

// 行业到面试题库分类的映射
export const INDUSTRY_INTERVIEW_CATEGORY: Record<string, string> = {
    frontend: "react",
    backend: "java",
    design: "design",
    product: "product",
    data: "data",
    mobile: "mobile",
    testing: "testing",
    devops: "devops",
};

// 技能到面试题库分类的映射
export const SKILL_INTERVIEW_CATEGORY: Record<string, string> = {
    react: "react",
    vue: "vue",
    angular: "angular",
    typescript: "typescript",
    javascript: "javascript",
    css: "css",
    node: "engineering",
};

export function getJobTitle(industry: string): string {
    return INDUSTRY_JOB_TITLE[industry] || "前端开发工程师";
}

export function getInterviewCategory(industry: string): string {
    return INDUSTRY_INTERVIEW_CATEGORY[industry] || "react";
}
