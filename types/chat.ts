export type Mode = "resume_optimize" | "interview" | "jd_analysis" | "interview_prep" | "career_translate"

export type ConversationType = "chat" | "interview"

export interface Conversation {
    id: string
    title: string
    user_id: string
    type: ConversationType
    interview_data?: any
    created_at: string
    updated_at: string
}

export interface InterviewData {
    questions: InterviewQuestion[]
    currentPosition: number
    isCompleted: boolean
    score?: number
}

export interface InterviewQuestion {
    id: string
    question: string
    answer?: string
    score?: number
    feedback?: string
}

