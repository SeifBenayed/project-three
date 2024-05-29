import { MongoClient } from 'mongodb';
import mongoClientPromise from '@/app/lib/mongodb';

export async function POST(req: Request) {
    const client = await mongoClientPromise;
    const dbName = "hedi";
    const collectionName = "user_query";
    const collection_ingredient = client.db(dbName).collection(collectionName);
    try {
        // Get the list of ingredients from the request body as a plain text string
        const { body } = await req.json();
        if (!body) {
            throw new Error('Missing body in request body');
        }

        // Insert the request body into the database
        const result = await collection_ingredient.insertOne({ body, createdAt: new Date() });

        // Return the result of the insertion
        return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        // Return an error response if something goes wrong
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
