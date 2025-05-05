import { NextResponse } from 'next/server';
import { getChartDataFromLLM } from '@/lib/langchain-agent'; // Убедитесь, что путь верный

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = body.prompt;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const llmResponse = await getChartDataFromLLM(prompt);

    let response = typeof llmResponse === 'object' && llmResponse !== null ? llmResponse : "Не удалось обработать ответ от LLM.";
    // Возвращаем данные клиенту
    return NextResponse.json({ data: response });

  } catch (error) {
    console.error("Error in /api/chart:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    // Возвращаем ошибку клиенту
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
