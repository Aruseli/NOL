import { NextResponse } from 'next/server';
import { getChartDataFromLLM, getChatResponseFromLLM } from '@/lib/langchain-agent';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = body.prompt;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Получаем ответ для чата
    const chatResponse = await getChatResponseFromLLM(prompt);

    // Получаем данные для чарта
    const chartData = await getChartDataFromLLM(prompt);

    // Приводим chatResponse к строке (если нужно)
    const responseText = typeof chatResponse === 'string' ? chatResponse : "Не удалось обработать ответ от LLM.";

    // Возвращаем оба результата вместе
    return NextResponse.json({
      text: responseText,
      chart: chartData
    });

  } catch (error) {
    console.error("Error in /api/chat:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}