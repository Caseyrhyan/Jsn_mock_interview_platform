import { NextResponse } from 'next/server';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, systemPrompt } = await req.json();

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
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
          temperature: 0.7,
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
