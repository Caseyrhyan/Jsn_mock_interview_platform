'use server';

import { db } from "@/firebase/admin";
import { interview } from "./type/interview";
import { generateObject } from "ai";
import { feedbackSchema } from "@/public/constants";
import { google } from "@ai-sdk/google";



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
    const { interviewId, userId, transcript } = params;

    try {
        const formattedTranscript = transcript
            .map((sentence: { role: string; content: string }) => (
                `- ${sentence.role}: ${sentence.content}\n`
            )).join('');

        const { object: { totalScore, categoryScores, strengths, areasForImprovement, finalAssessment } } = await generateObject({
            model: google('gemini-2.0-flash-001'),
            schema: feedbackSchema,
            prompt: `You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem Solving**: Ability to analyze problems and propose solutions.
        - **Cultural Fit**: Alignment with company values and job role.
        - **Confidence and Clarity**: Confidence in responses, engagement, and clarity.
        `,
            system: "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
        });
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
    categoryScores: any;
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