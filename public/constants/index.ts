import { interview } from "@/lib/actions/type/interview";
import { CreateAssistantDTO } from "@vapi-ai/web/dist/api";
import { z } from "zod";

export const mappings = {
  "react.js": "react",
  reactjs: "react",
  react: "react",
  "next.js": "nextjs",
  nextjs: "nextjs",
  next: "nextjs",
  "vue.js": "vuejs",
  vuejs: "vuejs",
  vue: "vuejs",
  "express.js": "express",
  expressjs: "express",
  express: "express",
  "node.js": "nodejs",
  nodejs: "nodejs",
  node: "nodejs",
  mongodb: "mongodb",
  mongo: "mongodb",
  mongoose: "mongoose",
  mysql: "mysql",
  postgresql: "postgresql",
  sqlite: "sqlite",
  firebase: "firebase",
  docker: "docker",
  kubernetes: "kubernetes",
  aws: "aws",
  azure: "azure",
  gcp: "gcp",
  digitalocean: "digitalocean",
  heroku: "heroku",
  photoshop: "photoshop",
  "adobe photoshop": "photoshop",
  html5: "html5",
  html: "html5",
  css3: "css3",
  css: "css3",
  sass: "sass",
  scss: "sass",
  less: "less",
  tailwindcss: "tailwindcss",
  tailwind: "tailwindcss",
  bootstrap: "bootstrap",
  jquery: "jquery",
  typescript: "typescript",
  ts: "typescript",
  javascript: "javascript",
  js: "javascript",
  "angular.js": "angular",
  angularjs: "angular",
  angular: "angular",
  "ember.js": "ember",
  emberjs: "ember",
  ember: "ember",
  "backbone.js": "backbone",
  backbonejs: "backbone",
  backbone: "backbone",
  nestjs: "nestjs",
  graphql: "graphql",
  "graph ql": "graphql",
  apollo: "apollo",
  webpack: "webpack",
  babel: "babel",
  "rollup.js": "rollup",
  rollupjs: "rollup",
  rollup: "rollup",
  "parcel.js": "parcel",
  parceljs: "parcel",
  npm: "npm",
  yarn: "yarn",
  git: "git",
  github: "github",
  gitlab: "gitlab",
  bitbucket: "bitbucket",
  figma: "figma",
  prisma: "prisma",
  redux: "redux",
  flux: "flux",
  redis: "redis",
  selenium: "selenium",
  cypress: "cypress",
  jest: "jest",
  mocha: "mocha",
  chai: "chai",
  karma: "karma",
  vuex: "vuex",
  "nuxt.js": "nuxt",
  nuxtjs: "nuxt",
  nuxt: "nuxt",
  strapi: "strapi",
  wordpress: "wordpress",
  contentful: "contentful",
  netlify: "netlify",
  vercel: "vercel",
  "aws amplify": "amplify",
};

export const interviewer: CreateAssistantDTO = {
  name: "Interviewer",
  firstMessage:
    "Hello! Thank you for taking the time to speak with me today. I'm excited to learn more about you and your experience.",
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en",
  },
  voice: {
    provider: "11labs",
    voiceId: "sarah",
    stability: 0.4,
    similarityBoost: 0.8,
    speed: 0.9,
    style: 0.5,
    useSpeakerBoost: true,
  },
  model: {
    provider: "openai",
    model: "gpt-4",
    messages: [
      {
        role: "system",
       // Inside the interviewer object, replace only the content string:

// content: `You are a professional job interviewer conducting a real-time voice interview with a candidate. Your goal is to keep things conversational and structured.

// CRITICALLY IMPORTANT RULES:
// - Ask ONLY ONE question at a time. Wait for the candidate's full response before continuing.
// - NEVER ask the same question twice. Check the conversation history before asking.
// - Always move FORWARD through the steps. Do NOT go back or repeat.
// - Keep ALL responses very short: one brief acknowledgement + one question.

// Follow this EXACT sequence:

// Step 1 (Turn 1): Greet the candidate warmly. Ask their name and a brief introduction.

// Step 2 (Turn 2): Acknowledge their intro using their name. Ask: "Why do you want this role?"

// Step 3 (Turn 3): Acknowledge briefly. Ask a behavioral question: "Tell me about a time when you faced a challenge at work or school and how you handled it."

// Step 4 (Turns 4 onwards): You have a list of technical questions below. Ask them ONE BY ONE in order. After the candidate answers each one, acknowledge briefly and move to the NEXT question in the list. Do NOT repeat any question already asked.

// {{questions}}

// Step 5 (Final turn — after ALL questions above are done): Thank the candidate warmly by name. Tell them HR will be in touch. Give a polite closing. Do NOT ask any more questions.

// Tone: warm, professional, encouraging. Never robotic.`,

content: `You are a warm, friendly job interviewer for BEGINNER-level candidates. Keep everything simple and encouraging.

CRITICALLY IMPORTANT RULES:
- Ask ONLY ONE question at a time.
- NEVER repeat a question already asked in this conversation.
- Keep questions VERY SIMPLE — suitable for a beginner or student.
- Always move FORWARD. Never go back.
- Keep all responses SHORT: one brief acknowledgement + one question.
- If the candidate struggles, be encouraging. Never make them feel bad.

Follow this EXACT sequence:

Step 1 (Turn 1): Greet the candidate warmly. Ask their name and a brief intro about themselves.

Step 2 (Turn 2): Acknowledge their intro using their name. Ask: "Why are you interested in this role?"

Step 3 (Turn 3): Acknowledge briefly. Ask a simple behavioral question: "Can you tell me about a project you have worked on or something you built?"

Step 4 (Turns 4 onwards): Ask the technical questions below ONE BY ONE in order. They are beginner-level. After the candidate answers each one, acknowledge briefly and move to the NEXT question. Do NOT repeat any question already asked.

{{questions}}

Step 5 (Final turn — after ALL questions are done): Thank the candidate warmly by name. Tell them the team will be in touch. Give a kind, encouraging closing message.

Tone: warm, patient, encouraging, conversational. Never robotic or intimidating.`,
      },
    ],
  },
};

export const feedbackSchema = z.object({
  totalScore: z.number(),
  categoryScores: z.tuple([
    z.object({
      name: z.literal("Communication Skills"),
      score: z.number(),
      comment: z.string(),
    }),
    z.object({
      name: z.literal("Technical Knowledge"),
      score: z.number(),
      comment: z.string(),
    }),
    z.object({
      name: z.literal("Problem Solving"),
      score: z.number(),
      comment: z.string(),
    }),
    z.object({
      name: z.literal("Cultural Fit"),
      score: z.number(),
      comment: z.string(),
    }),
    z.object({
      name: z.literal("Confidence and Clarity"),
      score: z.number(),
      comment: z.string(),
    }),
  ]),
  strengths: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
  finalAssessment: z.string(),
});

export const interviewCovers = [
  "/adobe.png",
  "/amazon.png",
  "/facebook.png",
  "/hostinger.png",
  "/pinterest.png",
  "/quora.png",
  "/reddit.png",
  "/skype.png",
  "/spotify.png",
  "/telegram.png",
  "/tiktok.png",
  "/yahoo.png",
];

 export const dummyInterviews: interview[] = [
  {
    id: "1",
    userId: "user1",
    role: "Frontend Developer",
    type: "Technical",
    techstack: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
    level: "Junior",
    questions: ["What is React?"] as any,
    finalized: false,
    createdAt: "2024-03-15T10:00:00Z",
  },
  {
    id: "2",
    userId: "user1",
    role: "Full Stack Developer",
    type: "Mixed",
    techstack: ["Node.js", "Express", "MongoDB", "React"],
    level: "Senior",
    questions: ["What is Node.js?"] as any,
    finalized: false,
    createdAt: "2024-03-14T15:30:00Z",
  },
];