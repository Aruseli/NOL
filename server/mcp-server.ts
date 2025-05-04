import 'dotenv/config';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";

// Конфигурируем LangChain с OpenRouter
const llm = new ChatOpenAI({
  modelName: "openrouter/auto",
  temperature: 0.7,
  openAIApiKey: process.env.OPENROUTER_API_KEY,
  configuration: {
    baseURL: process.env.OPENROUTER_BASE_URL, // например, https://openrouter.ai/api/v1
  },
  modelKwargs: {
    headers: {
      "HTTP-Referer": process.env.YOUR_SITE_URL,
      "X-Title": "NOL App",
    },
  },
});

const mcpServer = new McpServer({
  name: "NOL MCP Server",
  version: "1.0.0",
});

// MCP tool, который возвращает JSON-массив для ECharts как строку
mcpServer.tool(
  "getChartDataFromLLM",
  { prompt: z.string() },
  async ({ prompt }, extra) => {
    // Просим LLM вернуть только JSON-массив для ECharts
    // const userPrompt = `${prompt}\nОтветь только JSON-массивом для ECharts без пояснений.`; // Old prompt
    const userPrompt = `${prompt}\nGenerate a valid ECharts JSON configuration object based on the request. Respond ONLY with the JSON object, without any explanations or markdown formatting.`; // New prompt
    const result = await llm.invoke([{ role: "user", content: userPrompt }]);

    // Гарантируем, что text - строка!
    let text: string;
    if (typeof result.content === "string") {
      text = result.content;
    } else if (Array.isArray(result.content)) {
      text = result.content.map((c: any) => (typeof c.text === "string" ? c.text : "")).join("\n");
    } else {
      text = JSON.stringify(result.content);
    }

    // Возвращаем как MCP требует: массив объектов с type: "text" и text: string
    return {
      content: [{ type: "text", text }]
    };
  }
);

// Запуск MCP сервера через stdio
await mcpServer.connect(new StdioServerTransport());
