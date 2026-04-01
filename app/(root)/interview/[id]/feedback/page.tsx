import { getCurrentUser } from '@/lib/actions/auth.action';
import { getFeedbackByInterviewId, getInterviewById } from '@/lib/actions/general.action';
import { redirect } from 'next/navigation';
import React from 'react'
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import dayjs from 'dayjs';

type RouteParams = {
    params: Promise<{ id: string }>
}

const page = async ({ params }: RouteParams) => {
    const { id } = await params;
    const user = await getCurrentUser();

    const interview = await getInterviewById(id);
    if (!interview) redirect('/');

    const feedbackResult = await getFeedbackByInterviewId({
        interviewId: id,
        userId: user?.id as string,
    })

    // The action returns an array, take the first item
    // The action returns an array, take the first item
    const feedback = feedbackResult?.[0];

    return (
        <section className="section-feedback">
            <div className="flex flex-row justify-center">
                <h1 className="text-4xl font-semibold">
                    Feedback on the Interview -{" "}
                    <span className="capitalize">{interview.role}</span> interview
                </h1>
            </div>

            <div className="flex flex-row justify-center">
                <div className="flex flex-row gap-5">
                    <div className="flex flex-row gap-2 items-center">
                        <Image src="/star.svg" width={22} height={22} alt="star" />
                        <p>
                            Overall Impression:{" "}
                            <span className="text-primary-200 font-bold">
                                {feedback?.totalScore}
                            </span>
                            /100
                        </p>

                    </div>

                    <div className="flex flex-row gap-2">
                        <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
                        <p>
                            {feedback?.createdAt
                                ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                                : "N/A"}
                        </p>
                    </div>
                </div>
            </div>

            <hr />

            <p>{feedback?.finalAssessment}</p>

            <div className="flex flex-col gap-4 mt-8">
                <h2 className="text-2xl font-bold">Breakdown of the Interview:</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {feedback?.categoryScores?.map((category: { name: string; score: number; comment: string }, index: number) => (
                        <Card key={index} className="bg-dark-200 border-dark-300">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex justify-between items-center">
                                    <span>{category.name}</span>
                                    <span className="text-primary-200">{category.score}/100</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-300">{category.comment}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-6 mt-6">
                <div className="flex flex-col gap-3">
                    <h3 className="text-xl font-semibold text-green-400">Strengths</h3>
                    <ul className="list-disc pl-5">
                        {feedback?.strengths && Array.isArray(feedback.strengths) && feedback.strengths.map((strength: string, index: number) => (
                            <li key={index} className="text-gray-300">{strength}</li>
                        ))}
                    </ul>
                </div>

                <div className="flex flex-col gap-3">
                    <h3 className="text-xl font-semibold text-red-400">Areas for Improvement</h3>
                    <ul className="list-disc pl-5">
                        {feedback?.areasForImprovement && Array.isArray(feedback.areasForImprovement) && feedback.areasForImprovement.map((area: string, index: number) => (
                            <li key={index} className="text-gray-300">{area}</li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="buttons mt-8">
                <Button asChild className="btn-secondary flex-1">
                    <Link href="/" className="flex w-full justify-center">
                        <span className="text-sm font-semibold text-primary-200 text-center">
                            Back to dashboard
                        </span>
                    </Link>
                </Button>
            </div>


        </section>
    )
}

export default page
