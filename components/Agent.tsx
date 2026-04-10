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

const Agent = ({ userName, userId, type, interviewId, questions = [] }: AgentProps) => {
    const router = useRouter();
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [callstatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [userTranscript, setUserTranscript] = useState("");
    const [messages, setMessages] = useState<SavedMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const callStatusRef = useRef<CallStatus>(CallStatus.INACTIVE);
    const isSpeakingRef = useRef<boolean>(false);
    const isLoadingRef = useRef<boolean>(false);
    const questionIndexRef = useRef<number>(0);       // ← tracks current question
    const askedQuestionsRef = useRef<string[]>([]);   // ← tracks ALL asked questions

    const recognitionRef = useRef<any>(null);
    const synthesisRef = useRef<SpeechSynthesis | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => { callStatusRef.current = callstatus; }, [callstatus]);
    useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);

    // ── BUILD SYSTEM PROMPT ────────────────────────────────────────────────
    // Format ALL questions as a numbered list so the AI knows the full set
    const buildSystemPrompt = () => {
        const basePrompt = (interviewer.model?.messages?.[0]?.content as string) || "";

        let questionBlock = "";

        if (questions && questions.length > 0) {
            // Give the AI ALL questions as a numbered list
            questionBlock = questions
                .map((q, i) => `Question ${i + 1}: ${q}`)
                .join('\n');

            questionBlock = `Ask these questions ONE AT A TIME in order. Do NOT repeat a question you have already asked. Track which question number you are on and always move to the next one after the candidate answers:\n${questionBlock}`;
        } else {
            questionBlock = "Generate ONE relevant technical question based on the candidate's profile. After they answer, generate a NEW different follow-up question. Never repeat a question.";
        }

        return basePrompt.replace('{{questions}}', questionBlock);
    };

    // ── APPEND MESSAGE & GET AI RESPONSE ──────────────────────────────────
    const append = async (msg: any) => {
        const userMsg: SavedMessage = { role: 'user', content: msg.text };

        // Use functional update to get the latest messages
        let currentMessages: SavedMessage[] = [];
        setMessages(prev => {
            currentMessages = [...prev, userMsg];
            return currentMessages;
        });

        setIsLoading(true);

        try {
            // Small delay to ensure state is updated
            await new Promise(resolve => setTimeout(resolve, 50));

            const messagesSnapshot = [...currentMessages];

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemPrompt: buildSystemPrompt(),
                    messages: messagesSnapshot,
                })
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            const assistantMsg: SavedMessage = { role: 'assistant', content: data.message };

            setMessages(prev => [...prev, assistantMsg]);
            setUserTranscript("");

            // Track this response — if it contains a question, record it
            if (data.message.includes('?')) {
                askedQuestionsRef.current.push(data.message);
            }

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

    // ── SPEECH RECOGNITION SETUP ───────────────────────────────────────────
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
                        append({ text: transcript });
                    } else {
                        startListening();
                    }
                };

                recognition.onerror = (event: any) => {
                    if (event.error === 'no-speech') {
                        if (callStatusRef.current === CallStatus.ACTIVE && !isSpeakingRef.current && !isLoadingRef.current) {
                            startListening();
                        }
                        return;
                    }
                    if (event.error === 'aborted') return;

                    console.error('Speech recognition error:', event.error);
                    if (event.error === 'not-allowed') {
                        toast.error("Microphone access denied. Please allow microphone and refresh.");
                        stopCall();
                        setCallStatus(CallStatus.INACTIVE);
                        return;
                    }
                    setTimeout(() => startListening(), 1000);
                };

                recognition.onend = () => {
                    if (callStatusRef.current === CallStatus.ACTIVE && !isSpeakingRef.current && !isLoadingRef.current) {
                        startListening();
                    }
                };

                recognitionRef.current = recognition;
            } else {
                toast.error("Speech Recognition not supported. Please use Chrome.");
            }
            synthesisRef.current = window.speechSynthesis;
        }

        return () => {
            stopCall();
            if (synthesisRef.current) synthesisRef.current.cancel();
        };
    }, []);

    // ── SOFT FEMALE VOICE ──────────────────────────────────────────────────
    const setIsSpeakingState = (speaking: boolean) => {
        setIsSpeaking(speaking);
        isSpeakingRef.current = speaking;
    };

    const speakMessage = (text: string) => {
        if (!synthesisRef.current) return;

        setIsSpeakingState(true);
        const utterance = new SpeechSynthesisUtterance(text);

        const voices = synthesisRef.current.getVoices();
        const femaleVoice =
            voices.find((v: any) => v.name === 'Google UK English Female')
            || voices.find((v: any) => v.name === 'Google US English')
            || voices.find((v: any) => v.name === 'Samantha')
            || voices.find((v: any) => v.name === 'Karen')
            || voices.find((v: any) => v.name === 'Moira')
            || voices.find((v: any) => v.name.toLowerCase().includes('female'))
            || voices.find((v: any) => v.lang === 'en-GB')
            || voices.find((v: any) => v.lang.startsWith('en'));

        if (femaleVoice) utterance.voice = femaleVoice;

        utterance.rate = 0.88;
        utterance.pitch = 1.15;
        utterance.volume = 1.0;

        utterance.onend = () => {
            setIsSpeakingState(false);
            if (callStatusRef.current === CallStatus.ACTIVE) startListening();
        };

        utterance.onerror = () => {
            setIsSpeakingState(false);
            if (callStatusRef.current === CallStatus.ACTIVE) startListening();
        };

        utteranceRef.current = utterance;
        synthesisRef.current.speak(utterance);
    };

    const startListening = () => {
        if (callStatusRef.current !== CallStatus.ACTIVE || !recognitionRef.current || isSpeakingRef.current) return;
        try {
            recognitionRef.current.start();
        } catch (e: any) {
            if (e.name !== 'InvalidStateError') {
                console.error("Failed to start speech recognition", e);
            }
        }
    };

    // ── CALL HANDLERS ──────────────────────────────────────────────────────
    const handleCall = async () => {
        setCallStatus(CallStatus.CONNECTING);

        // Reset question tracking on new call
        questionIndexRef.current = 0;
        askedQuestionsRef.current = [];
        setMessages([]);

        try {
            if (synthesisRef.current) synthesisRef.current.getVoices();

            await append({
                text: `Hello! I am ${userName} and I'm ready to start the interview.`
            });
            setCallStatus(CallStatus.ACTIVE);
        } catch (error: any) {
            console.error("Call start error:", error);
            toast.error(error.message || "Failed to start interview");
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

    useEffect(() => {
        if (callstatus === CallStatus.FINISHED) {
            if (type === 'generate') {
                router.push('/');
            } else {
                handleGenerateFeedback(messages);
            }
        }
    }, [callstatus]);

    const handleGenerateFeedback = async (messagesArray: SavedMessage[]) => {
        const { success, feedbackId: id } = await createFeedback({
            interviewId: interviewId!,
            userId: userId!,
            transcript: messagesArray
        });

        if (success && id) {
            router.push(`/interview/${interviewId}/feedback`);
        } else {
            router.push('/');
        }
    };

    const lastMsg = messages.filter((m: any) => m.role === 'assistant').pop();
    const latestAssistantMessage = lastMsg ? lastMsg.content : "";
    const isCallInactiveOrFinished = callstatus === CallStatus.INACTIVE || callstatus === CallStatus.FINISHED;

    // ── RENDER ─────────────────────────────────────────────────────────────
    return (
        <>
            <div className="call-view">
                <div className="card-interviewer">
                    <div className="avatar">
                        <Image src="/ai-avatar.png" alt="ai" width={65} height={54} className="object-cover" />
                        {isSpeaking && <span className="animate-speak" />}
                    </div>
                    <h3>AI Interviewer</h3>
                </div>

                <div className="card-border">
                    <div className="card-content">
                        <Image src="/user-avatar.png" alt="user avatar"
                            width={540} height={540} className="rounded-full object-cover size-[120px]" />
                        <h3>{userName}</h3>
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
                        <span>{isCallInactiveOrFinished ? 'Call' : '. . .'}</span>
                    </button>
                ) : (
                    <button className="btn-disconnect" onClick={handleDisconnect}>End</button>
                )}
            </div>
        </>
    );
};

export default Agent;