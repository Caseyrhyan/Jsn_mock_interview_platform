import { NextResponse } from 'next/server';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, systemPrompt } = await req.json();

    // Count how many assistant messages exist so far
    // This tells the AI which question number it should be on
    const assistantTurnCount = messages.filter((m: any) => m.role === 'assistant').length;

    const formattedMessages = [
      {
        role: 'system',
        content: systemPrompt
          + `\n\nCRITICAL RULES TO FOLLOW STRICTLY:
1. You are currently on assistant turn number ${assistantTurnCount + 1}.
2. NEVER repeat a question you have already asked in this conversation.
3. Look at the full conversation history above. If you already asked a question, skip it and move to the next one.
4. Ask questions in strict ORDER — do not jump around.
5. Keep your response SHORT. One acknowledgement sentence + one question only.
6. If all prepared questions have been asked and answered, generate a NEW original follow-up question relevant to the candidate's answers. Do NOT repeat anything.`
      },
      ...messages
    ];

    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          messages: formattedMessages,
          model: "Qwen/Qwen3-4B-Instruct-2507:nscale",
          temperature: 0.5,   // ← lowered from 0.7: less random = less repetition
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Chat Error:', errorText);
      return NextResponse.json({ error: 'Failed to generate response' }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json({ message: result.choices[0].message.content });

  } catch (error) {
    console.error('API Chat Error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}