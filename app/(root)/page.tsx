import InterviewCard from '@/components/interviewCard'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/actions/auth.action'
import { getInterviewsByUserId, getLatestInterviews } from "@/lib/actions/general.action";
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const Page = async () => {
  const user = await getCurrentUser();
  if (!user) return null; // Or handle empty state appropriately

  const interviews = await getInterviewsByUserId(user.id);
  const latestInterviews = await getLatestInterviews({ userId: user.id });
  const hasPastinterviews = interviews && interviews.length > 0;

  return (
    <>
      <section className="card-cta">
        <div className="flex flex-col gap-6 max-w-lg" >
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">Get Interview-Ready with AI-Powered Practice & Feedback</h1>
          <p className="text-lg md:text-xl text-light-100 max-w-md">
            practice on real interview questions & get instant feedback
          </p>

          <Button asChild className="btn-primary max-sm:w-full">
            <Link href="/interview">Start an Interview</Link>
          </Button>
        </div>

        <Image src="/robot.png" alt="robo-dude" width={400} height={400} className="max-sm:hidden" />
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Your Interviews</h2>

        <div className="interviews-section">
          {hasPastinterviews ? (
            interviews?.map((interview) => (
              <InterviewCard {...interview} key={interview.id} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center w-full py-16 px-4 bg-dark-200/30 rounded-2xl border border-dashed border-border/50">
              <Image src="/robot.png" alt="Empty" width={100} height={100} className="mb-4 opacity-50 grayscale" />
              <h3 className="text-xl font-semibold mb-2 text-white">No interviews yet</h3>
              <p className="text-light-100 mb-6 text-center">Start practicing to track your top skills and get AI feedback.</p>
              <Button asChild className="btn-primary">
                <Link href="/interview">Start Your First Interview</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Take an Interview</h2>

        <div className="interviews-section">
          {latestInterviews && latestInterviews.length > 0 ? (
            latestInterviews.slice(0, 4).map((interview) => (
              <InterviewCard {...interview} key={interview.id} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center w-full py-16 px-4 bg-dark-200/30 rounded-2xl border border-dashed border-border/50">
              <h3 className="text-xl font-semibold mb-2 text-white">No public interviews</h3>
              <p className="text-light-100 text-center">There are no global interviews available at the moment.</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

export default Page