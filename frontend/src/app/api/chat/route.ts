import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

if (!process.env.GROQ_API_KEY) {
  throw new Error('The GROQ_API_KEY environment variable is missing or empty');
}
if (!process.env.RETRIEVAL_API_URL) {
  throw new Error('The RETRIEVAL_API_URL environment variable is missing or empty');
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { content, conversationHistory }: { content: string, conversationHistory: any[] } = await req.json();
    console.log('Received question:', content);
    console.log('Current conversation history:', conversationHistory);

    // Call the backend retrieval API to fetch passages for the user's question.
    const retrievalResponse = await fetch(`${process.env.RETRIEVAL_API_URL}/retrieve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question: content })
    });

    if (!retrievalResponse.ok) {
      throw new Error('Failed to fetch retrieved passages from the retrieval API');
    }

    const retrievalData = await retrievalResponse.json();
    const retrievedPassages = retrievalData.retrieved_passages;
    console.log('Retrieved passages:', retrievedPassages);

    // Combine the retrieved passages into a context string.
    const context = retrievedPassages ? retrievedPassages.join(" ") : "";

    // Build the conversation context from previous messages.
    let conversationContext = "";
    if (conversationHistory.length > 0) {
      conversationContext = conversationHistory
        .map(msg => `${msg.role}: ${msg.content}`)
        .join("\n");
    }

    // Updated system prompt to instruct the generative model.
    const systemPrompt = 
      "You are ZendaAssist, an expert on Zendalona's accessible open-source projects. " +
      "Answer the user's question using the provided context. " +
      "If further clarification is needed, ask for more details. " +
      "The conversation history is provided to maintain context for follow-up questions.";

    // Construct the messages for the generative model.
    const messages:  any = [
      { role: "system", content: systemPrompt },
      // Injecting the context as an assistant message.
      { role: "assistant", content: `Context: ${context}` },
      // Append conversation history (if any) and the new user question.
      { role: "user", content: conversationContext ? `${conversationContext}\nUser: ${content}` : content },
    ];

    const completion = await groq.chat.completions.create({
      messages,
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 1024,
    });

    const reply = completion.choices[0]?.message?.content || 'No response generated';
    console.log('Generated reply:', reply);

    // Update the conversation history with the latest exchange.
    const updatedConversationHistory = [
      ...conversationHistory,
      { role: "user", content },
      { role: "assistant", content: reply },
    ];

    return NextResponse.json({
      reply,
      conversationHistory: updatedConversationHistory,
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
