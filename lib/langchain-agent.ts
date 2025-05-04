import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

type MCPToolContent = { type: "text"; text: string };
type MCPToolResult = { content: MCPToolContent[] };

// Изменяем тип возвращаемого значения на Promise<string | object>
export async function getChartDataFromLLM(prompt: string): Promise<string | object> {
  const transport = new StdioClientTransport({
    command: "node",
    // Убедитесь, что путь верный, например:
    args: ["dist/mcp-server.js"] // Или тот путь, который вы исправили
  });
  const client = new Client({
    name: "nol-mcp-client",
    version: "1.0.0"
  });

  let responseData: string | object = "Произошла ошибка при получении ответа."; // Значение по умолчанию

  try {
    await client.connect(transport);

    const result = await client.callTool({
      name: "getChartDataFromLLM", // Убедитесь, что имя инструмента верное
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
        // Пытаемся распарсить как JSON
        responseData = JSON.parse(rawText);
        // Если успешно, responseData теперь объект (для ECharts)
        console.log("Получены данные JSON для графика.");
      } catch (parseError) {
        // Если не JSON, значит это обычный текст (для чата)
        responseData = rawText;
        console.log("Получен обычный текст (не JSON).");
      }

    } else {
      console.error("Некорректный формат ответа MCP tool:", result);
      responseData = "Некорректный формат ответа от LLM.";
    }
  } catch (error) {
      console.error("Ошибка при вызове MCP tool:", error);
      responseData = `Ошибка при взаимодействии с LLM: ${error instanceof Error ? error.message : String(error)}`;
  } finally {
      // Просто вызываем close(), он должен обработать все случаи
      await client.close();
  }

  // Возвращаем либо объект JSON, либо строку текста/ошибки
  return responseData;
}