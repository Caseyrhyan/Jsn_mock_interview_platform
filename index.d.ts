interface InterviewCardProps {
    interviewId: string;
    userId: string;
    role: string;
    type: string;
    techstack: string[];
    createdAt?: string | Date;
}

interface Feedback {
    createdAt: string | Date;
    comments?: string;
}

interface signUpParams {
    uid: string;
    username: string;
    email: string;
    password: string; 
}

interface SignUpParams {
    email: string;
    idToken: string;
}

type FormType = "sign-in" | "sign-up";

interface Message {
  type: 'transcript';
  transcriptType: 'final' | 'interim';
  role: 'user' | 'assistant' | 'system';
  transcript: string;
}

