import { createOpenAI } from '@ai-sdk/openai';

export const hf = createOpenAI({
  baseURL: 'https://router.huggingface.co/v1/',
  apiKey: process.env.HF_TOKEN,
});

export const aiModel = hf('Qwen/Qwen3-4B-Instruct-2507:nscale');
