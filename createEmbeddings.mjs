import { promises as fsp } from "fs";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MongoDBAtlasVectorSearch } from "langchain/vectorstores/mongodb_atlas";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { MongoClient } from "mongodb";
import 'dotenv/config'
console.log(process.env );

const client = new MongoClient(process.env.MONGODB_ATLAS_URI || "");
const dbName = "docs";
const collectionName = "embeddings";
const collection = client.db(dbName).collection(collectionName);
const docs_dir = "_assets/fcc_docs/products.json";
console.log(fileNames);

  const document = await fsp.readFile(`${docs_dir}`, "utf8");
  console.log(`Vectorizing ${fileName}`);

  const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
    chunkSize: 500,
    chunkOverlap: 50,
  });
  const output = await splitter.createDocuments([document]);

  await MongoDBAtlasVectorSearch.fromDocuments(
    output,
    new OpenAIEmbeddings(),
    {
      collection,
      indexName: "default",
      textKey: "text",
      embeddingKey: "embedding",
    }
  );

console.log("Done: Closing Connection");
await client.close();
