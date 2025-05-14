import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
async function testServer() {
    // Создаем транспорт, который подключается к стандартным потокам сервера
    const transport = new StdioClientTransport({
        command: "node",
        args: ["dist/mcp/mcp-server.js"]
    });
    // Создаем клиент MCP
    const client = new Client({
        name: "nol-mcp-client",
        version: "1.0.0"
    });
    await client.connect(transport);
    try {
        // Вызываем инструмент fetchUserFromDemoDb
        const result = await client.callTool({
            name: "fetchUserFromDemoDb",
            arguments: { userId: "1" }
        });
        console.log("Результат вызова инструмента:", result);
    }
    catch (error) {
        console.error("Ошибка при вызове инструмента:", error);
    }
    finally {
        // Закрываем соединение и завершаем процесс сервера
        await client.close();
    }
}
testServer().catch(console.error);
