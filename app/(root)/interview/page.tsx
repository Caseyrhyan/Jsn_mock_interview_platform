import InterviewSetupForm from '@/components/InterviewSetupForm'
import { getCurrentUser } from '@/lib/actions/auth.action'
import { redirect } from 'next/navigation'
import React from 'react'

const Page = async () => {
    const user = await getCurrentUser()

    if (!user) {
        redirect('/sign-in')
    }

  return (
    <>
       <InterviewSetupForm userId={user.id} />
    </>
  )
}

export default Page
