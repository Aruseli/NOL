import { NextResponse } from 'next/server';
// Убедитесь, что путь импорта верный
import { getChatResponseFromLLM } from '@/lib/langchain-agent';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = body.prompt;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const llmResponse = await getChatResponseFromLLM(prompt)

    let responseText: string = typeof llmResponse === 'string' ? llmResponse : "Не удалось обработать ответ от LLM.";

    return NextResponse.json({ text: responseText });

  } catch (error) {
    console.error("Error in /api/chat:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}