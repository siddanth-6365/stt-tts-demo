import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

if (!process.env.GROQ_API_KEY) {
  throw new Error('The GROQ_API_KEY environment variable is missing or empty');
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { content } = await req.json();
    console.log('Received message:', content);

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant that provides clear and concise responses."
        },
        {
          role: "user",
          content: content
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 1024,
    });

    return NextResponse.json({ 
      reply: completion.choices[0]?.message?.content || 'No response generated' 
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
