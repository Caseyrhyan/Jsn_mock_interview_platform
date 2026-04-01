import { getCurrentUser } from '@/lib/actions/auth.action';
import { getInterviewById } from '@/lib/actions/general.action';
import { redirect } from 'next/navigation';
import React from 'react'
import Agent from '@/components/Agent';

type RouteParams = {
    params: Promise<{ id: string }>
}

const Page = async ({ params }: RouteParams) => {
    const { id } = await params;
    const user = await getCurrentUser();

    const interview = await getInterviewById(id);
    if (!interview) redirect('/');

    return (
        <section className="flex flex-col items-center justify-center min-h-[80vh] gap-10">
            <div className="flex flex-col items-center gap-2">
                <h1 className="text-3xl font-bold capitalize">{interview.role} Interview</h1>
                <p className="text-gray-500 text-lg">Conduct your mock interview with our AI agent.</p>
            </div>

            <Agent
                userName={user?.username || ''}
                userId={user?.id || ''}
                type="interviewer"
                interviewId={id}
                questions={interview.questions}
            />
        </section>
    )
}

export default Page
