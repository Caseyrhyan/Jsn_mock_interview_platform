import { getCurrentUser } from '@/lib/actions/auth.action';
import { getFeedbackByInterviewId, getInterviewById } from '@/lib/actions/general.action';
import { redirect } from 'next/navigation';
import React from 'react'
import Image from 'next/image';
import { Button } from '@/components/ui/button';
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
        userId: user?.id!,
    })

    // The action returns an array, take the first item
    const feedback = feedbackResult?.[0];

    console.log(feedback);

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

            <div className="flex flex-col gap-4">
                <h2>Breakdown of the Interview:</h2>
                {feedback?.categoryScores?.map((category: any, index: number) => (

                    <div key={index}>
                        <p className="font-bold">
                            {index + 1}. {category.name}
                            ({category.score}/100)
                        </p>
                        <p>{category.comment}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-3">
                <h3>Strengths</h3>
                <ul>
                    {feedback?.strengths && Array.isArray(feedback.strengths) && feedback.strengths.map((strength: string, index: number) => (
                        <li key={index}>{strength}</li>
                    ))}
                    {/* Fallback if strengths is a string (based on type definition seeing string but usage implying array, handling both usually safer or just trusting usage if we confirmed db structure. The type said string but map implies array. Sticking to map but added Array.isArray check just in case or assuming type file was loose) */}
                    {/* Actually, looking at general.action.ts type definition: strengths: string; areasForImprovement: string; 
                   But the map usage in original code checks for array. 
                   Db save uses 'strengths' directly from generateObject which usually returns array for 'strengths'. 
                   The type definition in general.action.ts line 123 says 'string', which might be wrong. 
                   I will assume it is an array as per original code usage, but I will strip the type check strictness in the loop or cast it if needed. 
                   However, since I don't have the type definition file for 'categoryScores' (it was any) I'll leave it.
                   For strengths, the original code had map. I'll keep map.
                */}
                </ul>

            </div>

            <div className="buttons">
                <Button className="btn-secondary flex-1">
                    <Link href="/" className="flex w-full justify-center">

                        <p className="text-sm font-semibold text-primary-200 text-center">
                            Back to dashboard
                        </p>
                    </Link>
                </Button>

            </div>


        </section>
    )
}

export default page
