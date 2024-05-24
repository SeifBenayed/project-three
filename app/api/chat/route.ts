import { StreamingTextResponse, LangChainStream, Message } from 'ai';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { AIMessage, HumanMessage } from 'langchain/schema';

export const runtime = 'edge';

function extractProductAndQuery(input: string): { product: string; query: string } {
  const separator = " zebi ";
  const parts = input.split(separator);

  if (parts.length !== 2) {
    throw new Error("Invalid format. Please provide the product and query separated by ' zebi '.");
  }

  const product = parts[0].trim();
  const query = parts[1].trim();

  return { product, query };
}

export async function POST(req: Request) {
  const { messages } = await req.json();
  const currentMessageContent = messages[messages.length - 1].content;
  const { product, query } = extractProductAndQuery(currentMessageContent);
  const vectorSearch = await fetch("http://localhost:3000/api/vectorSearch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: product,
  }).then((res) => res.json());



  const TEMPLATE = `I want you to act as a beauty expert. Your passion lies in helping people check if the products suit their needs. Using the provided product information (product, brand, ingredients, rating, sources, description, how to use) and reviews from various platforms, please respond to the user query: ${query}. If you are not sure about the answer, please respond with "Sorry, I don't know how to help with that."

product information and reviews sections:
"""
${product}
${JSON.stringify(vectorSearch)}
"""

  
  Answer:

  `;
  messages[messages.length -1].content = TEMPLATE;

  const { stream, handlers } = LangChainStream();

  const llm = new ChatOpenAI({
    modelName: "gpt-4-turbo",
    streaming: true,
  });

  llm
    .call(
      (messages as Message[]).map(m =>
        m.role == 'user'
          ? new HumanMessage(m.content)
          : new AIMessage(m.content),
      ),
      {},
      [handlers],
    )
    .catch(console.error);


  return new StreamingTextResponse(stream);
}
