import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from "node-fetch";
import * as fs from "fs/promises";
import * as path from "path";
// Create MCP server instance
const server = new McpServer({ name: "NOL MCP Server", version: "1.0.0" });
// --- Tool: External Database API (Demo) ---
// Example: fetch user data from a fake REST API
server.tool("fetchUserFromDemoDb", { userId: z.string() }, async ({ userId }) => {
    const response = await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`);
    if (!response.ok) {
        return {
            content: [], // Добавляем пустой массив content
            error: `User with id ${userId} not found`,
            isError: true // Указываем, что это ошибка
        };
    }
    const user = await response.json();
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(user),
            },
        ],
    };
});
// --- Tool: CRM Integration (amoCRM example) ---
// This is a simplified example that fetches a contact by ID from amoCRM demo API
// In real usage, authentication and proper API calls are needed
server.tool("fetchAmoCrmContact", { contactId: z.string() }, async ({ contactId }) => {
    // Demo URL - replace with real amoCRM API endpoint and auth
    const amoCrmDemoUrl = `https://demo.amocrm.com/api/v4/contacts/${contactId}`;
    try {
        const response = await fetch(amoCrmDemoUrl, {
            headers: {
                Authorization: `Bearer DEMO_ACCESS_TOKEN`, // Replace with real token
                Accept: "application/json",
            },
        });
        if (!response.ok) {
            return {
                content: [], // Добавляем пустой массив content
                error: `Contact with id ${contactId} not found`,
                isError: true // Указываем, что это ошибка
            };
        }
        const contact = await response.json();
        return {
            content: [
                {
                    type: "text",
                    text: contactId,
                },
            ],
        };
    }
    catch (e) { // Явно типизируем 'e' или используем 'unknown' и проверяем тип
        return {
            content: [], // Добавляем пустой массив content
            error: `Failed to fetch amoCRM contact: ${e.message}`,
            isError: true // Указываем, что это ошибка
        };
    }
});
// --- Tool: Local File Reader ---
// Reads a file from a given path and returns its contents as text
server.tool("readLocalFile", { filePath: z.string() }, async ({ filePath }) => {
    try {
        // For security, restrict to a specific base directory (e.g., ./data)
        const baseDir = path.resolve("./data");
        const resolvedPath = path.resolve(filePath);
        if (!resolvedPath.startsWith(baseDir)) {
            return {
                content: [], // Добавляем пустой массив content
                error: "Access denied: file path outside allowed directory",
                isError: true // Указываем, что это ошибка
            };
        }
        const content = await fs.readFile(resolvedPath, "utf-8");
        return {
            content: [
                {
                    type: "text",
                    text: content,
                },
            ],
        };
    }
    catch (e) {
        return {
            content: [], // Добавляем пустой массив content
            error: `Failed to read file: ${e.message}`,
            isError: true // Указываем, что это ошибка
        };
    }
});
// --- Resource: Generic Data Reader ---
// Example resource that returns some static or dynamic data
server.resource("exampleData://info", new ResourceTemplate("exampleData://info", { list: undefined }), async (uri) => {
    return {
        contents: [
            {
                uri: uri.href,
                text: "This is example data from the MCP server resource.",
            },
        ],
    };
});
// Start MCP server using stdio transport (for demo/testing)
async function start() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log("MCP server running...");
}
start().catch(console.error);
//# sourceMappingURL=mcp-server.js.map