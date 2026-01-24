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
    questions?: any[];
    feedback?: any;
    status?: string;
    level?: string;
    finalized?: boolean;
}