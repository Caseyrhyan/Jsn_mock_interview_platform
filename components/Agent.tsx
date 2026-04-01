'use client'

import { cn } from '@/lib/utils';
import Image from 'next/image'
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';

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

const Agent = ({ userName, userId, type, interviewId, questions }: AgentProps) => {
    const router = useRouter();
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [callstatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [userTranscript, setUserTranscript] = useState("");
    
    // Store refs to keep track in event listeners
    const callStatusRef = useRef<CallStatus>(CallStatus.INACTIVE);
    const isSpeakingRef = useRef<boolean>(false);
    const isLoadingRef = useRef<boolean>(false);

    const recognitionRef = useRef<any>(null);
    const synthesisRef = useRef<SpeechSynthesis | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        callStatusRef.current = callstatus;
    }, [callstatus]);

    const systemPromptMessage = (interviewer.model?.messages?.[0]?.content as string) || "";
    // Provide the system prompt to the backend
    const systemPrompt = type === 'generate'
        ? systemPromptMessage.replace('{{questions}}', '- Invent ONE basic, entry-level technical question relevant to the candidate’s profile.')
        : systemPromptMessage.replace('{{questions}}', questions && questions.length > 0 ? `- ${questions[0]}` : '- Invent ONE basic, entry-level technical question relevant to the candidate’s profile.');

    const [messages, setMessages] = useState<SavedMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const append = async (msg: any) => {
        const userMsg: SavedMessage = { role: 'user', content: msg.text };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const currentMessages = [...messages, userMsg];
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemPrompt: systemPrompt,
                    messages: currentMessages,
                })
            });

            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            const assistantMsg: SavedMessage = { role: 'assistant', content: data.message };
            
            setMessages(prev => [...prev, assistantMsg]);
            setUserTranscript("");
            speakMessage(assistantMsg.content);

        } catch (err: any) {
            console.error('Chat error:', err);
            toast.error("Error connecting to voice agent: " + err.message);
            stopCall();
            setCallStatus(CallStatus.INACTIVE);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        isLoadingRef.current = isLoading;
    }, [isLoading]);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = 'en-US';

                recognition.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    if (transcript.trim()) {
                        setUserTranscript(transcript);
                        append({ text: transcript } as any);
                    } else {
                        // User said nothing clear, restart listening
                        startListening();
                    }
                };

                recognition.onerror = (event: any) => {
                    if (event.error !== 'aborted') {
                        console.error('Speech recognition error', event.error);
                        // If it fails, retry after a moment
                        setTimeout(() => startListening(), 1000);
                    } else {
                        console.log('Speech recognition aborted (expected)');
                    }
                };

                recognition.onend = () => {
                   // Ensure we try to keep listening if active and not speaking/loading
                   if (callStatusRef.current === CallStatus.ACTIVE && !isSpeakingRef.current && !isLoadingRef.current) {
                       startListening();
                   }
                };

                recognitionRef.current = recognition;
            } else {
                toast.error("Speech Recognition is not supported in your browser. Please use Chrome.");
            }
            synthesisRef.current = window.speechSynthesis;
        }

        return () => {
            stopCall();
            if (synthesisRef.current) {
                synthesisRef.current.cancel();
            }
        };
    }, []);

    const setIsSpeakingState = (speaking: boolean) => {
        setIsSpeaking(speaking);
        isSpeakingRef.current = speaking;
    }

    const speakMessage = (text: string) => {
        if (!synthesisRef.current) return;
        
        setIsSpeakingState(true);
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Try to pick a decent voice (e.g. Google US English if on Chrome)
        const voices = synthesisRef.current.getVoices();
        const preferredVoice = voices.find((v: any) => v.name.includes('Google') || v.name.includes('Samantha') || v.lang === 'en-US');
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.rate = 1.0;
        
        utterance.onend = () => {
            setIsSpeakingState(false);
            if (callStatusRef.current === CallStatus.ACTIVE) {
                startListening();
            }
        };

        utterance.onerror = () => {
            setIsSpeakingState(false);
            if (callStatusRef.current === CallStatus.ACTIVE) {
                startListening();
            }
        };

        utteranceRef.current = utterance;
        synthesisRef.current.speak(utterance);
    };

    const startListening = () => {
        if (callStatusRef.current !== CallStatus.ACTIVE || !recognitionRef.current || isSpeakingRef.current) return;
        try {
            recognitionRef.current.start();
        } catch (e: any) {
            // Already started exception usually
            if (e.name !== 'InvalidStateError') {
                console.error("Failed to start speech recognition", e);
            }
        }
    };

    const handleCall = async () => {
        setCallStatus(CallStatus.CONNECTING);
        try {
            // First message to kick off the flow
            await append({
                text: "Hello! I am " + userName + " and I'm ready to start the interview."
            } as any);
            setCallStatus(CallStatus.ACTIVE);
            
            // Kickstart voices loading for TTS (Chrome quirk needs this to populate getVoices)
            if (synthesisRef.current) {
                synthesisRef.current.getVoices();
            }
            
        } catch (error: any) {
            console.error("Meeting start error:", error);
            toast.error(error.message || "Failed to start meeting");
            setCallStatus(CallStatus.INACTIVE);
        }
    };

    const stopCall = () => {
        if (recognitionRef.current) recognitionRef.current.abort();
        if (synthesisRef.current) synthesisRef.current.cancel();
        setIsSpeakingState(false);
    };

    const handleDisconnect = async () => {
        stopCall();
        setCallStatus(CallStatus.FINISHED);
    };

    const handleGenerateFeedback = async (messagesArray: SavedMessage[]) => {
        console.log('Generating feedback...');
        const { success, feedbackId: id } = await createFeedback({
            interviewId: interviewId!,
            userId: userId!,
            transcript: messagesArray
        });

        if (success && id) {
            router.push(`/interview/${interviewId}/feedback`);
        } else {
            console.log('Error saving feedback');
            router.push('/');
        }
    };

    useEffect(() => {
        if (callstatus === CallStatus.FINISHED) {
            if (type === 'generate') {
                router.push('/');
            } else {
                // Ensure messages match the custom format
                const formattedMessages: SavedMessage[] = messages;
                handleGenerateFeedback(formattedMessages);
            }
        }
    }, [callstatus, type, userId, router, messages]);

    const lastMsg = messages.filter((m: any) => m.role === 'assistant').pop();
    const latestAssistantMessage = lastMsg ? lastMsg.content : "";
    const isCallInactiveOrFinished = callstatus === CallStatus.INACTIVE || callstatus === CallStatus.FINISHED;

    return (
        <>
            <div className="call-view">
                <div className="card-interviewer">
                    <div className="avatar">
                        <Image src="/ai-avatar.png" alt="ai"
                            width={65} height={54} className="object-cover" />
                        {isSpeaking && <span className="animate-speak" />}
                    </div>
                    <h3>AI Interviewer</h3>
                </div>

                <div className="card-border">
                    <div className="card-content">
                        <Image src="/user-avatar.png" alt="user avatar"
                            width={540} height={540} className="rounded-full object-cover size-[120px]" />
                        <h3>{userName}</h3>
                        {/* Audio Wave visual hint for user talking (when listening but not speaking) */}
                        {callstatus === CallStatus.ACTIVE && !isSpeaking && !isLoading && !userTranscript && (
                            <p className="animate-pulse text-xs text-green-500 mt-2">Listening (Speak now)...</p>
                        )}
                        {callstatus === CallStatus.ACTIVE && userTranscript && !isLoading && (
                            <div className="mt-4 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                                <p className="text-sm text-gray-300 italic">"{userTranscript}"</p>
                            </div>
                        )}
                        {isLoading && (
                            <p className="animate-pulse text-xs text-blue-500 mt-2">Thinking...</p>
                        )}
                    </div>
                </div>

            </div>
            
            {(messages.length > 0 && latestAssistantMessage) && (
                <div className="transcript-border">
                    <div className="transcript">
                        <p key={latestAssistantMessage} className={cn('transition-opacity duration-500 opacity-0', 'animate-fadeIn opacity-100')}>
                            {latestAssistantMessage}
                        </p>
                    </div>
                </div>
            )}

            <div className="w-full flex justify-center mt-6">
                {callstatus !== CallStatus.ACTIVE ? (
                    <button className="relative btn-call" onClick={handleCall}>
                        <span className={cn('absolute animate-ping rounded-full opacity-75', callstatus !== CallStatus.CONNECTING && 'hidden')} />
                        <span>
                            {isCallInactiveOrFinished ? 'Call' : '. . .'}
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

export default Agent;
