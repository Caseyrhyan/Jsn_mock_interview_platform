import Agent from '@/components/Agent'
import { getCurrentUser } from '@/lib/actions/auth.action'
import { getInterviewById } from '@/lib/actions/general.action'
import { redirect } from 'next/navigation'
import React from 'react'

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
    const user = await getCurrentUser()
    if (!user) {
        redirect('/sign-in')
    }

    const resolvedParams = await params;
    const interview = await getInterviewById(resolvedParams.id);

    if (!interview) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <h2 className="text-2xl font-bold">Interview not found</h2>
                <p className="text-light-100 mt-2">The interview session could not be located.</p>
            </div>
        )
    }

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col gap-2 mb-4">
                <h3 className="text-2xl font-bold">Mock Interview: {interview.role} ({interview.level})</h3>
                <p className="text-light-100">{interview.description}</p>
            </div>

            <Agent 
                userName={user.username || 'unknown'} 
                userId={user.id} 
                type="interview" 
                interviewId={resolvedParams.id} 
                questions={interview.questions ? (interview.questions as any[]).map(q => typeof q === 'string' ? q : q.question) : []} 
            />
        </div>
    )
}

export default Page
