import 'dotenv/config';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
// Конфигурируем LangChain с OpenRouter
const llm = new ChatOpenAI({
    modelName: "openrouter/auto",
    temperature: 0.8,
    streaming: true,
    openAIApiKey: process.env.OPENROUTER_API_KEY,
    configuration: {
        baseURL: process.env.OPENROUTER_BASE_URL, // например, https://openrouter.ai/api/v1
    },
    modelKwargs: {
        headers: {
            "HTTP-Referer": process.env.SITE_URL,
            "X-Title": "NOL App",
        },
    },
});
const mcpServer = new McpServer({
    name: "NOL MCP Server",
    version: "1.0.0",
});
mcpServer.tool("getChartDataFromLLM", { prompt: z.string() }, async ({ prompt }) => {
    const userPrompt = `${prompt}\nGenerate a valid ECharts JSON configuration object with a series array. Respond ONLY with JSON, no extra text or markdown.`;
    const result = await llm.invoke([{ role: "user", content: userPrompt }]);
    const text = typeof result.content === "string" ? result.content : JSON.stringify(result.content);
    return { content: [{ type: "text", text }] };
});
mcpServer.tool("getChatResponseFromLLM", { prompt: z.string() }, async ({ prompt }) => {
    const userPrompt = `${prompt}\nОтветь текстом для чата без JSON или других форматов.`;
    const result = await llm.invoke([{ role: "user", content: userPrompt }]);
    const text = typeof result.content === "string" ? result.content : JSON.stringify(result.content);
    return { content: [{ type: "text", text }] };
});
// mcpServer.tool(
//   "classifyRequest",
//   { prompt: z.string() },
//   async ({ prompt }) => {
//     const classificationPrompt = `${prompt}\nОтветь одним словом: "chart" если нужен график, или "chat" если нет.`;
//     const result = await llm.invoke([{ role: "user", content: classificationPrompt }]);
//     const text = typeof result.content === "string" ? result.content.trim().toLowerCase() : "chat";
//     return { content: [{ type: "text", text: text.includes("chart") ? "chart" : "chat" }] };
//   }
// );
// MCP tool для ECharts
// mcpServer.tool(
//   "getChartDataFromLLM",
//   { prompt: z.string() },
//   async ({ prompt }, extra) => {
//     const userPrompt = `${prompt}\nGenerate a valid ECharts JSON configuration object with a series array. Respond ONLY with JSON, no extra text or markdown.`; // New prompt
//     const result = await llm.invoke([{ role: "user", content: userPrompt }]);
//     let text: string;
//     if (typeof result.content === "string") {
//       text = result.content;
//     } else if (Array.isArray(result.content)) {
//       text = result.content.map((c: any) => (typeof c.text === "string" ? c.text : "")).join("\n");
//     } else {
//       text = JSON.stringify(result.content);
//     }
//     // Возвращаем как MCP требует: массив объектов с type: "text" и text: string
//     return {
//       content: [{ type: "text", text }]
//     };
//   }
// );
// MCP resource для конфигурации приложения
// mcpServer.resource(
//   "config",
//   "config://app",
//   async (uri) => ({
//     contents: [{
//       uri: uri.href,
//       text: "App configuration here"
//     }]
//   })
// );
// MCP динамический resource для пользовательских данных
// mcpServer.resource(
//   "user-profile",
//   new ResourceTemplate("users://{userId}/profile", { list: undefined }),
//   async (uri, { userId }) => ({
//     contents: [{
//       uri: uri.href,
//       text: `Profile data for user ${userId}`
//     }]
//   })
// );
// MCP tool для текста
// mcpServer.tool(
//   "getChatResponseFromLLM",
//   { prompt: z.string() },
//   async ({ prompt }, extra) => {
//     const userPrompt = `${prompt}\nОтветь текстом для чата без JSON или других форматов.`;
//     const result = await llm.invoke([{ role: "user", content: userPrompt }]);
//     let text: string;
//     if (typeof result.content === "string") {
//       text = result.content;
//     } else if (Array.isArray(result.content)) {
//       text = result.content.map((c: any) => (typeof c.text === "string" ? c.text : "")).join("\n");
//     } else {
//       text = JSON.stringify(result.content);
//     }
//     return {
//       content: [{ type: "text", text }]
//     };
//   }
// );
mcpServer.tool("classifyRequest", { prompt: z.string() }, async ({ prompt }) => {
    const classificationPrompt = `${prompt}\nОтветь одним словом: "chart" если нужен график, или "chat" если нет.`;
    const result = await llm.invoke([{ role: "user", content: classificationPrompt }]);
    let text = typeof result.content === "string" ? result.content.trim().toLowerCase() : "chat";
    if (text.includes("chart"))
        return { content: [{ type: "text", text: "chart" }] };
    return { content: [{ type: "text", text: "chat" }] };
});
// Запуск MCP сервера через stdio
await mcpServer.connect(new StdioServerTransport());
//# sourceMappingURL=mcp-server.js.map