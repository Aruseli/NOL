import { NextResponse } from 'next/server';
import { getChartDataFromLLM } from '@/lib/langchain-agent'; // Убедитесь, что путь верный

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = body.prompt;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Вызываем нашу универсальную функцию
    const llmResponse = await getChartDataFromLLM(prompt);

    // Проверяем тип ответа
    if (typeof llmResponse === 'object' && llmResponse !== null) {
      // Успех: получили JSON, возвращаем его как есть
      return NextResponse.json({ data: llmResponse });
    } else if (typeof llmResponse === 'string') {
      // Ошибка: получили текст вместо JSON
      console.error("API /api/chart получило текст вместо JSON:", llmResponse);
      return NextResponse.json({ error: 'Failed to generate chart data', details: llmResponse }, { status: 500 });
    } else {
      // Неожиданный ответ
      console.error("API /api/chart получило неожиданный ответ:", llmResponse);
      return NextResponse.json({ error: 'Internal Server Error', details: 'Unexpected response format from LLM service' }, { status: 500 });
    }

  } catch (error) {
    console.error("Error in /api/chart:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    // Возвращаем ошибку клиенту
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
