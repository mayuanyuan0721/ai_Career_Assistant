/**
 * 智能技能匹配算法
 * 支持行业特定权重、模糊匹配、同义词匹配
 */

// 技能同义词库
const SYNONYMS: Record<string, string[]> = {
    "react": ["react.js", "reactjs", "react 16", "react 17", "react 18"],
    "vue": ["vue.js", "vuejs", "vue 2", "vue 3", "vue3"],
    "angular": ["angular.js", "angularjs", "angular 2+", "angular2"],
    "node.js": ["nodejs", "node", "node.js", "nodejs.js"],
    "typescript": ["ts", "typescript", "ts5"],
    "javascript": ["js", "javascript", "es6", "es7", "ecmascript"],
    "python": ["py", "python3", "python 3"],
    "java": ["java 8", "java 11", "java 17", "jdk"],
    "git": ["git flow", "github", "gitlab", "bitbucket"],
    "docker": ["docker-compose", "container", "kubernetes", "k8s"],
    "sql": ["mysql", "postgresql", "mongodb", "redis", "database"],
    "css": ["css3", "sass", "scss", "less", "tailwind", "styled-components"],
    "html": ["html5", "semantic html", "xhtml"],
    "rest": ["restful", "rest api", "http api"],
    "graphql": ["apollo", "graphql api"],
    "ci/cd": ["jenkins", "github actions", "gitlab ci", "circleci"],
    "aws": ["amazon web services", "ec2", "s3", "lambda", "cloudformation"],
    "figma": ["figma design", "figma prototype"],
    "sketch": ["sketch design"],
    "photoshop": ["ps", "adobe photoshop"],
}

// 行业特定技能权重配置
const INDUSTRY_SKILL_WEIGHTS: Record<string, Record<string, number>> = {
    frontend: {
        // 核心技能（权重最高）
        "react": 5, "vue": 5, "angular": 5,
        "javascript": 5, "typescript": 5,
        "html": 4, "css": 4,
        // 重要技能
        "webpack": 3, "vite": 3, "next.js": 3, "nuxt": 3,
        "git": 3, "npm": 3, "yarn": 3,
        // 加分技能
        "node.js": 2, "graphql": 2, "docker": 2,
        "jest": 2, "cypress": 2, "testing": 2,
        // 其他
        "redux": 2, "mobx": 2, "vuex": 2,
        "sass": 2, "less": 2, "tailwind": 2,
    },
    backend: {
        // 核心技能
        "java": 5, "python": 5, "go": 5, "node.js": 5,
        "spring": 5, "spring boot": 5, "django": 5, "flask": 5,
        // 数据库
        "mysql": 5, "postgresql": 5, "mongodb": 4, "redis": 4,
        // 重要技能
        "rest": 4, "api": 4, "microservices": 4,
        "docker": 4, "kubernetes": 4, "aws": 3,
        // 加分技能
        "git": 3, "ci/cd": 3, "linux": 3,
        "rabbitmq": 2, "kafka": 2, "elasticsearch": 2,
    },
    design: {
        // 核心设计工具
        "figma": 5, "sketch": 5, "photoshop": 5, "illustrator": 5,
        "adobe xd": 5, "invision": 4,
        // 设计技能
        "ui design": 5, "ux design": 5, "interaction design": 4,
        "prototyping": 4, "wireframing": 4,
        // 加分技能
        "html": 3, "css": 3, "javascript": 2,
        "user research": 3, "usability testing": 3,
        "design system": 4, "responsive design": 3,
    },
    product: {
        // 核心技能
        "product management": 5, "product strategy": 5,
        "user stories": 4, "prd": 4, "roadmap": 4,
        // 分析技能
        "data analysis": 4, "sql": 4, "excel": 3,
        "user research": 4, "market research": 4,
        // 工具
        "jira": 4, "confluence": 3, "trello": 3,
        "figma": 3, "sketch": 2,
        // 加分技能
        "agile": 4, "scrum": 4, "kanban": 3,
        "a/b testing": 3, "analytics": 3,
    },
}

// 技能标准化函数
function normalizeSkill(skill: string): string {
    return skill.toLowerCase().trim().replace(/\s+/g, " ");
}

// 检查是否是同义词
function isSynonym(skill1: string, skill2: string): boolean {
    const s1 = normalizeSkill(skill1);
    const s2 = normalizeSkill(skill2);
    
    // 直接匹配
    if (s1 === s2) return true;
    
    // 检查同义词库
    for (const [canonical, synonyms] of Object.entries(SYNONYMS)) {
        const allVariants = [canonical, ...synonyms].map(normalizeSkill);
        if (allVariants.includes(s1) && allVariants.includes(s2)) {
            return true;
        }
    }
    
    return false;
}

// 获取技能权重
function getSkillWeight(skill: string, industry: string): number {
    const normalizedSkill = normalizeSkill(skill);
    const weights = INDUSTRY_SKILL_WEIGHTS[industry] || {};
    
    // 直接匹配
    if (weights[normalizedSkill]) {
        return weights[normalizedSkill];
    }
    
    // 模糊匹配（部分匹配）
    for (const [key, weight] of Object.entries(weights)) {
        if (normalizedSkill.includes(key) || key.includes(normalizedSkill)) {
            return weight * 0.8; // 部分匹配给 80% 权重
        }
    }
    
    // 默认权重
    return 1;
}

// 检查用户是否拥有某技能
function userHasSkill(userSkills: string[], targetSkill: string): boolean {
    const normalizedTarget = normalizeSkill(targetSkill);
    
    for (const userSkill of userSkills) {
        const normalizedUser = normalizeSkill(userSkill);
        
        // 直接匹配
        if (normalizedUser === normalizedTarget) return true;
        
        // 同义词匹配
        if (isSynonym(normalizedUser, normalizedTarget)) return true;
        
        // 包含匹配（处理 "熟悉React" 这种情况）
        if (normalizedUser.includes(normalizedTarget) || normalizedTarget.includes(normalizedUser)) {
            return true;
        }
    }
    
    return false;
}

// 主匹配函数：计算匹配分数
export function calculateMatchScore(
    userSkills: string[],
    jobSkills: string[],
    industry: string = "frontend"
): {
    score: number;
    matched: string[];
    missing: string[];
    weightedScore: number;
    coreMatched: number;
    totalCore: number;
} {
    if (userSkills.length === 0 || jobSkills.length === 0) {
        return {
            score: 0,
            matched: [],
            missing: jobSkills,
            weightedScore: 0,
            coreMatched: 0,
            totalCore: 0,
        };
    }
    
    let matched: string[] = [];
    let missing: string[] = [];
    let totalWeight = 0;
    let matchedWeight = 0;
    let coreMatched = 0;
    let totalCore = 0;
    
    for (const jobSkill of jobSkills) {
        const weight = getSkillWeight(jobSkill, industry);
        totalWeight += weight;
        
        // 核心技能（权重 >= 4）
        if (weight >= 4) {
            totalCore++;
        }
        
        if (userHasSkill(userSkills, jobSkill)) {
            matched.push(jobSkill);
            matchedWeight += weight;
            
            if (weight >= 4) {
                coreMatched++;
            }
        } else {
            missing.push(jobSkill);
        }
    }
    
    // 计算加权分数
    const weightedScore = totalWeight > 0 
        ? Math.round((matchedWeight / totalWeight) * 100) 
        : 0;
    
    // 简单分数（兼容旧逻辑）
    const score = jobSkills.length > 0
        ? Math.round((matched.length / jobSkills.length) * 100)
        : 0;
    
    return {
        score,
        matched,
        missing,
        weightedScore,
        coreMatched,
        totalCore,
    };
}

// 获取匹配等级
export function getMatchLevel(score: number): "high" | "medium" | "low" {
    if (score >= 80) return "high";
    if (score >= 60) return "medium";
    return "low";
}

// 获取匹配建议
export function getMatchSuggestions(
    userSkills: string[],
    jobSkills: string[],
    industry: string
): string[] {
    const { missing } = calculateMatchScore(userSkills, jobSkills, industry);
    const suggestions: string[] = [];
    
    // 按权重排序缺失技能
    const missingWithWeight = missing.map(skill => ({
        skill,
        weight: getSkillWeight(skill, industry),
    })).sort((a, b) => b.weight - a.weight);
    
    // 高优先级建议（核心技能）
    const highPriority = missingWithWeight.filter(s => s.weight >= 4);
    if (highPriority.length > 0) {
        suggestions.push(`🔥 强烈建议学习：${highPriority.map(s => s.skill).join("、")}`);
    }
    
    // 中优先级建议
    const mediumPriority = missingWithWeight.filter(s => s.weight >= 2 && s.weight < 4);
    if (mediumPriority.length > 0) {
        suggestions.push(`💡 建议提升：${mediumPriority.map(s => s.skill).join("、")}`);
    }
    
    return suggestions;
}
