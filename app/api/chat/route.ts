import { NextResponse } from 'next/server';
// Убедитесь, что путь импорта верный
import { getChartDataFromLLM } from '@/lib/langchain-agent';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = body.prompt;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Вызываем функцию, которая может вернуть объект или строку
    const llmResponse = await getChartDataFromLLM(prompt);

    let responseText: string;

    // --- ВАЖНАЯ ПРОВЕРКА ТИПА ---
    if (typeof llmResponse === 'object' && llmResponse !== null) {
      // Если это объект (JSON для графика), возвращаем заглушку в чат
      responseText = "[Получены данные для графика, не отображаются в чате]";
      console.log("API чата получило данные для графика:", llmResponse);
    } else if (typeof llmResponse === 'string') {
      // Если это строка, используем ее как текст для чата
      responseText = llmResponse;
    } else {
      // Неожиданный тип ответа
      responseText = "Не удалось обработать ответ от LLM.";
      console.error("Неожиданный тип ответа от getChartDataFromLLM:", llmResponse);
    }
    // --- КОНЕЦ ПРОВЕРКИ ---

    // Возвращаем только текстовый ответ для чата
    return NextResponse.json({ text: responseText });

  } catch (error) {
    console.error("Error in /api/chat:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}