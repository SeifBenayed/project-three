import { MongoClient } from 'mongodb';
import mongoClientPromise from '@/app/lib/mongodb';

export async function POST(req: Request) {
    const client = await mongoClientPromise;
    const dbName = "hedi";
    const collectionName = "user_query";
    const collection_ingredient = client.db(dbName).collection(collectionName);
        // Get the list of ingredients from the request body as a plain text string
        const  body  = await req.text();

    const headers = JSON.stringify(req.headers);
    const IP =  JSON.stringify(req.ip);
    const agent = req.headers["user-agent"];
    const language =  req.headers["accept-language"];

    if (!body) {
            throw new Error('Missing body in request body');
        }

        // Insert the request body into the database
    const result = await collection_ingredient.insertOne({ body, createdAt: new Date(),headers, IP, agent, language, country });

        // Return the result of the insertion
    return new Response(JSON.stringify({ insertedId: result.insertedId }), {
        headers: { 'Content-Type': 'application/json' },
    });
}
