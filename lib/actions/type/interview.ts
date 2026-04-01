export interface interview {
    id: string;
    interviewId?: string;
    userId: string;
    title?: string;
    description?: string;
    date?: string;
    role: string;
    type: string;
    techstack: string[];
    rating?: number;
    createdAt: string | Date;
    questions?: { question: string; answer: string }[];
    feedback?: { strengths: string[]; improvements: string[] };
    status?: string;
    level?: string;
    finalized?: boolean;
}