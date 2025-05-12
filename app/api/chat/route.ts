import { NextResponse } from 'next/server';
// Удаляем getChartDataFromLLM, getChatResponseFromLLM, если они больше не нужны напрямую здесь
// import { getChartDataFromLLM, getChatResponseFromLLM } from '@/lib/langchain-agent';
import { handleUserRequest } from '@/lib/chain';
// import { handleUserRequest } from '@/lib/langchain-client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = body.prompt;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Используем handleUserRequest для получения ответа и данных для графика
    const { text, jsonObjects } = await handleUserRequest(prompt);

    // Возвращаем результат
    return NextResponse.json({
      text: text, // text уже должен быть строкой от handleUserRequest
      chart: jsonObjects // chart может быть объектом или null/undefined
    });

  } catch (error) {
    console.error("Error in /api/chat:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}