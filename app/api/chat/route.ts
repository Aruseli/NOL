import { NextResponse } from 'next/server';
import { getChartDataFromLLM } from '@/lib/langchain-agent';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = body.prompt;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }
    const llmResponse = await getChartDataFromLLM(prompt);

    let responseText: string;

    // Проверяем тип ответа
    if (typeof llmResponse === 'string') {
      // Если строка, используем ее как текст для чата
      responseText = llmResponse;
    } else if (typeof llmResponse === 'object' && llmResponse !== null) {
      // Если объект (JSON для графика), возвращаем сообщение-заглушку
      // Или можно вернуть JSON.stringify(llmResponse), если это имеет смысл для отладки
      responseText = "[Получены данные для графика, не отображаются в чате]";
      console.log("API чата получило данные для графика:", llmResponse);
    } else {
      // Неожиданный тип ответа
      responseText = "Не удалось обработать ответ от LLM.";
      console.error("Неожиданный тип ответа от getChartDataFromLLM:", llmResponse);
    }

    return NextResponse.json({ text: responseText });

  } catch (error) {
    console.error("Error in /api/chat:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}