'use server';

import { db } from "@/firebase/admin";
import { interview } from "./type/interview";
import { generateText } from "ai";
import { feedbackSchema } from "@/public/constants";
import { aiModel } from "@/lib/ai-provider";
import { getCurrentUser } from "./auth.action";



type GetLatestInterviewsParams = {
    userId: string;
    limit?: number;
};

type CreateFeedbackParams = {
    interviewId: string;
    userId: string;
    transcript: { role: string; content: string }[];
};

export async function getInterviewsByUserId(userId: string): Promise<interview[] | null> {

    if (!userId) return null;

    const interviews = await db
        .collection('interviews')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

    return interviews.docs.map((doc) => ({
        id: doc.id,
        interviewId: doc.id,
        ...doc.data()
    })) as interview[];
}

export async function getLatestInterviews(params: GetLatestInterviewsParams): Promise<interview[] | null> {
    const { userId, limit = 20 } = params;

    if (!userId) return null;
    const interviews = await db
        .collection('interviews')
        .orderBy('createdAt', 'desc')
        .where('finalized', '==', true)
        .where('userId', '!=', userId)
        .limit(limit)
        .get();

    return interviews.docs.map((doc) => ({
        id: doc.id,
        interviewId: doc.id,
        ...doc.data()
    })) as interview[];
}


export async function getInterviewById(id: string): Promise<interview | null> {

    if (!id) return null;

    const interviews = await db
        .collection('interviews')
        .doc(id)
        .get();

    return interviews.data() as interview | null;
}

export async function createFeedback(params: CreateFeedbackParams) {
    const { interviewId, transcript } = params;

    try {
        const user = await getCurrentUser();
        if (!user) {
            console.error('Unauthorized access to createFeedback');
            return { success: false, error: 'Unauthorized' };
        }
        const userId = user.id;
        const formattedTranscript = transcript
            .map((sentence: { role: string; content: string }) => (
                `- ${sentence.role}: ${sentence.content}\n`
            )).join('');

        const { text } = await generateText({
            model: aiModel,
            prompt: `You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        
        CRITICALLY IMPORTANT: You must be EXTREMELY strict with scoring. If the candidate provides minimal, vague, or non-substantive responses (e.g., just greeting but saying nothing of value), they must receive very low scores (e.g., 0-30) across all relevant categories including Communication and Confidence. Do not give high scores simply for participating. Base all scores STRICTLY on the evidence in the transcript.
        
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem Solving**: Ability to analyze problems and propose solutions.
        - **Cultural Fit**: Alignment with company values and job role.
        - **Confidence and Clarity**: Confidence in responses, engagement, and clarity.
        
        Return ONLY valid JSON matching this exact structure without any markdown formatting or extra text:
        {
          "totalScore": 85,
          "categoryScores": [ { "name": "Communication Skills", "score": 90, "comment": "..." } ],
          "strengths": "...",
          "areasForImprovement": "...",
          "finalAssessment": "..."
        }
        `,
            system: "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
        });
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const { totalScore, categoryScores, strengths, areasForImprovement, finalAssessment } = JSON.parse(cleanJson);
        const feedback = await db.collection('feedback').add({
            interviewId,
            userId,
            totalScore,
            categoryScores,
            strengths,
            areasForImprovement,
            finalAssessment,
            createdAt: new Date().toISOString(),

        })
        return {
            success: true,
            feedbackId: feedback.id
        }
    } catch (e) {
        console.error('Error saving feedback:', e);

        return { success: false };
    }
}
type Feedback = {
    id: string;
    interviewId: string;
    userId: string;
    totalScore: number;
    categoryScores: Array<{ name: string; score: number; comment: string }>;
    strengths: string;
    areasForImprovement: string;
    finalAssessment: string;
    createdAt: string;
};

type GetFeedbackByInterviewIdParams = {
    interviewId: string;
    userId: string;
};

export async function getFeedbackByInterviewId(params: GetFeedbackByInterviewIdParams): Promise<Feedback[] | null> {
    const { interviewId, userId } = params;


    const feedback = await db
        .collection('feedback')
        .where('interviewId', '==', interviewId)
        .where('userId', '==', userId)
        .limit(1)
        .get();

        if(feedback.empty) return null;

        const feedbackDoc = feedback.docs[0];
        const data = feedbackDoc.data();

        return [{
            id: feedbackDoc.id,
            ...data,
            createdAt: data.createdAt ?? new Date().toISOString(),
        }] as Feedback[];

}