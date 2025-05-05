import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

type MCPToolContent = { type: "text"; text: string };
type MCPToolResult = { content: MCPToolContent[] };

export async function getChartDataFromLLM(prompt: string): Promise<string | object> {
  return await callMCPTool("getChartDataFromLLM", prompt);
}

export async function getChatResponseFromLLM(prompt: string): Promise<string | object> {
  return await callMCPTool("getChatResponseFromLLM", prompt);
}

async function callMCPTool(toolName: string, prompt: string): Promise<string | object> {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["dist/mcp-server.js"]
  });
  const client = new Client({
    name: "nol-mcp-client",
    version: "1.0.0"
  });

  let responseData: string | object = "Произошла ошибка при получении ответа.";

  try {
    await client.connect(transport);

    const result = await client.callTool({
      name: toolName,
      arguments: { prompt }
    }) as MCPToolResult;

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
        responseData = JSON.parse(rawText);
        console.log("Получены данные JSON.");
      } catch (parseError) {
        responseData = rawText;
        console.log("Получен текст.");
      }

    } else {
      console.error("Некорректный формат ответа MCP tool:", result);
      responseData = "Некорректный формат ответа от LLM.";
    }
  } catch (error) {
      console.error("Ошибка при вызове MCP tool:", error);
      responseData = `Ошибка при взаимодействии с LLM: ${error instanceof Error ? error.message : String(error)}`;
  } finally {
      await client.close();
  }

  return responseData;
}