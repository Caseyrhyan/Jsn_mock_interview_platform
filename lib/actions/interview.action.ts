'use server';

import { db } from "@/firebase/admin";
import { interview } from "./type/interview";
import { revalidatePath } from "next/cache";

type CreateInterviewParams = {
    userId: string;
    interviewData: string; // This could be the transcript or a summary
    questions: { question: string, answer: string }[];
    feedback: {
        strengths: string[];
        improvements: string[];
    };
    rating: number; // 1-10
    role: string;
    type: string;
    techStack: string[];
}

export async function createInterview(params: CreateInterviewParams) {
    const { userId, interviewData, questions, feedback, rating, role, type, techStack } = params;

    try {
        const interviewRef = db.collection('interviews').doc();

        const newInterview = {
            userId,
            title: `Interview on ${new Date().toLocaleDateString()}`,
            description: interviewData.substring(0, 100) + "...", // Brief preview
            date: new Date().toISOString(),
            questions,
            feedback,
            rating,
            role,
            type,
            techstack: techStack, // Note casing mapping
            createdAt: new Date().toISOString(),
            status: 'completed'
        };

        await interviewRef.set(newInterview);

        revalidatePath('/'); // Update the dashboard
        return { success: true, id: interviewRef.id };
    } catch (error) {
        console.error("Error creating interview:", error);
        return { success: false, message: "Failed to save interview" };
    }
}
