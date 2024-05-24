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
  let messages;
  try {
    const bodyText = await req.text();
    console.log("Received body text:", bodyText); // Log the raw body text
    const body = JSON.parse(bodyText);
    messages = body.messages;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return new Response(JSON.stringify({ error: "Invalid JSON format" }), { status: 400 });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "Invalid messages format" }), { status: 400 });
  }

  const currentMessageContent = messages[messages.length - 1].content;
  if (typeof currentMessageContent !== 'string') {
    return new Response(JSON.stringify({ error: "Invalid message content format" }), { status: 400 });
  }

  let product, query;
  try {
    ({ product, query } = extractProductAndQuery(currentMessageContent));
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  let vectorSearch;
  try {
    const vectorSearchResponse = await fetch("http://localhost:3000/api/vectorSearch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ product }), // Ensure the body is a valid JSON
    });

    const vectorSearchText = await vectorSearchResponse.text();
    console.log("Received vector search response:", vectorSearchText); // Log the raw response text

    vectorSearch = JSON.parse(vectorSearchText); // Attempt to parse the response
  } catch (error) {
    console.error("Error fetching vector search or parsing response:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch or parse vector search" }), { status: 500 });
  }

  const TEMPLATE = `I want you to act as a beauty expert. Your passion lies in helping people check if the products suit their needs. Using the provided product information (product, brand, ingredients, rating, sources, description, how to use) and reviews from various platforms, please respond to the user query: ${query}. If you are not sure about the answer, please respond with "Sorry, I don't know how to help with that."

product information and reviews sections:
"""
${product}
${JSON.stringify(vectorSearch)}
"""

Answer:

`;
  messages[messages.length - 1].content = TEMPLATE;

  const { stream, handlers } = LangChainStream();

  const llm = new ChatOpenAI({
    modelName: "gpt-4-turbo",
    streaming: true,
  });

  try {
    await llm.call(
        (messages as Message[]).map(m =>
            m.role == 'user'
                ? new HumanMessage(m.content)
                : new AIMessage(m.content),
        ),
        {},
        [handlers],
    );
  } catch (error) {
    console.error("Error calling language model:", error);
    return new Response(JSON.stringify({ error: "Failed to call language model" }), { status: 500 });
  }

  return new StreamingTextResponse(stream);
}
