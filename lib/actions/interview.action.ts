'use server';

import { db } from "@/firebase/admin";
import { interview } from "./type/interview";
import { revalidatePath } from "next/cache";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

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

const FeedbackSchema = z.object({
    rating: z.number().min(1).max(10),
    feedback: z.object({
        strengths: z.array(z.string()),
        improvements: z.array(z.string())
    }),
    questions: z.array(z.object({
        question: z.string(),
        answer: z.string()
    }))
});

export async function saveInterviewResult(
    interviewId: string,
    messages: { role: 'user' | 'system' | 'assistant', content: string }[]
) {
    try {
        if (!interviewId) throw new Error("Interview ID is required");

        // 1. Get the existing interview to know context (role, techstack, etc.)
        const interviewDoc = await db.collection('interviews').doc(interviewId).get();
        if (!interviewDoc.exists) {
            throw new Error("Interview not found");
        }
        const interviewData = interviewDoc.data();

        // 2. Generate feedback using AI
        const prompt = `
            You are an expert interviewer. Analyze the following interview transcript for a candidate applying for a ${interviewData?.role} role.
            Tech Stack: ${interviewData?.techstack?.join(', ')}.
            Experience Level: ${interviewData?.level}.
            
            Transcript:
            ${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

            Extract the Q&A pairs.
            Provide constructive feedback (strengths and improvements).
            Rate the candidate on a scale of 1-10 based on technical accuracy and communication.
        `;

        const { object } = await generateObject({
            model: google('gemini-2.0-flash-001'),
            schema: FeedbackSchema,
            prompt: prompt,
        });

        // 3. Update the interview document
        const updateData = {
            questions: object.questions,
            feedback: object.feedback,
            rating: object.rating,
            status: 'completed',
            updatedAt: new Date().toISOString()
        };

        await db.collection('interviews').doc(interviewId).update(updateData);

        revalidatePath(`/interview/${interviewId}`);
        revalidatePath('/');

        return { success: true };
    } catch (error) {
        console.error("Error saving interview result:", error);
        return { success: false, message: error instanceof Error ? error.message : "Failed to save result" };
    }
}
