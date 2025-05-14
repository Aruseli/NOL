import { OpenAIEmbeddings } from "@langchain/openai";
import { cosineSimilarity } from "@langchain/core/utils/math";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { getChartDataFromLLM, getChatResponseFromLLM } from "./langchain-agent";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Шаблоны для определения типа запроса и формирования промптов
const chartTemplate = ChatPromptTemplate.fromTemplate(`Вопрос, который требует визуализации данных в виде графика.
Запрос связан с отображением статистики, трендов, распределений или других данных, 
которые лучше всего представить визуально через диаграмму или график.
Примеры запросов:
- Покажи график распределения населения по возрасту
- Визуализируй данные по продажам за последний год
- Построй диаграмму сравнения показателей

Вопрос пользователя:
{query}

Ответь ТОЛЬКО валидным JSON объектом конфигурации для ECharts с массивом series. Без дополнительного текста или markdown.`);

const textTemplate = ChatPromptTemplate.fromTemplate(`Вопрос, который требует текстового ответа без визуализации.
Запрос связан с получением информации, объяснением концепций, 
или другими темами, где достаточно текстового ответа.
Примеры запросов:
- Что такое искусственный интеллект?
- Объясни принцип работы блокчейна
- Расскажи о последних новостях в мире технологий

Вопрос пользователя:
{query}

Ответь текстом для чата без JSON или других форматов.`);

// Шаблоны для определения типа запроса (без инструкций для ответа)
const chartClassifierTemplate = `Вопрос, который требует визуализации данных в виде графика.
Запрос связан с отображением статистики, трендов, распределений или других данных, 
которые лучше всего представить визуально через диаграмму или график.
Примеры запросов:
- Покажи график распределения населения по возрасту
- Визуализируй данные по продажам за последний год
- Построй диаграмму сравнения показателей`;

const textClassifierTemplate = `Вопрос, который требует текстового ответа без визуализации.
Запрос связан с получением информации, объяснением концепций, 
или другими темами, где достаточно текстового ответа.
Примеры запросов:
- Что такое искусственный интеллект?
- Объясни принцип работы блокчейна
- Расскажи о последних новостях в мире технологий`;

// Инициализация эмбеддингов
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY,
  configuration: {
    baseURL: process.env.OPENROUTER_BASE_URL,
  },
});

// Кэш для эмбеддингов шаблонов
let templateEmbeddingsCache: number[][] | null = null;

/**
 * Получает эмбеддинги шаблонов, используя кэш, если доступно
 */
async function getTemplateEmbeddings(): Promise<number[][]> {
  if (templateEmbeddingsCache === null) {
    const templates = [chartClassifierTemplate, textClassifierTemplate];
    templateEmbeddingsCache = await embeddings.embedDocuments(templates);
  }
  return templateEmbeddingsCache;
}

/**
 * Маршрутизатор промптов, который выбирает подходящий шаблон на основе запроса
 * @param query Запрос пользователя
 * @returns Промпт, сформированный на основе выбранного шаблона
 */
const promptRouter = async (query: string) => {
  const queryEmbedding = await embeddings.embedQuery(query);
  const templateEmbeddings = await getTemplateEmbeddings();
  
  const similarity = cosineSimilarity([queryEmbedding], templateEmbeddings)[0];
  const isChartPrompt = similarity[0] > similarity[1];
  
  if (isChartPrompt) {
    console.log(`Используется шаблон для графика`);
    return chartTemplate.invoke({ query });
  } else {
    console.log(`Используется шаблон для текста`);
    return textTemplate.invoke({ query });
  }
};

/**
 * Создает транспорт и клиент MCP для вызова инструментов
 */
async function createMcpClient() {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["dist/mcp-server.js"]
  });
  
  const client = new Client({
    name: "nol-mcp-client",
    version: "1.0.0"
  });
  
  await client.connect(transport);
  return { client, transport };
}

/**
 * Вызывает MCP инструмент с заданным промптом
 */
async function callMcpWithPrompt(toolName: string, prompt: any): Promise<string | object> {
  const { client, transport } = await createMcpClient();
  
  try {
    // Извлекаем текст промпта из объекта
    let promptText: string;
    if (typeof prompt === 'string') {
      promptText = prompt;
    } else if (prompt && prompt.content && Array.isArray(prompt.content)) {
      promptText = prompt.content.map((item: any) => 
        typeof item === 'object' && item.text ? item.text : String(item)
      ).join('\n');
    } else {
      promptText = JSON.stringify(prompt);
    }
    
    // Вызываем MCP инструмент
    const result = await client.callTool({
      name: toolName,
      arguments: { prompt: promptText }
    });
    
    // Обрабатываем результат
    if (
      result &&
      typeof result === "object" &&
      Array.isArray((result as any).content) &&
      (result as any).content.length > 0 &&
      typeof (result as any).content[0] === "object" &&
      (result as any).content[0].type === "text" &&
      typeof (result as any).content[0].text === "string"
    ) {
      const rawText = (result as any).content[0].text;
      
      try {
        return JSON.parse(rawText);
      } catch (parseError) {
        return rawText;
      }
    } else {
      console.error("Некорректный формат ответа MCP tool:", result);
      return "Некорректный формат ответа от LLM.";
    }
  } catch (error) {
    console.error("Ошибка при вызове MCP tool:", error);
    return `Ошибка при взаимодействии с LLM: ${error instanceof Error ? error.message : String(error)}`;
  } finally {
    await client.close();
  }
}

/**
 * Определяет, требует ли запрос визуализации данных или текстового ответа
 * @param query Запрос пользователя
 * @returns true, если запрос требует визуализации, false - если текстового ответа
 */
async function isChartQuery(query: string): Promise<boolean> {
  const queryEmbedding = await embeddings.embedQuery(query);
  const templateEmbeddings = await getTemplateEmbeddings();
  
  const similarity = cosineSimilarity([queryEmbedding], templateEmbeddings)[0];
  
  // Если сходство с шаблоном графика выше, чем с текстовым шаблоном
  return similarity[0] > similarity[1];
}

// Создаем последовательности для обработки запросов
const chartSequence = RunnableSequence.from([
  promptRouter,
  async (prompt: any) => callMcpWithPrompt("getChartDataFromLLM", prompt),
  new StringOutputParser(),
]);

const textSequence = RunnableSequence.from([
  promptRouter,
  async (prompt: any) => callMcpWithPrompt("getChatResponseFromLLM", prompt),
  new StringOutputParser(),
]);

/**
 * Маршрутизирует запрос пользователя к соответствующему обработчику
 * @param query Запрос пользователя
 * @returns Результат обработки запроса (данные для графика или текстовый ответ)
 */
export async function routeQuery(query: string): Promise<string | object> {
  // Определяем тип запроса
  const requiresChart = await isChartQuery(query);
  
  console.log(`Запрос определен как ${requiresChart ? 'требующий визуализации' : 'требующий текстового ответа'}`);
  
  // Используем соответствующую последовательность
  try {
    if (requiresChart) {
      const result = await chartSequence.invoke(query);
      try {
        return JSON.parse(result);
      } catch {
        return result;
      }
    } else {
      return await textSequence.invoke(query);
    }
  } catch (error) {
    console.error("Ошибка при обработке запроса:", error);
    return `Произошла ошибка при обработке запроса: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Маршрутизирует запрос пользователя с возможностью явного указания типа ответа
 * @param query Запрос пользователя
 * @param forceType Принудительный тип ответа ('chart' или 'text')
 * @returns Результат обработки запроса
 */
export async function routeQueryWithType(
  query: string, 
  forceType?: 'chart' | 'text'
): Promise<string | object> {
  if (forceType === 'chart') {
    console.log('Принудительная маршрутизация запроса для получения данных графика');
    try {
      const result = await chartSequence.invoke(query);
      try {
        return JSON.parse(result);
      } catch {
        return result;
      }
    } catch (error) {
      console.error("Ошибка при обработке запроса для графика:", error);
      return `Произошла ошибка при обработке запроса: ${error instanceof Error ? error.message : String(error)}`;
    }
  } else if (forceType === 'text') {
    console.log('Принудительная маршрутизация запроса для получения текстового ответа');
    try {
      return await textSequence.invoke(query);
    } catch (error) {
      console.error("Ошибка при обработке текстового запроса:", error);
      return `Произошла ошибка при обработке запроса: ${error instanceof Error ? error.message : String(error)}`;
    }
  } else {
    // Автоматическое определение типа запроса
    return await routeQuery(query);
  }
}
