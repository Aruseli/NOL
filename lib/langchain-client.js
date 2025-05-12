import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { loadMcpTools } from "@langchain/mcp-adapters";
import { MultiRouteChain } from "langchain/chains";
import { ChatGroq } from "@langchain/groq";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";
import { tool } from "@langchain/core/tools";

let routerChain = null;

async function initRouterChain() {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["dist/mcp-server.js"], // путь к MCP серверу
  });

  const client = new Client({ name: "nol-mcp-client", version: "1.0.0" });
  await client.connect(transport);

  const mcpTools = await loadMcpTools("nol-mcp-server", client);

  const classifyTool = mcpTools.find((t) => t.name === "classifyRequest");
  const chatTool = mcpTools.find((t) => t.name === "getChatResponseFromLLM");
  const chartTool = mcpTools.find((t) => t.name === "getChartDataFromLLM");

  if (!classifyTool || !chatTool || !chartTool) {
    throw new Error("Не все инструменты найдены на MCP сервере");
  }

  const routerLLM = new ChatGroq({
    model: "llama3-70b-8192",
    temperature: 1,
  });

  // Оборачиваем MCP инструменты в LangChain Tool
  const classifyLangTool = tool(
    async (input) => {
      const res = await classifyTool.call({ prompt: input });
      return res.content[0].text;
    },
    {
      name: "classifyRequest",
      description: "Классифицирует запрос как 'chart' или 'chat'",
    }
  );

  const chatLangTool = tool(
    async (input) => {
      const res = await chatTool.call({ prompt: input });
      return res.content[0].text;
    },
    {
      name: "chatResponse",
      description: "Генерирует текстовый ответ для чата"
    },
  );

  const chartLangTool = tool(
    async (input) => {
      const res = await chartTool.call({ prompt: input });
      return res.content[0].text;
    },
    {
      name: "chartData",
      description: "Генерирует данные диаграммы в формате JSON",
    }
  );

  // Цепочка для чата (возвращает string)
  const chatChain = new ChatPromptTemplate({
    llm: routerLLM,
    prompt: ChatPromptTemplate.fromPromptMessages([
      SystemMessagePromptTemplate.fromTemplate("You are a helpful chatbot. Respond to the user's query."),
      HumanMessagePromptTemplate.fromTemplate("{input}"),
    ]),
    outputKey: "text",
  });

  // Цепочка для диаграммы (возвращает объект с текстом и chart)
  // Создадим кастомную функцию, которая вызывает MCP инструменты напрямую
  const chartProcessingChain = new ChatPromptTemplate({
    llm: routerLLM, // Используем тот же LLM
    prompt: ChatPromptTemplate.fromPromptMessages([
      SystemMessagePromptTemplate.fromTemplate("Generate chart data based on the user's input. Also provide a textual summary or answer related to the input if appropriate."),
      HumanMessagePromptTemplate.fromTemplate("{input}"),
    ]),
    outputKey: "result", // Назовем выходной ключ по-другому, чтобы не было конфликта с 'text' из chatChain
  });

  chartProcessingChain.call = async (values) => {
    const input = values.input;
    // Получаем JSON диаграммы
    const chartJsonRaw = await chartLangTool.call(input);
    let chartJson = null;
    try {
      chartJson = JSON.parse(chartJsonRaw);
    } catch (e) {
      console.error("Failed to parse chart JSON:", e);
      chartJson = null; // Если парсинг не удался, chart будет null
    }
    // Получаем текстовый ответ
    const chatText = await chatLangTool.call(input); // Этот вызов также должен быть частью логики chart, если нужен отдельный текст
    return { text: chatText, chart: chartJson };
  };

  // Промпт для маршрутизатора - LLM должен вернуть JSON с destination и next_inputs
  const routerPrompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(`
You are a router deciding which tool to use based on user input.
Respond ONLY with a JSON object with keys:
- "destination": either "chat" or "chart"
- "next_inputs": a JSON object with the input for the destination tool. If the destination is "chat", next_inputs should be {{"input": "user's original query"}}. If the destination is "chart", next_inputs should be {{"input": "user's original query to generate a chart"}}.
The user's input is: {input}
`),
    HumanMessagePromptTemplate.fromTemplate("{input}"),
  ]);
}

export async function handleUserRequest(
  prompt
) {
  if (!routerChain) {
    await initRouterChain();
  }
  if (!routerChain) {
    throw new Error("RouterChain не инициализирован");
  }

  // routerChain.call возвращает ChainValues
  const response = await routerChain.call({ input: prompt });

  // Проверяем и приводим тип
  if (response && typeof response.text === 'string' && response.chart === undefined) {
    return { text: response.text };
  }

  // Если объект с полями text и chart (например, из chartChain)
  if (
    response &&
    typeof response === "object" &&
    "text" in response // text есть
    // chart может быть null, поэтому проверяем его наличие как ключа, если он не undefined
  ) {
    return {
      text: response.text,
      chart: response.chart, // chart может быть undefined если сработала chatChain
    };
  }

  console.warn("Unexpected response structure from routerChain:", response);
  // На всякий случай fallback
  return { text: "Не удалось обработать ответ от LLM." };
}
