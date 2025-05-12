import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListResourcesRequestSchema, ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import path from "path";
import fs from 'fs/promises';
import os from 'os';
import { z } from "zod";

const server = new Server({
  name: "NOL MCP",
  version: "1.0.0",
  capabilities: {
    resources: {
      list: true,
      read: true
    },
    tools: {}
  }
});

// ДОБАВЬТЕ ЭТУ СТРОКУ ДЛЯ ОТЛАДКИ:
console.log("DEBUG: Server capabilities during init:", JSON.stringify(server));

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "file://Desktop/deepcase/data.json",
        name: "Data for chart",
        mimeType: "application/json",
      }
    ]
  }
})

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  if (uri === 'file://Desktop/deepcase/data.json') {
    const jsonContent = await readJsonFile();
    return {
      contents: [
        {
          uri: "file://Desktop/deepcase/data.json",
          text: JSON.stringify(jsonContent)
        }
      ]
    }
  }
  throw new Error(`Resource not found: ${uri}`);
})

async function readJsonFile() {
  try {
    const jsonPath = path.resolve('/Desktop/deepcase/data.json');

    // читаем файл
    const data = await fs.readFile(jsonPath, 'utf8');
    return data;
  } catch (error) {
    console.error('Error reading JSON file:', error);
    return 'Error reading log file: ' + (error instanceof Error ? error.message : String(error));
  }
}

async function main () {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log("Server started");
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}
main();
