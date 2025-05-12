import * as dotenv from "dotenv";
import { ChatGroq } from "@langchain/groq";
import { JsonOutputParser, StringOutputParser, StructuredOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableLambda, RunnableSequence } from "@langchain/core/runnables";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import { DynamicStructuredTool, tool } from "@langchain/core/tools";
import { z } from "zod";

dotenv.config();

const model = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0
});

const chartTool = tool(
  async (input): Promise<string> => {
    return `${input}\nGenerate a valid ECharts JSON configuration object with a series array. Respond ONLY with JSON, no extra text or markdown.`;
  },
  {
    name: "chartData",
    description: "Adds two numbers together",
    schema: z.string(),
  }
);

const chatTool = tool(
  async (input): Promise<string> => {
    return `You are a helpful assistant to answer questions ${input}`;
  },
  {
    name: "chatData",
    description: "Adds two numbers together",
    schema: z.string(),
  }
)

// const parserTool = new DynamicStructuredTool({
//   name: "multiply",
//   description: `You are a helpful assistant and you make decisions when generate chart data for eCharts based on the user's input. Also provide a textual summary or answer related to the input if appropriate ${input}`,
//   schema: z.object({
//     a: z.number().describe("the first number to multiply"),
//     b: z.number().describe("the second number to multiply"),
//   }),
//   func: async ({ a, b }: { a: number; b: number }) => {
//     return (a * b).toString();
//   },
// });

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant and you make decisions when generate chart data for eCharts based on the user's input. Also provide a textual summary or answer related to the input if appropriate"],
  ["human", "{input}"],
]);
// const prompt = ChatPromptTemplate.fromTemplate(
//   "Answer the user query.\n{format_instructions}\n{input}\n"
// );

// const parser = new JsonOutputParser();
// const formatInstructions = `Generate JSON data for eCharts based on the prompt answer`;
// const partialedPrompt = await prompt.partial({
//   format_instructions: formatInstructions,
// });

const chain = prompt.pipe(model).pipe(new StringOutputParser());
// const  ch = partialedPrompt.pipe(model).pipe(parser)

const composedChainWithLambda = RunnableSequence.from([
  chain,
  (input) => ({ input: input }),
  prompt,
  model,
  new StringOutputParser(),
]);


const result = await composedChainWithLambda.invoke({ input: 'как менялась погода поседний год на планете? выведи в формате JSON' });
console.log(result);
const splitter = new RecursiveCharacterTextSplitter({
  // chunkSize: 50,
  chunkOverlap: 1,
  separators: ["```json", "```"],
});

const docOutput = await splitter.splitDocuments([
  new Document({ pageContent: result }),
]);
console.log(docOutput.slice(0, 3));

export async function handleUserRequest(prompt: string) {
  const result = await composedChainWithLambda.invoke({ input: prompt });
  console.log(result);
  const jsonObjects: any[] = [];
  const regex = /```json\s*([\s\S]*?)\s*```/g;
  let match;

  while ((match = regex.exec(result)) !== null) {
    try {
      const jsonObj = JSON.parse(match[1]);
      jsonObjects.push(jsonObj);
    } catch (error) {
      console.error("Failed to parse JSON block:", error);
      // Можно добавить обработку ошибки, если JSON некорректен
    }
  }

  console.log(jsonObjects);
  return { text: result, jsonObjects: jsonObjects };
}