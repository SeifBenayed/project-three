import { MongoClient } from 'mongodb';
import mongoClientPromise from '@/app/lib/mongodb';

export async function POST(req: Request) {
    const client = await mongoClientPromise;
    const dbName = "hedi";
    const collectionName = "ingredients";
    const collection_ingredient = client.db(dbName).collection(collectionName);
    // Get the list of ingredients from the request body as a plain text string
    const { body } = await req.json();
    if (!body) {
        throw new Error('Missing ingredientsString in request body');
    }

    const ingredients = body.split(',').map((ingredient: string) => ingredient.trim());
// Prepare an array to hold the safety results
    const safetyResults = [];    // Prepare an array to hold the safety results
    let ingredient
    // Iterate through each ingredient and use Atlas Search to find its safety status
    for (ingredient of ingredients) {
        const result = await collection_ingredient.aggregate([
            {
                $search: {
                    index: "ingredient_search", // Ensure this matches the name of your Atlas Search index
                    text: {
                        query: ingredient,
                        path: "Name" // Ensure this matches the field you want to search
                    }
                }
            },
            {
                $limit: 1
            }
        ]).toArray();

        if (result.length > 0) {
            safetyResults.push({
                ingredient: ingredient,
                general_safety: result[0].General_Safety,
            });
        } else {
            safetyResults.push({
                ingredient: ingredient,
                general_safety: "Not Found",
            });
        }
    }

    // Return the safety results as a JSON response
    return new Response(JSON.stringify(safetyResults), {
        headers: { 'Content-Type': 'application/json' },
    });
}
