'use client'

import { cn } from '@/lib/utils';
import Image from 'next/image'
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { vapi } from '@/lib/vapi.sdk';
import { toast } from 'sonner';
import { createInterview } from '@/lib/actions/interview.action';
import { Trykker } from 'next/font/google';

import { saveInterviewResult } from '@/lib/actions/interview.action';
import { interviewer } from '@/public/constants';
import { createFeedback } from '@/lib/actions/general.action';

enum CallStatus {
    INACTIVE = 'INACTIVE',
    CONNECTING = 'CONNECTING',
    ACTIVE = 'ACTIVE',
    FINISHED = 'FINISHED'
}

type AgentProps = {
    userName: string;
    userId: string;
    type: string;
    interviewId?: string;
    questions?: string[];
};

interface SavedMessage {
    role: 'user' | 'system' | 'assistant';
    content: string;
}

// Minimal type definition for Vapi Message to avoid import complexitiy errors
type Message = {
    type: string;
    transcriptType?: string;
    role: 'user' | 'system' | 'assistant';
    transcript: string;
    [key: string]: any; // Allow other properties
};

const Agent = ({ userName, userId, type, interviewId, questions }: AgentProps) => {
    const router = useRouter();
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [callstatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [messages, setMessages] = useState<SavedMessage[]>([]);

    useEffect(() => {
        const onCallStart = () => setCallStatus(CallStatus.ACTIVE);
        const onCalledEnd = () => setCallStatus(CallStatus.FINISHED);

        const onMessage = (message: Message) => {
            if (message.type === 'transcript' && message.transcriptType === 'final') {
                const newMessage = { role: message.role, content: message.transcript }

                setMessages((prev) => [...prev, newMessage]);
            }
        }

        const onSpeechStart = () => setIsSpeaking(true);
        const onSpeechEnd = () => setIsSpeaking(false);



        // ...

        const onError = (error: Error) => {
            console.log('Error', error);
            toast.error("Error connecting to voice agent: " + (error.message || "Unknown error"));
        };

        vapi.on('call-start', onCallStart);
        vapi.on('call-end', onCalledEnd);
        vapi.on('speech-start', onSpeechStart);
        vapi.on('speech-end', onSpeechEnd);
        vapi.on('message', onMessage); // Attached
        vapi.on('error', onError);

        return () => {
            vapi.off('call-start', onCallStart);
            vapi.off('call-end', onCalledEnd);
            vapi.off('speech-start', onSpeechStart);
            vapi.off('speech-end', onSpeechEnd);
            vapi.off('message', onMessage); // Detached
            vapi.off('error', onError);
        }
    }, [])

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
        console.log('Generating feedback...');

        // TODO: Create a server action that generates feedback
        const { success, feedbackId: id } = await createFeedback({
            interviewId: interviewId!,
            userId: userId!,
            transcript: messages
        })


        if (success && id) {
            router.push(`/interview/${interviewId}/feedback`);
        } else {
            console.log('Error saving feedback');
            router.push('/');
        }
    }


    useEffect(() => {
        if (callstatus === CallStatus.FINISHED) {
            if (type === 'generate') {
                router.push('/')
            } else {
                handleGenerateFeedback(messages);
            }
        }
    }, [callstatus, type, userId, router]);


    const handleCall = async () => {
        setCallStatus(CallStatus.CONNECTING);

        if (type === 'generate') {
            try {
                await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
                    variableValues: {
                        username: userName,
                        userId: userId,
                    }
                })
            } catch (e) {
                console.error("Vapi start error (generate):", e);
                toast.error("Failed to start meeting: " + (e as Error).message);
            }
        } else {
            let formattedQuestions = '';

            if (questions) {
                formattedQuestions = questions
                    .map((question) => {
                        return '- ${question}';
                    })
                    .join('\n');
            }

            try {
                await vapi.start(interviewer, {
                    variableValues: {
                        questions: formattedQuestions,
                    }
                })
            } catch (e) {
                console.error("Vapi start error (interviewer):", e);
                toast.error("Failed to start meeting: " + (e as Error).message);
            }
        }
    }



    const handleDisconnect = async () => {
        setCallStatus(CallStatus.FINISHED);

        vapi.stop();
    }

    const latestMessage = messages[messages.length - 1]?.content;
    const isCallInactiveOrFinished = callstatus === CallStatus.INACTIVE || callstatus === 'FINISHED';

    return (
        <>
            <div className="call-view">
                <div className="card-interviewer">
                    <div className="avatar">
                        <Image src="/ai-avatar.png" alt="vapi"
                            width={65} height={54} className="object" />
                        {isSpeaking && <span className="animate-speak" />}
                    </div>
                    <h3>AI Interviewer</h3>
                </div>

                <div className="card-border">
                    <div className="card-content">
                        <Image src="/user-avatar.png" alt="user avatar"
                            width={540} height={540} className="rounded-full object-cover
            size-[120px]" />
                        <h3>{userName}</h3>

                    </div>
                </div>

            </div>
            {messages.length > 0 && (
                <div className="transcript-border">
                    <div className="transcript">
                        <p key={latestMessage} className={cn('transition-opacity duration-500 opacity-0', 'animate-fadeIn opacity-100')}>
                            {latestMessage}
                        </p>

                    </div>
                </div>
            )}

            <div className="w-full flex justify-center">
                {callstatus != 'ACTIVE' ? (
                    <button className="relative btn-call" onClick={handleCall}>
                        <span className={cn('absolute animate-ping rounded-full opacity-75', callstatus != 'CONNECTING' && 'hidden')} />

                        <span>
                            {isCallInactiveOrFinished ? 'call' : '. . .'}
                        </span>

                    </button>
                ) : (
                    <button className="btn-disconnect" onClick={handleDisconnect}>
                        End
                    </button>
                )}
            </div>
        </>
    )
}

export default Agent
